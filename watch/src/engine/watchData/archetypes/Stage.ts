import { drawGekisouStageLight, gekisouStageFrame } from "../../../../../shared/src/engine/data/gekisouStage.js";
import { initializeConnectWallDraw, drawConnectWalls } from "../particle.js";
import { updateConnectWalls } from "../connectWalls.js";
import { particle } from "../particle.js";
import { retireSimpleLoopSources } from "../../../../../shared/src/engine/data/simpleLoopSource.js";
import { updateNativeLaneFeedback } from "../laneFeedback.js";
import {
  nativeLaneLineLayout,
  nativeOutsideLineLayout,
} from "../../../../../shared/src/engine/data/nativeLaneLines.js";
import {
  consumeLuckDraw,
  luckGaugeLimit,
  luckMemory,
  recordLuckNote,
} from "../../../../../shared/src/engine/data/gekisouLuck.js";
import { soloModeReplay } from "../../../../../shared/src/engine/data/soloMode.js";
import { drawAssistHud, drawGekisouHud, gekisouHudVisible } from "../../../../../shared/src/engine/data/soloModeHud.js";
import {
  getNativeArrowAnimationSkin,
  NativeArrowAnimationSkin,
} from "../../../../../shared/src/engine/data/nativeArrowAnimation.js";
import { updateNativeArrowFrames } from "../../../../../shared/src/engine/data/nativeArrowFrames.js";
import {
  laneBase,
  nativeJudgmentLineHalfHeight,
  nativeStage,
  projectLaneZ,
} from "../../../../../shared/src/engine/data/lane.js";
import { perspectiveLayout } from "../../../../../shared/src/engine/data/utils.js";
import { options } from "../../configuration/options.js";
import { note } from "../note.js";
import { approach } from "../../../../../shared/src/engine/data/note.js";
import { simLine } from "../../../../../shared/src/engine/data/simLine.js";
import { readScrollTime } from "../../../../../shared/src/engine/data/scroll.js";
import { chartExtent } from "../chartExtent.js";
import { effect, sfxDistance } from "../effect.js";
import { scheduleHeldSound } from "../sound.js";
import { scaledScreen } from "../scaledScreen.js";
import { layer, skin } from "../skin.js";
import { archetypes } from "./index.js";
import { sortHeldIntervals } from "../../../../../shared/src/engine/data/sortHeldIntervals.js";

const emptyLuck = { gauge: 0, lots: 0, rushCombo: 0, nextDraw: 0, points: 0, lastDraw: 0, lastDrawAt: 0 };
const nextLuckSeed = (seed: number) => (seed * 48271) % 2147483647;
const seedScale = 1 / 2147483647;

export class Stage extends Archetype {
  gekisouFrame = this.entityMemory(Number);
  heldConnectorHead = this.entityMemory(Number);
  gekisouDemoHeads = this.defineSharedMemory({ ranges: Tuple(3, Number) });
  gekisouDemo = this.entityMemory(
    Tuple(3, { mission: Number, head: Number, next: Number, count: Number, seed: Number, luck: luckMemory }),
  );
  gekisouDemoTime = this.entityMemory(Number);

  indexHeldConnectors() {
    this.heldConnectorHead = -1;
    for (const info of entityInfos) {
      if (
        info.archetype !== archetypes.NormalActiveSlideConnector.index &&
        info.archetype !== archetypes.CriticalActiveSlideConnector.index
      )
        continue;
      // Both variants inherit the same SlideConnector imports and audio cache.
      const connector = archetypes.NormalActiveSlideConnector.import.get(info.index);
      if (replay.isReplay && connector.startRef !== connector.headRef) continue;
      const startNotes = archetypes.NormalActiveSlideConnector.slideStartNote.import;
      const cached = archetypes.NormalActiveSlideConnector.heldAudioLinks.get(info.index);
      cached.start = bpmChanges.at(startNotes.get(connector.headRef).beat).time;
      cached.end = bpmChanges.at(startNotes.get(connector.tailRef).beat).time;
      cached.lineEnd = bpmChanges.at(startNotes.get(connector.endRef).beat).time;
      cached.streamId = connector.startRef;
      if (replay.isReplay) {
        cached.start = -999999;
        if (!this.readNextHeldInterval(info.index)) continue;
      } else if (cached.end <= cached.start) continue;
      cached.next = this.heldConnectorHead;
      this.heldConnectorHead = info.index;
    }
    this.heldConnectorHead = sortHeldIntervals(
      this.heldConnectorHead,
      archetypes.NormalActiveSlideConnector.heldAudioLinks,
    );
  }

  readNextHeldInterval(index: number) {
    const cached = archetypes.NormalActiveSlideConnector.heldAudioLinks.get(index);
    let key = cached.start;
    while (true) {
      const next = streams.getNextKey(cached.streamId, key);
      if (next === key) return false;
      const end = Math.min(streams.getValue(cached.streamId, next), cached.lineEnd);
      if (end > next) {
        cached.start = next;
        cached.end = end;
        return true;
      }
      key = next;
    }
  }

  insertHeldConnector(index: number) {
    const cached = archetypes.NormalActiveSlideConnector.heldAudioLinks.get(index);
    if (
      this.heldConnectorHead < 0 ||
      cached.start < archetypes.NormalActiveSlideConnector.heldAudioLinks.get(this.heldConnectorHead).start
    ) {
      cached.next = this.heldConnectorHead;
      this.heldConnectorHead = index;
      return;
    }
    let current = this.heldConnectorHead;
    while (true) {
      const next = archetypes.NormalActiveSlideConnector.heldAudioLinks.get(current).next;
      if (next < 0 || cached.start < archetypes.NormalActiveSlideConnector.heldAudioLinks.get(next).start) {
        cached.next = next;
        archetypes.NormalActiveSlideConnector.heldAudioLinks.get(current).next = index;
        return;
      }
      current = next;
    }
  }

  spawnTime() {
    return -999999;
  }

  despawnTime() {
    return 999999;
  }

  preprocessOrder = 2;
  preprocess() {
    initializeConnectWallDraw();
    if (options.gekisouMode && !replay.isReplay) this.initializeGekisouDemo();
    if (options.sfxEnabled && effect.clips.normalHold.exists) {
      this.indexHeldConnectors();
      this.scheduleHeldSFX();
    }

    if (options.sfxEnabled) {
      let t = -999999;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const nt = streams.getNextKey(-9999, t);
        if (nt === t) break;

        t = nt;
        effect.clips.stage.schedule(t, sfxDistance);
      }
    }

    if (options.laneEffectEnabled) {
      for (let i = 0; i < 12; i++) {
        archetypes.EmptyEffect.spawn({
          l: i - 6,
        });
      }
    }
  }

  scheduleHeldSFX() {
    // Merge the sorted next intervals. Each replay activation is read once,
    // and only a line whose interval was consumed needs another stream seek.
    while (this.heldConnectorHead >= 0) {
      let index = this.heldConnectorHead;
      const first = archetypes.NormalActiveSlideConnector.heldAudioLinks.get(index);
      const start = first.start;
      let end = first.end;
      this.heldConnectorHead = first.next;
      if (replay.isReplay && this.readNextHeldInterval(index)) this.insertHeldConnector(index);

      while (this.heldConnectorHead >= 0) {
        index = this.heldConnectorHead;
        const next = archetypes.NormalActiveSlideConnector.heldAudioLinks.get(index);
        if (next.start > end) break;
        end = Math.max(end, next.end);
        this.heldConnectorHead = next.next;
        if (replay.isReplay && this.readNextHeldInterval(index)) this.insertHeldConnector(index);
      }
      scheduleHeldSound(start, end);
    }
  }

  initializeGekisouDemo() {
    const data = archetypes.Initialization.import.get(0);
    const links = archetypes.NormalTapNote.gekisouLink;
    for (let i = 0; i < 3; i++) {
      const head = this.gekisouDemoHeads.ranges.get(i) - 1;
      const sorted = head >= 0 ? sortHeldIntervals(head, links) : -1;
      const mission = i === 0 ? data.mission1 : i === 1 ? data.mission2 : data.mission3;
      this.gekisouDemo.set(i, { mission, head: sorted, next: sorted, count: 0, seed: sorted + 2, luck: emptyLuck });
    }
  }

  updateGekisouDemo(now: number) {
    const links = archetypes.NormalTapNote.gekisouLink;
    for (let i = 0; i < 3; i++) {
      if (now < this.gekisouDemoTime) {
        const progress = this.gekisouDemo.get(i);
        this.gekisouDemo.set(i, {
          mission: progress.mission,
          head: progress.head,
          next: progress.head,
          count: 0,
          seed: progress.head + 2,
          luck: emptyLuck,
        });
      }
      const progress = this.gekisouDemo.get(i);
      if (progress.next < 0 || links.get(progress.next).start > now) continue;
      while (progress.next >= 0) {
        const event = links.get(progress.next);
        if (event.start > now) break;
        progress.next = event.next;
        if (progress.mission !== 2) {
          progress.count++;
          continue;
        }
        progress.seed = nextLuckSeed(progress.seed);
        recordLuckNote(progress.luck, event.operateType, 5, progress.seed * seedScale);
        if (progress.luck.lots > 0) {
          const first = nextLuckSeed(progress.seed);
          progress.seed = nextLuckSeed(first);
          consumeLuckDraw(
            progress.luck,
            event.start / 1000 + input.offset,
            first * seedScale,
            progress.seed * seedScale,
          );
        }
      }
      this.gekisouDemo.set(i, progress);
    }
    this.gekisouDemoTime = now;
  }

  updateSequential() {
    updateConnectWalls();
    if (particle.effects.sourceSimpleLoop.exists) retireSimpleLoopSources(time.now, time.skip);
    updateNativeLaneFeedback();
    if (options.gekisouMode) {
      this.updateGekisouStage();
      if (!replay.isReplay) this.updateGekisouDemo(Math.floor((time.now - input.offset) * 1000));
    }
    if (!options.markerAnimation) return;
    const nativeSkin = getNativeArrowAnimationSkin(
      skin.sprites.nativeArrowAnimationSkin001.exists,
      skin.sprites.nativeArrowAnimationSkin002.exists,
      skin.sprites.nativeArrowAnimationSkin003.exists,
    );
    if (nativeSkin !== NativeArrowAnimationSkin.None) updateNativeArrowFrames(nativeSkin, time.now);
  }

  updateParallel() {
    drawConnectWalls();
    // Do not substitute the generic six-lane PJS stage for Unity's
    // authored lane_base geometry. Missing native stage data fails closed.
    if (skin.sprites.sekaiStage.exists) this.drawSekaiStage();

    drawGekisouStageLight(skin.sprites.gekisouStage0, this.gekisouFrame, layer.stage + 0.5);
    this.drawLaneDetails();
    if (options.gekisouMode || (options.assistMode && replay.isReplay)) this.drawModeHud();
  }

  updateGekisouStage() {
    const mode = options.gekisouEffectMode;
    if (options.lightweightMode || mode === 0) return;
    const data = archetypes.Initialization.import.get(0);
    const now = Math.floor((time.now - input.offset) * 1000);
    const third = gekisouStageFrame(now, data.mission3, data.start3, data.end3, mode);
    if (third >= 0) {
      this.gekisouFrame = third;
      return;
    }
    const second = gekisouStageFrame(now, data.mission2, data.start2, data.end2, mode);
    this.gekisouFrame = second >= 0 ? second : gekisouStageFrame(now, data.mission1, data.start1, data.end1, mode);
  }

  drawModeHud() {
    if (options.assistMode && replay.isReplay)
      drawAssistHud(skin.sprites, this.soloStream(soloModeReplay.assistLevel), scaledScreen.r, scaledScreen.b, scaledScreen.wToH);

    if (!options.gekisouMode) return;
    const data = archetypes.Initialization.import.get(0);
    const now = Math.floor((time.now - input.offset) * 1000);
    for (let i = 0; i < 3; i++) {
      const mission = i === 0 ? data.mission1 : i === 1 ? data.mission2 : data.mission3;
      const start = i === 0 ? data.start1 : i === 1 ? data.start2 : data.start3;
      const end = i === 0 ? data.end1 : i === 1 ? data.end2 : data.end3;
      if (!gekisouHudVisible(now, mission, start, end)) continue;
      const demo = this.gekisouDemo.get(i);
      const gauge = replay.isReplay && mission === 2 ? this.soloStream(soloModeReplay.luckGauge - i) : -1;
      const rush = replay.isReplay ? Math.max(0, Math.floor(gauge / 256)) : demo.luck.rushCombo;
      const drawId = soloModeReplay.luckDraw - i;
      const drawAt = gauge >= 0 && !streams.has(drawId, time.now) ? streams.getPreviousKey(drawId, time.now) : time.now;
      const draw = gauge >= 0 && streams.has(drawId, drawAt) ? streams.getValue(drawId, drawAt) : 0;
      drawGekisouHud(skin.sprites, {
        mission,
        sinceStart: now - start,
        sinceEnd: now - end,
        value:
          mission !== 2 && replay.isReplay
            ? this.soloStream(soloModeReplay.mission - i * 2 + (mission === 3 ? 1 : 0))
            : demo.count,
        luckGauge: (replay.isReplay ? gauge % 256 : demo.luck.gauge) / luckGaugeLimit(rush),
        luckRush: rush,
        luckDraw: replay.isReplay ? draw : demo.luck.lastDraw,
        luckAge: time.now - (replay.isReplay ? drawAt : demo.luck.lastDrawAt),
      });
      break;
    }
  }

  soloStream(id: number) {
    if (streams.has(id, time.now)) return streams.getValue(id, time.now);
    const key = streams.getPreviousKey(id, time.now);
    return streams.has(id, key) ? streams.getValue(id, key) : 0;
  }

  drawSekaiStage() {
    skin.sprites.sekaiStage.draw(
      new Rect(laneBase.layout),
      [layer.stage],
      laneBase.materialOpacity * options.laneOpacity,
    );
  }

  // Bar order follows musical time even when the selected visual clock reverses.
  barCursor = this.entityMemory(Number);

  drawBarLines() {
    if (!options.measureLineDisplay || !skin.sprites.simLine.exists) return;
    const ref = chartExtent.barScrollRef;
    const clock = archetypes.ScrollClock.sharedMemory.get(ref);
    const now = ref > 0 ? clock.current : time.scaled;
    const timeline = ref > 0 ? time.now : now;

    for (let i = 0; i < 64; i++) {
      if (this.barCursor < 4) break;
      if (this.barTimelineTime(this.barCursor - 4, ref) <= timeline) break;
      this.barCursor -= 4;
    }
    for (let i = 0; i < 64; i++) {
      if (this.barTimelineTime(this.barCursor, ref) > timeline) break;
      this.barCursor += 4;
    }

    for (let i = 0; i < 16; i++) {
      const beat = this.barCursor + i * 4;
      if (beat > chartExtent.lastBeat) break;
      const target = this.barTimelineTime(beat, ref);
      if (target <= timeline) continue;
      const scaledTime =
        ref > 0 ? readScrollTime(clock.segment, target, (index) => archetypes.ScrollClock.import.get(index)) : target;
      const depth = scaledTime - now;
      if (depth > note.duration) {
        if (ref <= 0) break;
        continue;
      }
      if (depth < 0 || (options.laneCover > 0 && depth > note.coverDuration)) continue;
      if (options.hidden > 0 && depth < note.duration * options.hidden) continue;

      const y = approach(-note.duration, 0, -depth);
      skin.sprites.simLine.draw(
        new Rect({ l: -6 * y, r: 6 * y, b: y + simLine.h, t: y - simLine.h }),
        [layer.barLine],
        0.5,
      );
    }
  }

  barTimelineTime(beat: number, ref: number) {
    const raw = bpmChanges.at(beat).time;
    return ref > 0 ? raw : timeScaleChanges.at(raw).scaledTime;
  }

  drawLaneDetails() {
    this.drawGuidelines();
    this.drawOutsideLines();
    this.drawTapArea();
    this.drawJudgmentLine();
    this.drawBarLines();
  }

  drawTapArea() {
    if (!skin.sprites.laneTapArea.exists) return;

    const halfWidth = (nativeStage.tapAreaWidth / nativeStage.laneWidth) * 6;
    const halfLength = nativeStage.tapAreaLength / 2;
    const innerHalfLength = halfLength - nativeStage.tapAreaBorder;
    const borderX = (nativeStage.tapAreaBorder / nativeStage.laneWidth) * 12;
    const x0 = -halfWidth;
    const x1 = x0 + borderX;
    const x2 = halfWidth - borderX;
    const x3 = halfWidth;
    const y0 = projectLaneZ(nativeStage.judgmentZ + halfLength);
    const y1 = projectLaneZ(nativeStage.judgmentZ + innerHalfLength);
    const y2 = projectLaneZ(nativeStage.judgmentZ - innerHalfLength);
    const y3 = projectLaneZ(nativeStage.judgmentZ - halfLength);

    if (
      !skin.sprites.laneTapAreaTopLeft.exists ||
      !skin.sprites.laneTapAreaTop.exists ||
      !skin.sprites.laneTapAreaTopRight.exists ||
      !skin.sprites.laneTapAreaLeft.exists ||
      !skin.sprites.laneTapAreaCenter.exists ||
      !skin.sprites.laneTapAreaRight.exists ||
      !skin.sprites.laneTapAreaBottomLeft.exists ||
      !skin.sprites.laneTapAreaBottom.exists ||
      !skin.sprites.laneTapAreaBottomRight.exists
    ) {
      skin.sprites.laneTapArea.draw(
        perspectiveLayout({ l: x0, r: x3, b: y3, t: y0 }),
        [layer.tapArea],
        options.laneOpacity,
      );
      return;
    }

    this.drawTapAreaPart(skin.sprites.laneTapAreaTopLeft, x0, x1, y1, y0);
    this.drawTapAreaPart(skin.sprites.laneTapAreaTop, x1, x2, y1, y0);
    this.drawTapAreaPart(skin.sprites.laneTapAreaTopRight, x2, x3, y1, y0);
    this.drawTapAreaPart(skin.sprites.laneTapAreaLeft, x0, x1, y2, y1);
    this.drawTapAreaPart(skin.sprites.laneTapAreaCenter, x1, x2, y2, y1);
    this.drawTapAreaPart(skin.sprites.laneTapAreaRight, x2, x3, y2, y1);
    this.drawTapAreaPart(skin.sprites.laneTapAreaBottomLeft, x0, x1, y3, y2);
    this.drawTapAreaPart(skin.sprites.laneTapAreaBottom, x1, x2, y3, y2);
    this.drawTapAreaPart(skin.sprites.laneTapAreaBottomRight, x2, x3, y3, y2);
  }

  drawTapAreaPart(sprite: SkinSprite, l: number, r: number, b: number, t: number) {
    sprite.draw(perspectiveLayout({ l, r, b, t }), [layer.tapArea], options.laneOpacity);
  }

  drawJudgmentLine() {
    if (!options.showJudgmentLine || !skin.sprites.nativeJudgmentLine.exists) return;

    const halfWidth = (nativeStage.judgmentLineWidth / nativeStage.laneWidth) * 6;
    skin.sprites.nativeJudgmentLine.draw(
      new Rect({
        l: -halfWidth,
        r: halfWidth,
        b: 1 + nativeJudgmentLineHalfHeight,
        t: 1 - nativeJudgmentLineHalfHeight,
      }),
      // The native judgment LineRenderer is opaque and sits above the tap
      // area; drawing it under the tap area at guideline opacity hid it.
      [layer.judgmentLine],
      1,
    );
  }

  drawGuidelines() {
    if (!skin.sprites.guideline.exists || options.guidelineOpacity <= 0) return;

    const count =
      options.guidelineCount === 1
        ? 4
        : options.guidelineCount === 2
          ? 6
          : options.guidelineCount === 3
            ? 8
            : options.guidelineCount === 4
              ? 12
              : 0;
    const mainDivisor = count ? 24 / count : 0;
    const spaceDivisor = count <= 6 ? 2 : 0;

    for (let index = 1; index < 24; index++) {
      const main = mainDivisor > 0 && index % mainDivisor === 0;
      const space = !main && spaceDivisor > 0 && index % spaceDivisor === 0;
      if (!main && !space) continue;

      const x = index / 2 - 6;
      if (space) {
        const halfWidth = (0.15 / nativeStage.laneWidth) * 6;
        const halfLength = 1.3 / 2;
        skin.sprites.guidelineSpace.draw(
          perspectiveLayout({
            l: x - halfWidth,
            r: x + halfWidth,
            b: projectLaneZ(nativeStage.judgmentZ - halfLength),
            t: projectLaneZ(nativeStage.judgmentZ + halfLength),
          }),
          [layer.guideline],
          options.guidelineOpacity * 0.5019608,
        );
      } else {
        this.drawFullLaneLine(x, 0.15, 0.3, options.guidelineOpacity);
      }
    }
  }

  drawFullLaneLine(x: number, nearWidth: number, farWidth: number, alpha: number) {
    const nearHalfWidth = (nearWidth / 2 / nativeStage.laneWidth) * 12;
    const farHalfWidth = (farWidth / 2 / nativeStage.laneWidth) * 12;
    skin.sprites.guideline.draw(
      nativeLaneLineLayout(x, nearHalfWidth, farHalfWidth, options.lockStageAspectRatio),
      [layer.guideline],
      alpha,
    );
  }

  // The native outside lines keep their authored gradient: no alpha
  // controller writes them, so the guideline opacity option must not either.
  // Their near-to-far fade is baked into the packed strip.
  drawOutsideLines() {
    if (!skin.sprites.outsideLine.exists) return;

    skin.sprites.outsideLine.draw(nativeOutsideLineLayout(-1), [layer.guideline], 1);
    skin.sprites.outsideLine.draw(nativeOutsideLineLayout(1), [layer.guideline], 1);
  }
}

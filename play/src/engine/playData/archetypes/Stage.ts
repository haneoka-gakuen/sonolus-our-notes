import { drawGekisouStageLight, gekisouStageFrame } from "../../../../../shared/src/engine/data/gekisouStage.js";
import { initializeConnectWallDraw, drawConnectWalls } from "../particle.js";
import { updateConnectWalls } from "../particle.js";
import { retireSimpleLoopSources } from "../../../../../shared/src/engine/data/simpleLoopSource.js";
import {
  NativeLaneEffectType,
  nativeEmptyLaneFeedbackPair,
} from "../../../../../shared/src/engine/data/nativeLaneFeedback.js";
import { nativeLaneLineLayout, nativeOutsideLineLayout } from "../../../../../shared/src/engine/data/nativeLaneLines.js";
import {
  getNativeArrowAnimationSkin,
  NativeArrowAnimationSkin,
} from "../../../../../shared/src/engine/data/nativeArrowAnimation.js";
import { updateNativeArrowFrames } from "../../../../../shared/src/engine/data/nativeArrowFrames.js";
import { perspectiveLayout } from "../../../../../shared/src/engine/data/utils.js";
import {
  laneBase,
  nativeJudgmentLineHalfHeight,
  nativeStage,
  projectLaneZ,
} from "../../../../../shared/src/engine/data/lane.js";
import { options } from "../../configuration/options.js";
import { approach } from "../../../../../shared/src/engine/data/note.js";
import { simLine } from "../../../../../shared/src/engine/data/simLine.js";
import { readScrollTime } from "../../../../../shared/src/engine/data/scroll.js";
import { chartExtent } from "../chartExtent.js";
import { effect, sfxDistance } from "../effect.js";
import { heldSoundActivity, updateHeldSound, stopHeldSound, scheduleHeldSound } from "../sound.js";
import { getHitbox, lane } from "../lane.js";
import { note } from "../note.js";
import { particle, restartNativeLaneEffect } from "../particle.js";
import { layer, skin } from "../skin.js";
import { canEmpty } from "./InputManager.js";
import { assistLevel, finishAssistFrame } from "../assist.js";
import {
  finishSoloMode, getLuckState, getSoloResult, settleSoloJudgments, soloModeConfig,
  updateSoloLuck, usesSoloMode,
} from "../soloMode.js";
import { luckMemory } from "../gekisouLuck.js";
import { drawSoloModeHud } from "../../../../../shared/src/engine/data/soloModeHud.js";
import { inputFrameMs } from "../inputClock.js";
import { archetypes } from "./index.js";
import { sortHeldIntervals } from "../../../../../shared/src/engine/data/sortHeldIntervals.js";

export class Stage extends Archetype {
  gekisouFrame = this.entityMemory(Number);
  sharedMemory = this.defineSharedMemory({ luck: Tuple(3, luckMemory), modeFirst: Number, modeLast: Number });
  hitbox = this.entityMemory(Rect);
  slotHitbox = this.entityMemory(Rect);
  holdInstanceId = this.entityMemory(LoopedEffectClipInstanceId);
  holdSecondaryInstanceId = this.entityMemory(LoopedEffectClipInstanceId);
  emptyPairs = this.entityMemory(Tuple(12, { previous: Boolean, current: Boolean, emitted: Boolean }));

  spawnOrder() {
    return 1;
  }

  shouldSpawn() {
    return entityInfos.get(0).state === EntityState.Despawned;
  }

  preprocess() {
    initializeConnectWallDraw();
    if (options.sfxEnabled && options.autoSFX && effect.clips.normalHold.exists) {
      this.scheduleHeldSFX();
    }
  }

  initialize() {
    getHitbox({ l: lane.hitbox.l, r: lane.hitbox.r, leniency: 0 }).copyTo(this.hitbox);
    getHitbox({ l: lane.slots.l, r: lane.slots.r, leniency: 0 }).copyTo(this.slotHitbox);
  }

  touchOrder = 2;
  touch() {
    for (const touch of touches) {
      if (touch.ended || !this.hitbox.contains(touch.position)) continue;
      if (!canEmpty(touch)) continue;
      const index = this.xToL(touch.position.x) + 6;
      const pair = this.emptyPairs.get(index);
      this.emptyPairs.set(index, { previous: pair.previous, current: true, emitted: pair.emitted });
    }
    for (const touch of touches) {
      if (!this.hitbox.contains(touch.position)) continue;
      if (!canEmpty(touch)) continue;
      if (touch.ended && !touch.started) continue;
      const lane = this.xToL(touch.position.x);
      const pair = this.emptyPairs.get(lane + 6);
      if (pair.previous || pair.emitted) continue;
      this.emptyPairs.set(lane + 6, { previous: pair.previous, current: pair.current, emitted: true });
      this.playEmptyEffects(lane);
    }
  }

  updateSequential() {
    if (usesSoloMode()) {
      settleSoloJudgments();
      finishAssistFrame();
      finishSoloMode();
      if (options.gekisouMode) {
        const now = inputFrameMs();
        updateSoloLuck(now);
        this.updateGekisouStage(now);
      }
    }
    heldSoundActivity.active = false;
    updateConnectWalls();
    if (particle.effects.sourceSimpleLoop.exists) retireSimpleLoopSources(time.now, false);
    for (let index = 0; index < 12; index++) {
      const pair = this.emptyPairs.get(index);
      this.emptyPairs.set(index, { previous: pair.current, current: false, emitted: false });
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
    this.updateHeldSFX();

    // lane_base is the authored Unity stage mesh baked into the native
    // skin. A generic six-lane PJS stage has different perspective and
    // must not be presented as an approximation when that asset is absent.
    if (skin.sprites.sekaiStage.exists) this.drawSekaiStage();

    drawGekisouStageLight(skin.sprites.gekisouStage0, this.gekisouFrame, layer.stage + 0.5);
    this.drawLaneDetails();
    if (usesSoloMode()) this.drawModeHud();
  }

  updateGekisouStage(now: number) {
    const mode = options.gekisouEffectMode;
    if (options.lightweightMode || mode === 0) return;
    this.gekisouFrame = 0;
    for (let i = 0; i < 3; i++) {
      const range = soloModeConfig.ranges.get(i);
      const frame = gekisouStageFrame(now, range.mission, range.start, range.end, mode);
      if (frame >= 0) this.gekisouFrame = frame;
    }
  }

  drawModeHud() {
    const result = getSoloResult();
    const now = inputFrameMs();
    let mission = 0;
    let missionValue = 0;
    let countdown = 0;
    if (options.gekisouMode) {
      for (let i = 0; i < 3; i++) {
        const range = soloModeConfig.ranges.get(i);
        if (range.mission === 0 || now < range.start - 3000 || now >= range.end) continue;
        mission = range.mission;
        countdown = Math.max(0, Math.ceil((range.start - now) / 1000));
        const stage = result.ranges.get(i);
        missionValue = mission === 1 ? stage.combo : mission === 3 ? stage.just : getLuckState(i).points;
        break;
      }
    }
    drawSoloModeHud(skin.sprites, {
      score: soloModeConfig.weightedNoteTenths > 0 ? result.score : -1,
      countdown,
      mission,
      missionValue,
      assistLevel: options.assistMode ? assistLevel() : -1,
      result: result.grade,
      combo: result.bestCombo,
    });
  }

  updateHeldSFX() {
    updateHeldSound(this, heldSoundActivity.active, options.sfxEnabled && !options.autoSFX);
  }

  terminate() {
    stopHeldSound(this);
  }

  scheduleHeldSFX() {
    const links = archetypes.NormalActiveSlideConnector.heldAudioLinks;
    const imports = archetypes.NormalActiveSlideConnector.import;
    const notes = archetypes.NormalActiveSlideConnector.slideStartNote.import;
    let head = -1;
    for (const info of entityInfos) {
      if (
        info.archetype !== archetypes.NormalActiveSlideConnector.index &&
        info.archetype !== archetypes.CriticalActiveSlideConnector.index
      )
        continue;
      const connector = imports.get(info.index);
      const cached = links.get(info.index);
      cached.start = bpmChanges.at(notes.get(connector.headRef).beat).time;
      cached.end = bpmChanges.at(notes.get(connector.tailRef).beat).time;
      if (cached.end <= cached.start) continue;
      cached.next = head;
      head = info.index;
    }
    head = sortHeldIntervals(head, links);
    while (head >= 0) {
      const first = links.get(head);
      const start = first.start;
      let end = first.end;
      head = first.next;
      while (head >= 0) {
        const next = links.get(head);
        if (next.start > end) break;
        end = Math.max(end, next.end);
        head = next.next;
      }
      scheduleHeldSound(start, end);
    }
  }

  xToL(x: number) {
    return nativeEmptyLaneFeedbackPair(Math.unlerp(this.slotHitbox.l, this.slotHitbox.r, x) * 12 - 6);
  }

  playEmptyEffects(l: number) {
    streams.set(-9999, time.now, 0);
    streams.set(l, time.now, 0);

    if (options.sfxEnabled) this.playEmptySFX();
    if (options.laneEffectEnabled) this.playEmptyLaneEffects(l);
  }

  playEmptySFX() {
    effect.clips.stage.play(sfxDistance);
  }

  playEmptyLaneEffects(l: number) {
    const first = (l + 6) * 2;
    restartNativeLaneEffect(NativeLaneEffectType.InVain, first);
    restartNativeLaneEffect(NativeLaneEffectType.InVain, first + 1);
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
      const scaledTime = ref > 0
        ? readScrollTime(clock.segment, target, index => archetypes.ScrollClock.import.get(index))
        : target;
      const depth = scaledTime - now;
      if (depth > note.duration) {
        if (ref <= 0) break;
        continue;
      }
      if (depth < 0 || options.laneCover > 0 && depth > note.coverDuration) continue;
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

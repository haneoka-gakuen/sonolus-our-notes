import { nativeLaneLineLayout } from '../../../../../shared/src/engine/data/nativeLaneLines.js'
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
import { chartExtent } from "../chartExtent.js";
import { effect, sfxDistance } from "../effect.js";
import { scheduleHeldSound } from "../sound.js";
import { layer, skin } from "../skin.js";
import { archetypes } from "./index.js";

export class Stage extends Archetype {
  heldConnectorHead = this.entityMemory(Number);

  indexHeldConnectors() {
    this.heldConnectorHead = -1;
    for (const info of entityInfos) {
      if (info.archetype !== archetypes.NormalActiveSlideConnector.index &&
          info.archetype !== archetypes.CriticalActiveSlideConnector.index) continue;
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
      this.insertHeldConnector(info.index);
    }
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
    if (this.heldConnectorHead < 0 || cached.start <
        archetypes.NormalActiveSlideConnector.heldAudioLinks.get(this.heldConnectorHead).start) {
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

  preprocess() {
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

  updateSequential() {
    if (!options.markerAnimation) return;
    const nativeSkin = getNativeArrowAnimationSkin(
      skin.sprites.nativeArrowAnimationSkin001.exists,
      skin.sprites.nativeArrowAnimationSkin002.exists,
      skin.sprites.nativeArrowAnimationSkin003.exists,
    );
    if (nativeSkin !== NativeArrowAnimationSkin.None) updateNativeArrowFrames(nativeSkin, time.now);
  }

  updateParallel() {
    // Do not substitute the generic six-lane PJS stage for Unity's
    // authored lane_base geometry. Missing native stage data fails closed.
    if (skin.sprites.sekaiStage.exists) this.drawSekaiStage();

    this.drawLaneDetails();
  }

  drawSekaiStage() {
    skin.sprites.sekaiStage.draw(
      new Rect(laneBase.layout),
      [layer.stage],
      laneBase.materialOpacity * options.laneOpacity,
    );
  }

  // LiveAllBarLineView: one line across the lane per bar while the bar is
  // inside the approach window. Level data carries BPM changes only, so bars
  // are every four beats (the preview's measure numbering uses the same rule)
  // and end at the last note. A monotonic cursor keeps this to a handful of
  // lookups per frame; it also walks back after a replay seek.
  barCursor = this.entityMemory(Number);

  drawBarLines() {
    if (!options.measureLineDisplay || !skin.sprites.simLine.exists) return;

    for (let i = 0; i < 64; i++) {
      if (this.barCursor < 4) break;
      if (this.barScaledTime(this.barCursor - 4) <= time.scaled) break;
      this.barCursor -= 4;
    }
    for (let i = 0; i < 64; i++) {
      if (this.barScaledTime(this.barCursor) > time.scaled) break;
      this.barCursor += 4;
    }

    for (let i = 0; i < 16; i++) {
      const beat = this.barCursor + i * 4;
      if (beat > chartExtent.lastBeat) break;
      const scaledTime = this.barScaledTime(beat);
      if (scaledTime > time.scaled + note.duration) break;
      if (note.isCovered(scaledTime)) continue;
      if (options.hidden > 0 && scaledTime - time.scaled < note.duration * options.hidden) continue;

      const y = approach(scaledTime - note.duration, scaledTime, time.scaled);
      skin.sprites.simLine.draw(
        new Rect({ l: -6 * y, r: 6 * y, b: y + simLine.h, t: y - simLine.h }),
        [layer.barLine],
        0.5,
      );
    }
  }

  barScaledTime(beat: number) {
    return timeScaleChanges.at(bpmChanges.at(beat).time).scaledTime;
  }

  drawLaneDetails() {
    this.drawGuidelines();
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

    const outsideX = 6 + (nativeStage.outsideLineWidth / 2 / nativeStage.laneWidth) * 12;
    this.drawOutsideLine(-outsideX, options.guidelineOpacity);
    this.drawOutsideLine(outsideX, options.guidelineOpacity);
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

  drawOutsideLine(x: number, alpha: number) {
    if (!skin.sprites.outsideLine.exists) return;

    const halfWidth = (nativeStage.outsideLineWidth / 2 / nativeStage.laneWidth) * 12;
    skin.sprites.outsideLine.draw(
      nativeLaneLineLayout(x, halfWidth, halfWidth, options.lockStageAspectRatio),
      [layer.guideline],
      alpha,
    );
  }
}

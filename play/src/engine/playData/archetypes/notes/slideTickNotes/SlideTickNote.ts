import { options } from "../../../../configuration/options.js";
import { windows } from "../../../../../../../shared/src/engine/data/windows.js";
import { getHitbox, getNativeJudgmentLeniency } from "../../../lane.js";
import { getTraceHit } from "../../../trace.js";
import { containsInputAccuracy } from "../../../inputClock.js";
import { disallowEmpty } from "../../InputManager.js";
import { InputNote } from "../InputNote.js";

export abstract class SlideTickNote extends InputNote {
  leniency = 1;
  windows = windows.traceNote.normal;

  inputTime = this.entityMemory(Range);

  preprocess() {
    super.preprocess();

    if (this.hasInput) this.archetypeLife.miss = -100;

    this.inputTime.copyFrom(this.windows.input.add(this.inputTargetTime).add(input.offset));

    this.spawnTime = timeScaleChanges.at(this.inputTime.min).scaledTime;
  }

  initialize() {
    getHitbox({
      l: this.import.lane - this.import.size,
      r: this.import.lane + this.import.size,
      leniency: getNativeJudgmentLeniency({
        operateType: this.import.operateType,
        originalCritical: this.import.originalCritical,
        // Hidden attached Combo (120) ticks replace lane/size during
        // preprocess. Convert their live half-width back to the
        // chart's 24-lane width. Ordinary nodes retain originalSize so
        // a legal source width below 2 is not polluted by the legacy
        // visual minimum in chartToLevelData.
        originalSize: this.import.operateType === 120 ? this.import.size * 4 : this.import.originalSize,
      }),
    }).copyTo(this.fullHitbox);

    this.result.accuracy = windows.traceNote.normal.input.max;
  }

  touch() {
    if (this.despawn) return;
    if (!this.canReceiveInput) return;

    for (const touch of touches) {
      const hit = getTraceHit(
        touch,
        this.fullHitbox,
        this.inputTime,
        this.targetTime,
        this.import.originalTimeMs,
        this.windows.input,
      );
      if (hit.time === -9999) continue;

      this.complete(touch, hit.time, hit.atTarget);
      return;
    }
  }

  updateSequential() {
    if (this.despawn) return;
    if (this.hasInputTargetArrived && !this.hasInputWindowEnded) {
      for (const touch of touches) {
        if (touch.started || touch.ended) continue;
        if (!this.fullHitbox.contains(touch.position)) continue;

        this.complete(touch, this.targetTime, true);
        return;
      }
    }
  }

  updateParallel() {
    if (this.hasInputWindowEnded) this.despawn = true;
  }

  complete(touch: Touch, hitTime: number, atTarget: boolean) {
    disallowEmpty(touch);
    const accuracy = this.inputAccuracy(hitTime, atTarget);
    this.result.accuracy = accuracy.seconds;
    this.result.judgment = containsInputAccuracy(this.windows.perfect, accuracy) ? Judgment.Perfect : Judgment.Miss;
    if (this.result.judgment === Judgment.Perfect) {
      if (options.hapticsEnabled) this.result.haptic = HapticType.Medium;

      this.playHitEffects();
    }

    this.despawn = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  playHitEffects() {}
}

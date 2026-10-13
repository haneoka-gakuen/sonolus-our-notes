import { options } from "../../../../configuration/options.js";
import { windows } from "../../../../../../../shared/src/engine/data/windows.js";
import { getHitbox, getNativeJudgmentLeniency } from "../../../lane.js";
import { getTraceHitTime } from "../../../trace.js";
import { disallowEmpty } from "../../InputManager.js";
import { Note } from "../Note.js";

export abstract class SlideTickNote extends Note {
  leniency = 1;

  inputTime = this.entityMemory(Range);

  preprocess() {
    super.preprocess();

    if (this.hasInput) this.archetypeLife.miss = -100;

    this.inputTime.copyFrom(windows.traceNote.normal.input.add(this.targetTime).add(input.offset));

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
    if (time.now < this.inputTime.min) return;

    for (const touch of touches) {
      const hitTime = getTraceHitTime(touch, this.fullHitbox, this.inputTime, this.targetTime);
      if (hitTime === -9999) continue;

      this.complete(touch, hitTime);
      return;
    }
  }

  updateSequential() {
    if (this.despawn) return;
    if (time.now >= this.targetTime + input.offset && time.now <= this.inputTime.max) {
      for (const touch of touches) {
        if (touch.started || touch.ended) continue;
        if (!this.fullHitbox.contains(touch.position)) continue;

        this.complete(touch, this.targetTime);
        return;
      }
    }
  }

  updateParallel() {
    if (time.now > this.inputTime.max) this.despawn = true;
  }

  complete(touch: Touch, hitTime: number) {
    disallowEmpty(touch);
    this.result.accuracy = hitTime - this.targetTime;
    this.result.judgment = windows.traceNote.normal.perfect.contains(this.result.accuracy)
      ? Judgment.Perfect
      : Judgment.Miss;
    if (this.result.judgment === Judgment.Perfect) {
      if (options.hapticsEnabled) this.result.haptic = HapticType.Medium;

      this.playHitEffects();
    }

    this.despawn = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  playHitEffects() {}
}

import { windows } from "../../../../../../../../shared/src/engine/data/windows.js";
import { claimStart, disallowEmpty, getClaimedStart } from "../../../InputManager.js";
import { FlatNote } from "../FlatNote.js";

export abstract class TapNote extends FlatNote {
  leniency = 0.75;

  updateSequential() {
    if (!this.canReceiveInput) return;

    claimStart(
      this.info.index,
      this.targetTime,
      this.hitbox,
      this.fullHitbox,
      this.import.originalTimeMs,
      this.windows.input,
    );
  }

  touch() {
    if (!this.canReceiveInput) return;

    const index = getClaimedStart(this.info.index);
    if (index === -1) return;

    this.complete(touches.get(index));
  }

  complete(touch: Touch) {
    disallowEmpty(touch);

    this.result.judgment = this.judge(touch.startTime, false);

    this.playHitEffects(touch.startTime);

    this.despawn = true;
  }
}

import { claimEnd, getClaimedEnd } from "../../../InputManager.js";
import { archetypes } from "../../../index.js";
import { FlatNote } from "../FlatNote.js";

export abstract class SlideEndNote extends FlatNote {
  leniency = 1;

  slideEndImport = this.defineImport({
    slideRef: { name: "slide", type: Number },
  });

  updateSequential() {
    if (!this.canReceiveInput) return;

    claimEnd(
      this.info.index,
      this.targetTime,
      this.hitbox,
      this.fullHitbox,
      this.startSharedMemory.lastActiveTime === time.now ? this.targetTime : 99999,
      this.import.originalTimeMs,
      this.windows.input,
    );
  }

  touch() {
    if (!this.canReceiveInput) return;

    const index = getClaimedEnd(this.info.index);
    if (index === -1) return;

    this.complete(touches.get(index));
  }

  get slideImport() {
    return archetypes.NormalSlideConnector.import.get(this.slideEndImport.slideRef);
  }

  get startSharedMemory() {
    return archetypes.NormalSlideStartNote.sharedMemory.get(this.slideImport.startRef);
  }

  complete(touch: Touch) {
    const hitTime = touch.ended ? touch.time : this.targetTime;

    this.result.judgment = this.judge(hitTime, !touch.ended);

    this.playHitEffects(hitTime);

    this.despawn = true;
  }
}

import { getZ, layer } from "../../../../skin.js";
import { disallowEmpty } from "../../../InputManager.js";
import { getTraceHitTime } from "../../../../trace.js";
import { FlatNote } from "../FlatNote.js";

export abstract class TraceNote extends FlatNote {
  abstract sprites: {
    left: SkinSprite;
    middle: SkinSprite;
    right: SkinSprite;
    diamond: SkinSprite;
    fallback: SkinSprite;
  };

  leniency = 1;

  layer = layer.note.trace;

  diamondLayout = this.entityMemory(Rect);

  diamondZ = this.entityMemory(Number);

  initialize() {
    super.initialize();

    if (!this.useFallbackSprites) {
      new Rect(this.nativeMarkRect).copyTo(this.diamondLayout);

      this.diamondZ = getZ(layer.note.tick, this.targetTime, this.import.lane);
    }
  }

  touch() {
    if (this.despawn) return;
    if (time.now < this.inputTime.min) return;

    for (const touch of touches) {
      const hitTime = getTraceHitTime(touch, this.fullHitbox, this.inputTime, this.targetTime);
      if (hitTime === -9999) continue;

      disallowEmpty(touch);
      this.complete(hitTime);
      return;
    }
  }

  updateSequential() {
    if (this.despawn) return;
    if (time.now < this.targetTime + input.offset || time.now > this.inputTime.max) return;

    for (const touch of touches) {
      if (touch.started || touch.ended) continue;
      if (!this.fullHitbox.contains(touch.position)) continue;

      disallowEmpty(touch);
      this.complete(this.targetTime);
      return;
    }
  }

  render() {
    super.render();

    if (!this.useFallbackSprites) {
      this.sprites.diamond.draw(this.diamondLayout.mul(this.y), [this.diamondZ], 1);
    }
  }

  complete(hitTime: number) {
    this.result.judgment = this.judge(hitTime);
    this.result.accuracy = hitTime - this.targetTime;

    this.result.bucket.index = this.bucket.index;
    this.result.bucket.value = this.result.accuracy * 1000;

    this.playHitEffects(time.now);

    this.despawn = true;
  }

  playCircularNoteEffect() {
    super.playCircularNoteEffect();
  }

  playSlotEffects() {
    // removed
  }

  playLaneEffects() {
    // removed
  }

  get useFallbackSprites() {
    return (
      !this.sprites.left.exists ||
      !this.sprites.middle.exists ||
      !this.sprites.right.exists ||
      !this.sprites.diamond.exists
    );
  }
}

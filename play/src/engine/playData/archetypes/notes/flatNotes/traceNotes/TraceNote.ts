import { getZ, layer } from "../../../../skin.js";
import { disallowEmpty } from "../../../InputManager.js";
import { getTraceHit } from "../../../../trace.js";
import { sizedEffectId, spawnNativeConnectEffect } from "../../../../particle.js";
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

      disallowEmpty(touch);
      this.complete(hit.time, hit.atTarget);
      return;
    }
  }

  updateSequential() {
    if (this.despawn) return;
    if (!this.hasInputTargetArrived || this.hasInputWindowEnded) return;

    for (const touch of touches) {
      if (touch.started || touch.ended) continue;
      if (!this.fullHitbox.contains(touch.position)) continue;

      disallowEmpty(touch);
      this.complete(this.targetTime, true);
      return;
    }
  }

  render() {
    super.render();

    if (!this.useFallbackSprites) {
      this.sprites.diamond.draw(this.diamondLayout.mul(this.y), [this.diamondZ], 1);
    }
  }

  complete(hitTime: number, atTarget: boolean) {
    this.result.judgment = this.judge(hitTime, atTarget);

    this.playHitEffects(time.now);

    this.despawn = true;
  }

  playCircularNoteEffect() {
    spawnNativeConnectEffect(
      sizedEffectId(this.nativeNoteEffectId, this.import.size),
      this.import.lane,
      this.import.size,
      this.noteEffectDuration,
      this.noteEffectBirth,
    );
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

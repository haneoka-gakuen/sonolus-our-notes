import { consumeFlickTouch, isFlickLatchReady, scanFlickLatch } from "../../../../../flick.js";
import { getZ, layer } from "../../../../../skin.js";
import { FlickNote } from "../FlickNote.js";

export abstract class TraceFlickNote extends FlickNote {
  abstract sprites: {
    left: SkinSprite;
    middle: SkinSprite;
    right: SkinSprite;
    diamond: SkinSprite;
    fallback: SkinSprite;
  };

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
    if (!this.canReceiveInput) return;

    const latched = scanFlickLatch(
      this.fullHitbox.l,
      this.fullHitbox.r,
      this.flickImport.direction,
      this.import.originalTimeMs,
      this.windows.input,
    );
    if (latched.time !== -9999) {
      this.flickLatchedTime = latched.time;
      this.flickLatchedTouchId = latched.touchId;
    }
    if (
      isFlickLatchReady(
        this.flickLatchedTime,
        this.targetTime,
        this.flickLatchedTouchId,
        this.import.originalTimeMs,
        this.windows.input,
      )
    ) {
      consumeFlickTouch(this.flickLatchedTouchId);
      this.completeTraceFlick(this.flickLatchedTime);
    }
  }

  updateParallel() {
    if (this.despawn) return;

    // touch() only fires on touch events; complete a latched swipe once
    // the note time arrives on an otherwise quiet frame.
    if (
      isFlickLatchReady(
        this.flickLatchedTime,
        this.targetTime,
        this.flickLatchedTouchId,
        this.import.originalTimeMs,
        this.windows.input,
      )
    ) {
      this.completeTraceFlick(this.flickLatchedTime);
    }

    super.updateParallel();
  }

  render() {
    super.render();

    if (!this.useFallbackSprites) {
      this.sprites.diamond.draw(this.diamondLayout.mul(this.y), [this.diamondZ], 1);
    }
  }

  playNoteEffects() {
    super.playNoteEffects();
  }

  playSlotEffects() {
    // removed
  }

  playLaneEffects() {
    // removed
  }

  completeTraceFlick(hitTime: number) {
    this.result.judgment = this.judge(hitTime, false);

    this.playHitEffects(time.now);

    this.despawn = true;
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

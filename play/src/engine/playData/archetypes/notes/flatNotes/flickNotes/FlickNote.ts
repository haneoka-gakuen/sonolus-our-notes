import { FlickDirection } from "../../../../../../../../shared/src/engine/data/FlickDirection.js";
import {
  getArrowLayout,
  getArrowSpriteId,
  getNativeArrowAnimationLayout,
} from "../../../../../../../../shared/src/engine/data/arrowSprites.js";
import {
  getNativeArrowAnimation,
  getNativeArrowAnimationSkin,
  NativeArrowAnimationSkin,
} from "../../../../../../../../shared/src/engine/data/nativeArrowAnimation.js";
import { readNativeArrowFrame } from "../../../../../../../../shared/src/engine/data/nativeArrowFrames.js";
import { options } from "../../../../../configuration/options.js";
import { effect, sfxDistance } from "../../../../effect.js";
import { scaledScreen } from "../../../../scaledScreen.js";
import { getZ, layer, skin } from "../../../../skin.js";
import { FlatNote } from "../FlatNote.js";

export abstract class FlickNote extends FlatNote {
  leniency = 1;

  abstract arrowSprites: {
    up: SkinSprite[];
    left: SkinSprite[];
    right: SkinSprite[];
    fallback: SkinSprite;
  };

  abstract directionalEffect: ParticleEffect;

  flickImport = this.defineImport({
    direction: { name: "direction", type: DataType<FlickDirection> },
  });

  flickExport = this.defineExport({
    accuracyDiff: { name: "accuracyDiff", type: Number },
  });

  arrow = this.entityMemory({
    sprite: SkinSpriteId,
    layout: Quad,
    animation: Vec,
    z: Number,
  });

  // FlickUpdater's near-position latch: a qualifying swipe inside the input
  // window is remembered (with its time) and the note judges later - while
  // the finger is still pressed once the note time is reached, or on release.
  // -9999 means "not latched".
  flickLatchedTime = this.entityMemory(Number)

  preprocess() {
    super.preprocess();

    if (options.mirror) this.flickImport.direction *= -1;
  }

  initialize() {
    super.initialize();

    const nativeSkin = getNativeArrowAnimationSkin(
      skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin001.id),
      skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin002.id),
      skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin003.id),
    );

    this.arrow.sprite = getArrowSpriteId(this.arrowSprites, this.import.size, this.flickImport.direction, nativeSkin);

    if (skin.sprites.exists(this.arrow.sprite)) {
      getArrowLayout(this.import.size, this.flickImport.direction, this.import.lane, 1, nativeSkin).copyTo(this.arrow.layout);
    }

    if (options.markerAnimation)
      new Vec(
        this.flickImport.direction,
        this.flickImport.direction === FlickDirection.Up ? -2 * scaledScreen.wToH : 0,
      ).copyTo(this.arrow.animation);

    this.arrow.z = getZ(layer.note.arrow, this.targetTime, this.import.lane);

    this.flickLatchedTime = -9999;
  }


  scheduleSFX() {
    if (this.flickImport.direction !== FlickDirection.Up && effect.clips.flickSide.exists) {
      effect.clips.flickSide.schedule(this.targetTime, sfxDistance);
    } else {
      super.scheduleSFX();
    }
  }

  playSFX() {
    // GetTapSeType selects the SE purely by note type: every judgement of a
    // directional flick plays the side cue, every up-flick the flick cue.
    if (this.flickImport.direction !== FlickDirection.Up && effect.clips.flickSide.exists) {
      effect.clips.flickSide.play(sfxDistance);
    } else if (effect.clips.flickPerfect.exists) {
      effect.clips.flickPerfect.play(sfxDistance);
    } else {
      super.playSFX();
    }
  }

  complete(touch: Touch) {
    this.completeAt(touch.time);
  }

  completeAt(hitTime: number) {
    this.result.judgment = this.judge(hitTime);
    this.result.accuracy = hitTime - this.targetTime;

    this.result.bucket.index = this.bucket.index;
    this.result.bucket.value = this.result.accuracy * 1000;

    this.playHitEffects(hitTime);

    this.despawn = true;
  }

  render() {
    super.render();

    if (!skin.sprites.exists(this.arrow.sprite)) return;

    if (options.markerAnimation) {
      const nativeSkin = getNativeArrowAnimationSkin(
        skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin001.id),
        skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin002.id),
        skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin003.id),
      );
      if (nativeSkin !== NativeArrowAnimationSkin.None) {
        const animation = readNativeArrowFrame(this.flickImport.direction);
        skin.sprites.draw(
          this.arrow.sprite,
          getNativeArrowAnimationLayout(
            this.arrow.layout,
            this.flickImport.direction,
            this.import.lane,
            1,
            animation.x,
            animation.y,
            animation.scaleX,
            animation.scaleY,
          ).mul(this.y),
          [this.arrow.z],
          animation.alpha,
        );
        return;
      }
      const s = Math.mod(time.now, 0.5) / 0.5;

      skin.sprites.draw(
        this.arrow.sprite,
        this.arrow.layout.add(this.arrow.animation.mul(s)).mul(this.y),
        [this.arrow.z],
        1 - Math.ease("In", "Cubic", s),
      );
    } else {
      const nativeSkin = getNativeArrowAnimationSkin(
        skin.sprites.nativeArrowAnimationSkin001.exists,
        skin.sprites.nativeArrowAnimationSkin002.exists,
        skin.sprites.nativeArrowAnimationSkin003.exists,
      );
      if (nativeSkin === NativeArrowAnimationSkin.None) {
        skin.sprites.draw(this.arrow.sprite, this.arrow.layout.mul(this.y), [this.arrow.z], 1);
      } else {
        const pose = getNativeArrowAnimation(nativeSkin, this.flickImport.direction, 0);
        skin.sprites.draw(this.arrow.sprite,
          getNativeArrowAnimationLayout(this.arrow.layout, this.flickImport.direction, this.import.lane, 1,
            pose.x, pose.y, pose.scaleX, pose.scaleY).mul(this.y), [this.arrow.z], pose.alpha);
      }
    }
  }

  playNoteEffects() {
    super.playNoteEffects();
  }
}

import {
  validSimpleLoopRom,
  hasSimpleLoopSourceEffects,
  updateSimpleLoopSource,
  moveSimpleLoopSource,
  releaseSimpleLoopSource,
} from "../../../../../../../shared/src/engine/data/simpleLoopSource.js";
import { scaledScreen } from "../../../scaledScreen.js";
import { nativeEffectSpawnPlane } from "../../../../../../../shared/src/engine/data/nativeEffects.js";
import { stableHoldEffectWidthBucket } from "../../../../../../../shared/src/engine/data/stableHoldEffectWidthBucket.js";
import { getNativeNoteCapId } from "../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js";
import {
  getNativeNoteParts,
  getNativeNoteRects,
} from "../../../../../../../shared/src/engine/data/nativeNoteGeometry.js";
import { nativeNoteLayout } from "../../../../../../../shared/src/engine/data/nativeNoteLayout.js";
import { options } from "../../../../configuration/options.js";
import { note } from "../../../note.js";
import { linearEffectLayout, particle } from "../../../particle.js";
import { getZ, layer, skin } from "../../../skin.js";
import { SlideConnector, VisualType } from "../SlideConnector.js";
import { LOOP_FX_PARTS, moveLoopFx, spawnLoopFx } from "../../../hitFx.js";

export abstract class ActiveSlideConnector extends SlideConnector {
  override nativeLine = true;
  abstract slideSprites: {
    left: SkinSprite;
    middle: SkinSprite;
    right: SkinSprite;
    fallback: SkinSprite;
  };

  abstract effects: {
    circular: ParticleEffect;
    linear: ParticleEffect;
  };

  effectInstanceIds = this.entityMemory({
    circularScheduled: Boolean,
    linear: ParticleEffectInstanceId,
  });

  slideZ = this.entityMemory(Number);

  // Resource selection and engine options are fixed for this entity's run.
  // Dynamic lane/width and the width-bucket restart remain per-frame.
  resources = this.entityMemory({
    circularEnabled: Boolean,
    linearEnabled: Boolean,
    loopWidthBucket: Number,
    sourceProgram: Boolean,
    slideAvailable: Boolean,
    skin002: Boolean,
    skin003: Boolean,
  });

  initialize() {
    super.initialize();

    this.slideZ = getZ(layer.note.slide, this.head.time, this.headImport.lane);
    this.resources.circularEnabled = options.noteEffectEnabled;
    this.resources.linearEnabled = options.noteEffectEnabled && this.effects.linear.exists;
    this.resources.loopWidthBucket = -1;
    this.loopLayoutIsFixed = this.head.l === this.tail.l && this.head.r === this.tail.r;
    this.resources.sourceProgram =
      particle.effects.sourceSimpleLoop.exists && validSimpleLoopRom() && hasSimpleLoopSourceEffects(particle.effects);
    this.resources.slideAvailable =
      this.slideSprites.left.exists && this.slideSprites.middle.exists && this.slideSprites.right.exists;
    this.resources.skin002 = skin.sprites.nativeArrowAnimationSkin002.exists;
    this.resources.skin003 = skin.sprites.nativeArrowAnimationSkin003.exists;
  }

  updateSequential() {
    super.updateSequential();
    if (!this.resources.sourceProgram) return;
    if (time.now < this.head.time || time.now >= this.tail.time) return;
    this.updateVisualType();
    if (!this.resources.circularEnabled || this.visual !== VisualType.Activated) {
      releaseSimpleLoopSource(this.import.startRef, time.now, false);
      return;
    }
    const { l, r } = this.getEdgeBounds(time.scaled);
    if (
      !updateSimpleLoopSource(this.import.startRef, time.now, (l + r) / 2, (r - l) / 2, particle.effects, this.end.time)
    )
      this.resources.sourceProgram = false;
  }

  updateParallel() {
    if (time.now >= this.tail.time) {
      this.despawn = true;
      return;
    }

    if (time.scaled < this.visualTime.min) return;

    this.updateVisualType();

    this.renderConnector();

    if (time.now < this.head.time) return;

    if (this.visual === VisualType.Activated) {
      if (this.shouldPlayCircularEffect) {
        if (!this.effectInstanceIds.circularScheduled) this.spawnCircularEffect();

        this.updateCircularEffect();
      }

      if (this.shouldPlayLinearEffect) {
        if (!this.effectInstanceIds.linear) this.spawnLinearEffect();

        this.updateLinearEffect();
      }
    } else {
      if (this.shouldPlayCircularEffect && this.effectInstanceIds.circularScheduled) this.destroyCircularEffect();

      if (this.shouldPlayLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
    }

    this.renderSlide();
  }

  terminate() {
    if (this.shouldPlayCircularEffect && this.effectInstanceIds.circularScheduled) this.destroyCircularEffect();

    if (this.shouldPlayLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
  }

  get shouldPlayCircularEffect() {
    return this.resources.circularEnabled;
  }

  get shouldPlayLinearEffect() {
    return this.resources.linearEnabled;
  }

  get useFallbackSlideSprite() {
    return !this.resources.slideAvailable;
  }

  // effect001 hold loop: one looping instance per part, re-projected every frame.
  loopFx = this.entityMemory(Tuple(LOOP_FX_PARTS, ParticleEffectInstanceId));
  loopLayoutIsFixed = this.entityMemory(Boolean);

  spawnCircularEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    this.resources.loopWidthBucket = stableHoldEffectWidthBucket((r - l) / 2);
    for (let order = 0; order < LOOP_FX_PARTS; order++) {
      const plane = nativeEffectSpawnPlane(order);
      if (plane === 0 && this.resources.sourceProgram) continue;
      this.loopFx.set(plane, spawnLoopFx(plane, (l + r) / 2, (r - l) / 2));
    }
    // Scheduling stays latched even when the selected pack omits plane 0.
    this.effectInstanceIds.circularScheduled = true;
  }

  updateCircularEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    if (stableHoldEffectWidthBucket((r - l) / 2) !== this.resources.loopWidthBucket) {
      this.destroyCircularEffect();
      this.spawnCircularEffect();
    }
    if (!this.loopLayoutIsFixed)
      for (let i = 0; i < LOOP_FX_PARTS; i++) moveLoopFx(this.loopFx.get(i), i, (l + r) / 2, (r - l) / 2);
    if (this.resources.sourceProgram)
      moveSimpleLoopSource(this.import.startRef, time.now, (l + r) / 2, options.noteEffectSize, scaledScreen.wToH);
  }

  destroyCircularEffect() {
    for (let i = 0; i < LOOP_FX_PARTS; i++) {
      const instance = this.loopFx.get(i);
      if (instance) particle.effects.destroy(instance);
    }
    this.effectInstanceIds.circularScheduled = false;
  }

  spawnLinearEffect() {
    this.effectInstanceIds.linear = this.effects.linear.spawn(new Quad(), 1, true);
  }

  updateLinearEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    const lane = (l + r) / 2;
    const size = (r - l) / 2;

    particle.effects.move(
      this.effectInstanceIds.linear,
      linearEffectLayout({
        lane,
        size,
        shear: 0,
      }),
    );
  }

  destroyLinearEffect() {
    particle.effects.destroy(this.effectInstanceIds.linear);
    this.effectInstanceIds.linear = 0;
  }

  getAlpha() {
    return 1;
  }

  renderSlide() {
    // The old single-sprite branch was a PJS compatibility strip. If the
    // three source-derived slices are unavailable, omit the overlay.
    if (this.useFallbackSlideSprite) return;

    const { l, r } = this.getEdgeBounds(time.scaled);

    const rects = getNativeNoteRects((l + r) / 2, (r - l) / 2, 1, this.resources.skin002, this.resources.skin003);
    const parts = getNativeNoteParts((l + r) / 2, (r - l) / 2, false);
    this.drawSlidePart(getNativeNoteCapId(skin.sprites, 1, parts.leftTilt, parts.leftRight), rects.left);
    this.drawSlidePart(skin.sprites.nativeSlideMainLeft.id, rects.mainLeft);
    this.drawSlidePart(skin.sprites.nativeSlideMainMiddle.id, rects.middle);
    this.drawSlidePart(skin.sprites.nativeSlideMainRight.id, rects.mainRight);
    this.drawSlidePart(getNativeNoteCapId(skin.sprites, 1, parts.rightTilt, parts.rightRight), rects.right);
  }

  drawSlidePart(id: SkinSpriteId, rect: RectLike) {
    if (skin.sprites.exists(id)) skin.sprites.draw(id, nativeNoteLayout(rect), [this.slideZ], 1);
  }
}

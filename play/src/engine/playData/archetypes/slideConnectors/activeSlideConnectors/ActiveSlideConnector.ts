import { getNativeNoteCapId } from '../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js';
import { getNativeNoteParts, getNativeNoteRects } from '../../../../../../../shared/src/engine/data/nativeNoteGeometry.js';
import { NATIVE_EFFECT_PLANE_COUNT, NATIVE_PARTICLE_TIMINGS, nativeEffectWidthBucket } from '../../../../../../../shared/src/engine/data/nativeEffects.js';
import { perspectiveLayout } from "../../../../../../../shared/src/engine/data/utils.js";
import { options } from "../../../../configuration/options.js";
import { note } from "../../../note.js";
import { linearEffectLayout, nativeEffectPlaneLayout, particle, sizedEffectId } from "../../../particle.js";
import { getZ, layer, skin } from "../../../skin.js";
import { SlideConnector, VisualType } from "../SlideConnector.js";

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
    circular: ParticleEffectInstanceId,
    linear: ParticleEffectInstanceId,
  });

  slideZ = this.entityMemory(Number);

  // Resource selection and engine options are fixed for this entity's run.
  // Dynamic lane/width and the width-bucket restart remain per-frame.
  resources = this.entityMemory({
    circularEnabled: Boolean,
    linearEnabled: Boolean,
    circularProfileBase: ParticleEffectId,
    slideAvailable: Boolean,
    skin002: Boolean,
    skin003: Boolean,
  });

  preprocess() {
    super.preprocess();
  }

  initialize() {
    super.initialize();

    this.slideZ = getZ(layer.note.slide, this.head.time, this.headImport.lane);
    this.resources.circularEnabled = options.noteEffectEnabled && this.effects.circular.exists;
    this.resources.linearEnabled = options.noteEffectEnabled && this.effects.linear.exists;
    this.resources.circularProfileBase = sizedEffectId(this.effects.circular.id, 0);
    this.resources.slideAvailable = this.slideSprites.left.exists && this.slideSprites.middle.exists && this.slideSprites.right.exists;
    this.resources.skin002 = skin.sprites.nativeArrowAnimationSkin002.exists;
    this.resources.skin003 = skin.sprites.nativeArrowAnimationSkin003.exists;
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
        if (!this.effectInstanceIds.circular) this.spawnCircularEffect();

        this.updateCircularEffect();
      }

      if (this.shouldPlayLinearEffect) {
        if (!this.effectInstanceIds.linear) this.spawnLinearEffect();

        this.updateLinearEffect();
      }
    } else {
      if (this.shouldPlayCircularEffect && this.effectInstanceIds.circular) this.destroyCircularEffect();

      if (this.shouldPlayLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
    }

    this.renderSlide();
  }

  terminate() {
    if (this.shouldPlayCircularEffect && this.effectInstanceIds.circular) this.destroyCircularEffect();

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

  bakedCircularEffectId = this.entityMemory(Number);
  // One instance per plane layer (NATIVE_EFFECT_PLANES); index 0 lives in
  // effectInstanceIds.circular so the existing spawn/destroy checks hold.
  circularPlaneInstanceIds = this.entityMemory(Tuple(NATIVE_EFFECT_PLANE_COUNT - 1, ParticleEffectInstanceId));

  spawnCircularEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    const size = (r - l) / 2;
    const id = ((this.resources.circularProfileBase as unknown as number) + nativeEffectWidthBucket(size) * NATIVE_EFFECT_PLANE_COUNT) as ParticleEffectId;
    this.spawnCircularPlanes(id);
  }

  spawnCircularPlanes(id: ParticleEffectId) {
    this.bakedCircularEffectId = id;
    this.effectInstanceIds.circular = particle.effects.spawn(id, new Quad(), NATIVE_PARTICLE_TIMINGS.loopParticle, true);
    for (let plane = 1; plane < NATIVE_EFFECT_PLANE_COUNT; plane++)
      this.circularPlaneInstanceIds.set(
        plane - 1,
        particle.effects.spawn(((id as unknown as number) + plane) as unknown as ParticleEffectId, new Quad(), NATIVE_PARTICLE_TIMINGS.loopParticle, true),
      );
  }

  updateCircularEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    const lane = (l + r) / 2;
    const size = (r - l) / 2;

    const nextEffectId = ((this.resources.circularProfileBase as unknown as number) + nativeEffectWidthBucket(size) * NATIVE_EFFECT_PLANE_COUNT) as ParticleEffectId;
    if (this.bakedCircularEffectId !== nextEffectId) {
      this.destroyCircularEffect();
      this.spawnCircularPlanes(nextEffectId);
    }

    particle.effects.move(this.effectInstanceIds.circular, nativeEffectPlaneLayout({ plane: 0, lane, size }));
    for (let plane = 1; plane < NATIVE_EFFECT_PLANE_COUNT; plane++)
      particle.effects.move(this.circularPlaneInstanceIds.get(plane - 1), nativeEffectPlaneLayout({ plane, lane, size }));
  }

  destroyCircularEffect() {
    particle.effects.destroy(this.effectInstanceIds.circular);
    for (let plane = 1; plane < NATIVE_EFFECT_PLANE_COUNT; plane++)
      particle.effects.destroy(this.circularPlaneInstanceIds.get(plane - 1));
    this.effectInstanceIds.circular = 0;
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

    const rects = getNativeNoteRects((l + r) / 2, (r - l) / 2, 1,
      this.resources.skin002, this.resources.skin003);
    const parts = getNativeNoteParts((l + r) / 2, (r - l) / 2, false);
    this.drawSlidePart(getNativeNoteCapId(skin.sprites, 1, parts.leftTilt, parts.leftRight), rects.left);
    this.drawSlidePart(skin.sprites.nativeSlideMainLeft.id, rects.mainLeft);
    this.drawSlidePart(skin.sprites.nativeSlideMainMiddle.id, rects.middle);
    this.drawSlidePart(skin.sprites.nativeSlideMainRight.id, rects.mainRight);
    this.drawSlidePart(getNativeNoteCapId(skin.sprites, 1, parts.rightTilt, parts.rightRight), rects.right);
  }

  drawSlidePart(id: SkinSpriteId, rect: RectLike) {
    if (skin.sprites.exists(id)) skin.sprites.draw(id, perspectiveLayout(rect), [this.slideZ], 1);
  }

}

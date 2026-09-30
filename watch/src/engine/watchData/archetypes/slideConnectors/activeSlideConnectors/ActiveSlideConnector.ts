import { NATIVE_EFFECT_PLANE_COUNT } from '../../../../../../../shared/src/engine/data/nativeEffects.js';
import { perspectiveLayout } from "../../../../../../../shared/src/engine/data/utils.js";
import { options } from "../../../../configuration/options.js";
import { note } from "../../../note.js";
import { linearEffectLayout, nativeEffectPlaneLayout, particle, sizedEffectId } from "../../../particle.js";
import { getZ, layer } from "../../../skin.js";
import { SlideConnector, VisualType } from "../SlideConnector.js";

export abstract class ActiveSlideConnector extends SlideConnector {
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

  preprocess() {
    super.preprocess();
  }

  updateParallel() {
    super.updateParallel();

    if (time.skip) {
      if (this.shouldScheduleCircularEffect) this.effectInstanceIds.circular = 0;

      if (this.shouldScheduleLinearEffect) this.effectInstanceIds.linear = 0;
    }

    if (time.now < this.head.time) return;

    if (this.visual === VisualType.Activated) {
      if (this.shouldScheduleCircularEffect) {
        if (!this.effectInstanceIds.circular) this.spawnCircularEffect();

        this.updateCircularEffect();
      }

      if (this.shouldScheduleLinearEffect) {
        if (!this.effectInstanceIds.linear) this.spawnLinearEffect();

        this.updateLinearEffect();
      }
    } else {
      if (this.shouldScheduleCircularEffect && this.effectInstanceIds.circular) this.destroyCircularEffect();

      if (this.shouldScheduleLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
    }

    this.renderSlide();
  }

  terminate() {
    if (this.shouldScheduleCircularEffect && this.effectInstanceIds.circular) this.destroyCircularEffect();

    if (this.shouldScheduleLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
  }

  get useFallbackSlideSprite() {
    return !this.slideSprites.left.exists || !this.slideSprites.middle.exists || !this.slideSprites.right.exists;
  }

  get shouldScheduleCircularEffect() {
    return options.noteEffectEnabled && this.effects.circular.exists;
  }

  get shouldScheduleLinearEffect() {
    return options.noteEffectEnabled && this.effects.linear.exists;
  }

  globalInitialize() {
    super.globalInitialize();

    this.slideZ = getZ(layer.note.slide, this.head.time, this.headImport.lane);
  }

  getAlpha() {
    return 1;
  }

  renderSlide() {
    // Do not replace missing Our Notes slices with a generic green bar.
    if (this.useFallbackSlideSprite) return;

    const { l, r } = this.getEdgeBounds(time.scaled);

    const b = 1 + note.h;
    const t = 1 - note.h;

    const ml = l + 0.25;
    const mr = r - 0.25;

    this.slideSprites.left.draw(perspectiveLayout({ l, r: ml, b, t }), [this.slideZ], 1);
    this.slideSprites.middle.draw(perspectiveLayout({ l: ml, r: mr, b, t }), [this.slideZ], 1);
    this.slideSprites.right.draw(perspectiveLayout({ l: mr, r, b, t }), [this.slideZ], 1);
  }

  bakedCircularEffectId = this.entityMemory(Number);
  // One instance per plane layer (NATIVE_EFFECT_PLANES); index 0 lives in
  // effectInstanceIds.circular so the existing spawn/destroy checks hold.
  circularPlaneInstanceIds = this.entityMemory(Tuple(NATIVE_EFFECT_PLANE_COUNT - 1, ParticleEffectInstanceId));

  spawnCircularEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    const size = (r - l) / 2;
    this.spawnCircularPlanes(sizedEffectId(this.effects.circular.id, size));
  }

  spawnCircularPlanes(id: ParticleEffectId) {
    this.bakedCircularEffectId = id;
    this.effectInstanceIds.circular = particle.effects.spawn(id, new Quad(), 1, true);
    for (let plane = 1; plane < NATIVE_EFFECT_PLANE_COUNT; plane++)
      this.circularPlaneInstanceIds.set(
        plane - 1,
        particle.effects.spawn(((id as unknown as number) + plane) as unknown as ParticleEffectId, new Quad(), 1, true),
      );
  }

  updateCircularEffect() {
    const { l, r } = this.getEdgeBounds(time.scaled);
    const lane = (l + r) / 2;
    const size = (r - l) / 2;

    const nextEffectId = sizedEffectId(this.effects.circular.id, size);
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
}

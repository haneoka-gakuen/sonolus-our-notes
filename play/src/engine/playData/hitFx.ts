import { stableHoldEffectWidthBucket } from "../../../../shared/src/engine/data/stableHoldEffectWidthBucket.js";
import {
  NATIVE_EFFECT_PLANE_COUNT,
  nativeLoopEffectDuration,
} from "../../../../shared/src/engine/data/nativeEffects.js";
import { nativeEffectPlaneLayout, nativeParticleProfile, particle, sizedEffectId } from "./particle.js";

export const LOOP_FX_PARTS = NATIVE_EFFECT_PLANE_COUNT;

export const spawnLoopFx = (plane: number, lane: number, size: number) => {
  const id = ((sizedEffectId(particle.effects.normalSlideConnectorCircular.id, 0) as unknown as number) +
    stableHoldEffectWidthBucket(size) * NATIVE_EFFECT_PLANE_COUNT + plane) as unknown as ParticleEffectId;
  if (!particle.effects.exists(id)) return 0 as unknown as ParticleEffectInstanceId;
  return particle.effects.spawn(id, nativeEffectPlaneLayout({ plane, lane, size }),
    nativeLoopEffectDuration(nativeParticleProfile()), true);
};

export const moveLoopFx = (instance: ParticleEffectInstanceId, plane: number, lane: number, size: number) => {
  if (instance) particle.effects.move(instance, nativeEffectPlaneLayout({ plane, lane, size }));
};

import { stableHoldEffectWidthBucket } from "../../../../shared/src/engine/data/stableHoldEffectWidthBucket.js";
import { LOOP_FRAME_DURATION } from "../../../../shared/src/engine/data/loopFrameContract.js";
import {
  NATIVE_EFFECT_PLANE_COUNT,
  nativeLoopEffectDuration,
} from "../../../../shared/src/engine/data/nativeEffects.js";
import { nativeEffectPlaneLayout, nativeParticleProfile, particle, sizedEffectId } from "./particle.js";

export const LOOP_FX_PARTS = NATIVE_EFFECT_PLANE_COUNT;

export const spawnLoopFx = (plane: number, lane: number, size: number) => {
  if (plane === 3) {
    const frame = (particle.effects.sourceLoopFrame4.id + stableHoldEffectWidthBucket(size)) as ParticleEffectId;
    if (particle.effects.exists(frame))
      return particle.effects.spawn(frame, nativeEffectPlaneLayout({ plane, lane, size }), LOOP_FRAME_DURATION, true);
  }
  const id = ((sizedEffectId(particle.effects.normalSlideConnectorCircular.id, 0) as unknown as number) +
    stableHoldEffectWidthBucket(size) * NATIVE_EFFECT_PLANE_COUNT +
    plane) as unknown as ParticleEffectId;
  if (!particle.effects.exists(id)) return 0 as unknown as ParticleEffectInstanceId;
  return particle.effects.spawn(
    id,
    nativeEffectPlaneLayout({ plane, lane, size }),
    nativeLoopEffectDuration(nativeParticleProfile()),
    true,
  );
};

export const moveLoopFx = (instance: ParticleEffectInstanceId, plane: number, lane: number, size: number) => {
  if (instance) particle.effects.move(instance, nativeEffectPlaneLayout({ plane, lane, size }));
};

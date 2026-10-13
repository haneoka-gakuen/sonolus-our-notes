import { nativeLaneEffectLayout } from "../../../../shared/src/engine/data/nativeLaneEffectLayout.js";
import { nativeLaneEffectLifetime } from "../../../../shared/src/engine/data/lane.js";
import { fxSpawnQuad, fxWorldWidth } from "../../../../shared/src/engine/data/nativeHitFx.js";
import {
  LOOP_FX_COUNT,
  LOOP_FX_DURATION,
  LOOP_FX_FIRST,
  hitFxBucket,
  hitFxCount,
  hitFxDuration,
  hitFxFirst,
  nativeHitFxNames,
} from "../../../../shared/src/engine/data/nativeHitFxNames.generated.js";
import { scaledScreen } from "./scaledScreen.js";

export const particle = defineParticle({
  effects: {
    laneNormal: "Our Notes Lane Normal",
    laneSlide: "Our Notes Lane Slide",
    laneFlick: "Our Notes Lane Flick",

    ...nativeHitFxNames,
    normalNote: nativeHitFxNames.fx0,
    slideNote: nativeHitFxNames.fx1200,
    flickNote: nativeHitFxNames.fx2304,
    connectNote: nativeHitFxNames.fx1752,
    slideLoop: nativeHitFxNames.fx4272,
  },
});

const fxId = (offset: number) =>
  ((particle.effects.fx0.id as unknown as number) + offset) as unknown as ParticleEffectId;

// Tutorial notes span chart width 8, centred on lane 0.
export const nativeNoteEffectLayout = (_plane: number) => fxSpawnQuad(0, 2);

export const playNoteEffect = (effect: ParticleEffect, _duration: number) => {
  let kind = 0;
  if (effect.id === particle.effects.slideNote.id) kind = 2;
  if (effect.id === particle.effects.flickNote.id) kind = 4;
  if (effect.id === particle.effects.connectNote.id) kind = 3;
  const count = hitFxCount(kind, 5);
  const base = hitFxFirst(kind, 5) + hitFxBucket(fxWorldWidth(2)) * count;
  const quad = fxSpawnQuad(0, 2);
  // Prefab duration preserves the shared effect's authored animation speed.
  const duration = hitFxDuration(kind, 5);
  for (let index = 0; index < count; index++) particle.effects.spawn(fxId(base + index), quad, duration, false);
};

export const playLaneEffect = (effect: ParticleEffect) => {
  // The width-eight teaching note spans four physical stage lanes.
  for (let lane = -2; lane < 2; lane++)
    effect.spawn(
      nativeLaneEffectLayout({ lane: lane + 0.5, size: 0.5, wToH: scaledScreen.wToH }),
      nativeLaneEffectLifetime,
      false,
    );
};

export const spawnHoldEffect = (): HoldEffectInstances => {
  const first = LOOP_FX_FIRST + hitFxBucket(fxWorldWidth(2)) * LOOP_FX_COUNT;
  const quad = fxSpawnQuad(0, 2);
  return {
    p0: particle.effects.spawn(fxId(first), quad, LOOP_FX_DURATION, true),
    p1: particle.effects.spawn(fxId(first + 1), quad, LOOP_FX_DURATION, true),
    p2: particle.effects.spawn(fxId(first + 2), quad, LOOP_FX_DURATION, true),
    p3: particle.effects.spawn(fxId(first + 3), quad, LOOP_FX_DURATION, true),
    p4: particle.effects.spawn(fxId(first + 4), quad, LOOP_FX_DURATION, true),
    p5: particle.effects.spawn(fxId(first + 5), quad, LOOP_FX_DURATION, true),
    p6: particle.effects.spawn(fxId(first + 6), quad, LOOP_FX_DURATION, true),
  };
};

export type HoldEffectInstances = {
  p0: ParticleEffectInstanceId;
  p1: ParticleEffectInstanceId;
  p2: ParticleEffectInstanceId;
  p3: ParticleEffectInstanceId;
  p4: ParticleEffectInstanceId;
  p5: ParticleEffectInstanceId;
  p6: ParticleEffectInstanceId;
};

export const destroyHoldEffect = (instances: HoldEffectInstances) => {
  particle.effects.destroy(instances.p0);
  particle.effects.destroy(instances.p1);
  particle.effects.destroy(instances.p2);
  particle.effects.destroy(instances.p3);
  particle.effects.destroy(instances.p4);
  particle.effects.destroy(instances.p5);
  particle.effects.destroy(instances.p6);
};

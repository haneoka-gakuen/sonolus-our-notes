import { SIMPLE_LOOP_PHASE_EFFECTS } from "../../../../shared/src/engine/data/simpleLoopPhaseEffects.js";
import {
  createSimpleLoopSource,
  releaseSimpleLoopSource,
  updateSimpleLoopSource,
  moveSimpleLoopSource,
  simpleLoopSourceMemory,
  validSimpleLoopRom,
  hasSimpleLoopSourceEffects,
  type SimpleLoopSourcePool,
} from "../../../../shared/src/engine/data/simpleLoopSourceFactory.js";
import { nativeLaneEffectLayout } from "../../../../shared/src/engine/data/nativeLaneEffectLayout.js";
import { nativeLaneEffectLifetime } from "../../../../shared/src/engine/data/lane.js";
import {
  NATIVE_EFFECT_PLANE_COUNT,
  NATIVE_EFFECT_CONTRACT,
  nativeLoopEffectDuration,
  nativeEffectPlaneQuad,
  nativeEffectSpawnPlane,
  nativeNoteEffectDuration,
  nativeEffectTable,
  nativeEarlyPointEffectTable,
  nativeBackgroundEffectTable,
  nativeShortEffectTable,
  nativeSlideShortEffectTable,
  NATIVE_EFFECT_BACKGROUND,
  NATIVE_SHORT_EFFECTS,
  NATIVE_SHORT_EFFECT_DURATION_RATIO,
  NATIVE_SHORT_SLIDE_EFFECT,
  NATIVE_PARTICLE_TIMINGS,
  NATIVE_EFFECT_WIDTHS,
  NATIVE_EARLY_POINT_EFFECT,
  nativeEffectVariant,
} from "../../../../shared/src/engine/data/nativeEffects.js";
import { optionsDefinition } from "../../../../shared/src/engine/configuration/options.js";
import { scaledScreen } from "./scaledScreen.js";

const names = nativeEffectTable();
export const particle = defineParticle({
  effects: {
    laneNormal: "Our Notes Lane Normal",
    laneSlide: "Our Notes Lane Slide",
    laneFlick: "Our Notes Lane Flick",
    ...names,
    simpleProfile: NATIVE_EFFECT_CONTRACT.nativeEffects.simpleCapability,
    normalNote: names.normalNoteCircular,
    slideNote: names.slideNoteCircular,
    flickNote: names.flickNoteCircular,
    connectNote: names.normalTraceNoteCircular,
    slideLoop: names.normalSlideConnectorCircular,
    ...nativeEarlyPointEffectTable(),
    ...nativeBackgroundEffectTable(),
    ...nativeShortEffectTable(),
    ...nativeSlideShortEffectTable(),
    sourceSimpleLoop: "Our Notes Source SimpleLoop Point",
    ...SIMPLE_LOOP_PHASE_EFFECTS,
  },
});

// Tutorial notes span chart width 8, centred on lane 0.
export const nativeNoteEffectLayout = (plane: number, lane: number) =>
  nativeEffectPlaneQuad(plane, lane, 2, optionsDefinition.noteEffectSize.def, scaledScreen.wToH);

const variantId = (baseId: ParticleEffectId, plane: number): ParticleEffectId =>
  (nativeEffectVariant(baseId as unknown as number, 2) + plane) as unknown as ParticleEffectId;

const backgroundVariants = NATIVE_EFFECT_BACKGROUND.keys.map(
  (key) =>
    [
      particle.effects[key].id as unknown as number,
      particle.effects[`background_${key}`].id as unknown as number,
    ] as const,
);
const earlyVariants = NATIVE_EARLY_POINT_EFFECT.keys.map(
  (key) =>
    [
      particle.effects[key].id as unknown as number,
      particle.effects[`earlyPoint_${key}`].id as unknown as number,
    ] as const,
);
const shortVariants = Object.entries(NATIVE_SHORT_EFFECTS).map(
  ([key, { sourceKey }]) =>
    [
      particle.effects[sourceKey].id as unknown as number,
      particle.effects[key as keyof typeof NATIVE_SHORT_EFFECTS].id as unknown as number,
    ] as const,
);

const spawnNotePlanes = (base: ParticleEffectId, duration: number, lane: number) => {
  const variant = variantId(base, 0) as unknown as number;
  for (const [sourceBase, backgroundBase] of backgroundVariants) {
    const offset = variant - sourceBase;
    if (offset < 0 || offset >= NATIVE_EFFECT_WIDTHS.length * NATIVE_EFFECT_PLANE_COUNT) continue;
    const id = (backgroundBase + Math.floor(offset / NATIVE_EFFECT_PLANE_COUNT)) as unknown as ParticleEffectId;
    if (particle.effects.exists(id))
      particle.effects.spawn(id, nativeNoteEffectLayout(NATIVE_EFFECT_BACKGROUND.plane, lane), duration, false);
    break;
  }
  for (let order = 0; order < NATIVE_EFFECT_PLANE_COUNT; order++) {
    const plane = nativeEffectSpawnPlane(order);
    if (plane === 0)
      for (const [sourceBase, earlyBase] of earlyVariants) {
        const offset = variant - sourceBase;
        if (offset < 0 || offset >= NATIVE_EFFECT_WIDTHS.length * NATIVE_EFFECT_PLANE_COUNT) continue;
        const id = (earlyBase + Math.floor(offset / NATIVE_EFFECT_PLANE_COUNT)) as unknown as ParticleEffectId;
        if (particle.effects.exists(id))
          particle.effects.spawn(
            id,
            nativeNoteEffectLayout(plane, lane),
            duration * NATIVE_EARLY_POINT_EFFECT.durationRatio,
            false,
          );
        break;
      }
    const id = (variant + plane) as unknown as ParticleEffectId;
    if (particle.effects.exists(id)) particle.effects.spawn(id, nativeNoteEffectLayout(plane, lane), duration, false);
  }
};

export const playNoteEffect = (effect: ParticleEffect, _duration: number, lane: number, direction: number) => {
  let operateType = 1;
  let base = particle.effects.normalNoteCircular.id;
  if (effect.id === particle.effects.slideNote.id) {
    base = particle.effects.slideNoteCircular.id;
    operateType = 20;
  }
  if (effect.id === particle.effects.flickNote.id) {
    base =
      direction === 1
        ? particle.effects.flickLeftWall.id
        : direction === 2
          ? particle.effects.flickRightWall.id
          : particle.effects.flickNoteCircular.id;
    operateType = 40;
  }
  if (effect.id === particle.effects.connectNote.id) {
    base = particle.effects.normalTraceNoteCircular.id;
    operateType = 60;
  }
  let duration = nativeNoteEffectDuration(particle.effects.simpleProfile.exists ? 2 : 1, operateType, 5);
  if (operateType === 20 && duration === NATIVE_SHORT_SLIDE_EFFECT.sourceDuration) {
    const candidate = variantId(particle.effects.shortSlideNoteCircular.id, 0);
    if (particle.effects.exists(candidate)) {
      base = particle.effects.shortSlideNoteCircular.id;
      duration = NATIVE_SHORT_SLIDE_EFFECT.duration;
    }
  }
  if (operateType === 40 && duration === NATIVE_PARTICLE_TIMINGS.simpleFlick[0]) {
    for (const [sourceBase, shortBase] of shortVariants) {
      if ((base as unknown as number) !== sourceBase) continue;
      const candidate = variantId(shortBase as unknown as ParticleEffectId, 0);
      if (particle.effects.simpleProfile.exists && particle.effects.exists(candidate)) {
        base = shortBase as unknown as ParticleEffectId;
        duration *= NATIVE_SHORT_EFFECT_DURATION_RATIO;
      }
    }
  }
  spawnNotePlanes(base, duration, lane);
};

export const playLaneEffect = (effect: ParticleEffect, center: number) => {
  for (let lane = 8; lane < 16; lane++)
    effect.spawn(
      nativeLaneEffectLayout({ lane: center + (lane + 0.5) / 2 - 6, size: 0.25, wToH: scaledScreen.wToH }),
      nativeLaneEffectLifetime,
      false,
    );
};

const spawnHoldPlane = (plane: number, lane: number) => {
  const id = variantId(particle.effects.normalSlideConnectorCircular.id, plane);
  if (!particle.effects.exists(id)) return 0 as unknown as ParticleEffectInstanceId;
  return particle.effects.spawn(
    id,
    nativeNoteEffectLayout(plane, lane),
    nativeLoopEffectDuration(particle.effects.simpleProfile.exists ? 2 : 1),
    true,
  );
};

export type HoldEffectInstances = {
  p0: ParticleEffectInstanceId;
  p1: ParticleEffectInstanceId;
  p2: ParticleEffectInstanceId;
  p3: ParticleEffectInstanceId;
};

const sourceLoop = createSimpleLoopSource(
  tutorialMemory(simpleLoopSourceMemory(1) as never) as unknown as SimpleLoopSourcePool,
  1,
);
const holdSource = tutorialMemory({ active: Boolean, endTime: Number });
const sourceOwner = 0;

export const spawnHoldEffect = (lane: number, endTime: number): HoldEffectInstances => {
  releaseSimpleLoopSource(sourceLoop, sourceOwner, time.now, false);
  holdSource.active =
    particle.effects.sourceSimpleLoop.exists && validSimpleLoopRom() && hasSimpleLoopSourceEffects(particle.effects);
  holdSource.endTime = endTime;

  const instances = {
    p0: 0 as unknown as ParticleEffectInstanceId,
    p1: 0 as unknown as ParticleEffectInstanceId,
    p2: 0 as unknown as ParticleEffectInstanceId,
    p3: 0 as unknown as ParticleEffectInstanceId,
  };
  for (let order = 0; order < NATIVE_EFFECT_PLANE_COUNT; order++) {
    const plane = nativeEffectSpawnPlane(order);
    if (plane === 0 && holdSource.active) continue;
    const id = spawnHoldPlane(plane, lane);
    if (plane === 0) instances.p0 = id;
    else if (plane === 1) instances.p1 = id;
    else if (plane === 2) instances.p2 = id;
    else instances.p3 = id;
  }
  return instances;
};

export const destroyHoldEffect = (instances: HoldEffectInstances) => {
  releaseSimpleLoopSource(sourceLoop, sourceOwner, time.now, false);
  holdSource.active = false;
  if (instances.p0) particle.effects.destroy(instances.p0);
  if (instances.p1) particle.effects.destroy(instances.p1);
  if (instances.p2) particle.effects.destroy(instances.p2);
  if (instances.p3) particle.effects.destroy(instances.p3);
  instances.p0 = 0 as unknown as ParticleEffectInstanceId;
  instances.p1 = 0 as unknown as ParticleEffectInstanceId;
  instances.p2 = 0 as unknown as ParticleEffectInstanceId;
  instances.p3 = 0 as unknown as ParticleEffectInstanceId;
};

export const updateHoldSource = (lane: number) => {
  if (holdSource.active) {
    if (time.now >= holdSource.endTime) {
      releaseSimpleLoopSource(sourceLoop, sourceOwner, time.now, false);
      holdSource.active = false;
    } else {
      holdSource.active = updateSimpleLoopSource(
        sourceLoop,
        sourceOwner,
        time.now,
        lane,
        2,
        particle.effects,
        holdSource.endTime,
      );
      moveSimpleLoopSource(
        sourceLoop,
        sourceOwner,
        time.now,
        lane,
        optionsDefinition.noteEffectSize.def,
        scaledScreen.wToH,
      );
    }
  }
};

export const moveHoldEffect = (instances: HoldEffectInstances, lane: number) => {
  if (instances.p0) particle.effects.move(instances.p0, nativeNoteEffectLayout(0, lane));
  if (instances.p1) particle.effects.move(instances.p1, nativeNoteEffectLayout(1, lane));
  if (instances.p2) particle.effects.move(instances.p2, nativeNoteEffectLayout(2, lane));
  if (instances.p3) particle.effects.move(instances.p3, nativeNoteEffectLayout(3, lane));
};

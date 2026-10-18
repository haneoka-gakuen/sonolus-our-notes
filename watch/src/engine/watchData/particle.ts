import {
  connectWallDrawCapability,
  connectFrameDrawCapability,
} from "../../../../shared/src/engine/data/connectWallDrawContract.js";
import { drawConnectWallAggregate } from "../../../../shared/src/engine/data/connectWallAggregate.js";
import { skin } from "./skin.js";
import { connectWallEffectTable } from "../../../../shared/src/engine/data/connectWallContract.js";
import { SIMPLE_LOOP_PHASE_EFFECTS } from "../../../../shared/src/engine/data/simpleLoopPhaseEffects.js";
import {
  NativeLaneEffectType,
  canRestartNativeLaneEffect,
  readNativeLaneEffectInstance,
  writeNativeLaneEffectInstance,
} from "../../../../shared/src/engine/data/nativeLaneFeedback.js";
import { nativeLaneEffectLayout } from "../../../../shared/src/engine/data/nativeLaneEffectLayout.js";
import {
  nativeEffectSkew,
  nativeLaneEffectLifetime,
  nativeLaneEffectGuardLifetime,
} from "../../../../shared/src/engine/data/lane.js";
import { options } from "../configuration/options.js";
import {
  nativeEffectTable,
  nativeBackgroundEffectTable,
  nativeEarlyPointEffectTable,
  NATIVE_EARLY_POINT_EFFECT,
  NATIVE_EFFECT_BACKGROUND,
  nativeShortEffectTable,
  nativeSlideShortEffectTable,
  NATIVE_SHORT_SLIDE_EFFECT,
  NATIVE_SHORT_EFFECTS,
  NATIVE_SHORT_EFFECT_DURATION_RATIO,
  NATIVE_EFFECT_WIDTHS,
  NATIVE_PARTICLE_TIMINGS,
  NATIVE_EFFECT_CONTRACT,
  NATIVE_EFFECT_PLANE_COUNT,
  nativeEffectPlaneQuad,
  nativeEffectSpawnPlane,
  nativeEffectVariant,
} from "../../../../shared/src/engine/data/nativeEffects.js";
import { scaledScreen } from "./scaledScreen.js";

const unused = "Our Notes Unused";

export const particle = defineParticle({
  effects: {
    laneInVain: "Our Notes Lane In Vain",
    laneNormal: "Our Notes Lane Normal",
    laneSlide: "Our Notes Lane Slide",
    laneFlick: "Our Notes Lane Flick",
    laneFlickLeft: "Our Notes Lane Flick Left",
    laneFlickRight: "Our Notes Lane Flick Right",

    ...nativeEffectTable(),
    simpleProfile: NATIVE_EFFECT_CONTRACT.nativeEffects.simpleCapability,

    // Our Notes Critical changes judgment windows only; it has no
    // separate visual. These resolve to the ordinary variants' blocks.
    normalNoteLinear: unused,
    slideNoteLinear: unused,
    flickNoteLinear: unused,
    flickNoteDirectional: unused,
    criticalNoteCircular: unused,
    criticalNoteLinear: unused,
    normalTraceNoteLinear: unused,
    criticalTraceNoteCircular: unused,
    criticalTraceNoteLinear: unused,
    normalSlideTickNote: unused,
    criticalSlideTickNote: unused,
    normalSlideConnectorLinear: unused,
    criticalSlideConnectorCircular: unused,
    criticalSlideConnectorLinear: unused,
    flickLeftSparks: unused,
    flickRightSparks: unused,
    sourceSimpleLoop: "Our Notes Source SimpleLoop Point",
    ...SIMPLE_LOOP_PHASE_EFFECTS,
    ...nativeShortEffectTable(),
    ...nativeSlideShortEffectTable(),
    ...nativeBackgroundEffectTable(),
    ...nativeEarlyPointEffectTable(),
    ...connectWallEffectTable(),
    sourceConnectDrawStandard: connectWallDrawCapability("standard"),
    sourceConnectDrawLight: connectWallDrawCapability("light"),
    sourceConnectDrawSimple: connectWallDrawCapability("simple"),
    sourceConnectFrameStandard: connectFrameDrawCapability("standard"),
    sourceConnectFrameLight: connectFrameDrawCapability("light"),
    sourceConnectFrameSimple: connectFrameDrawCapability("simple"),
    sourceConnectWall0: "Our Notes Source Connect Wall 00",
    sourceConnectWall63: "Our Notes Source Connect Wall 63",
  },
});

export const connectWallDrawProfile = levelData({ value: Number, frameEnabled: Boolean });
export const initializeConnectWallDraw = () => {
  connectWallDrawProfile.value = -1;
  connectWallDrawProfile.frameEnabled = false;
  if (!skin.sprites.sourceConnectDraw0.exists || !skin.sprites.sourceConnectDraw53.exists) return;
  if (particle.effects.sourceConnectDrawStandard.exists) connectWallDrawProfile.value = 0;
  else if (particle.effects.sourceConnectDrawLight.exists) connectWallDrawProfile.value = 1;
  else if (particle.effects.sourceConnectDrawSimple.exists) connectWallDrawProfile.value = 2;
  if (!skin.sprites.sourceConnectFrameDraw0.exists || !skin.sprites.sourceConnectFrameDraw287.exists) return;
  connectWallDrawProfile.frameEnabled =
    (connectWallDrawProfile.value === 0 && particle.effects.sourceConnectFrameStandard.exists) ||
    (connectWallDrawProfile.value === 1 && particle.effects.sourceConnectFrameLight.exists) ||
    (connectWallDrawProfile.value === 2 && particle.effects.sourceConnectFrameSimple.exists);
};
export const drawConnectWalls = () =>
  drawConnectWallAggregate(
    connectWallDrawProfile.value,
    skin.sprites.sourceConnectDraw0.id as unknown as number,
    connectWallDrawProfile.frameEnabled ? (skin.sprites.sourceConnectFrameDraw0.id as unknown as number) : -1,
    options.noteEffectSize,
    scaledScreen.wToH,
  );

const backgroundEffectVariants = NATIVE_EFFECT_BACKGROUND.keys.map(
  (key) =>
    [
      particle.effects[key].id as unknown as number,
      particle.effects[`background_${key}`].id as unknown as number,
    ] as const,
);

const shortEffectVariants = Object.entries(NATIVE_SHORT_EFFECTS).map(
  ([key, { sourceKey }]) =>
    [
      particle.effects[sourceKey].id as unknown as number,
      particle.effects[key as keyof typeof NATIVE_SHORT_EFFECTS].id as unknown as number,
    ] as const,
);

const earlyPointEffectVariants = NATIVE_EARLY_POINT_EFFECT.keys.map(
  (key) =>
    [
      particle.effects[key].id as unknown as number,
      particle.effects[`earlyPoint_${key}`].id as unknown as number,
    ] as const,
);

export const nativeParticleProfile = () => (particle.effects.simpleProfile.exists ? 2 : 1);

/**
 * Selected semantic width variant of a base effect. Critical and slide-tick
 * aliases map onto their ordinary block (no separate authored visual).
 */
export const sizedEffectId = (baseId: ParticleEffectId, size: number): ParticleEffectId => {
  let id: number = baseId as unknown as number;
  const { effects } = particle;
  if (baseId === effects.criticalNoteCircular.id) id = effects.normalNoteCircular.id as unknown as number;
  if (baseId === effects.criticalTraceNoteCircular.id) id = effects.normalTraceNoteCircular.id as unknown as number;
  if (baseId === effects.normalSlideTickNote.id) id = effects.normalTraceNoteCircular.id as unknown as number;
  if (baseId === effects.criticalSlideTickNote.id) id = effects.normalTraceNoteCircular.id as unknown as number;
  if (baseId === effects.criticalSlideConnectorCircular.id)
    id = effects.normalSlideConnectorCircular.id as unknown as number;
  return nativeEffectVariant(id, size) as unknown as ParticleEffectId;
};

export const linearEffectLayout = ({ lane, size, shear }: { lane: number; size: number; shear: number }) => {
  // LiveGameNoteEffectBase.SetWidth scales the effect root horizontally by
  // the authored note width instead of using one fixed-width particle quad.
  const w = size * options.noteEffectSize;
  const h = options.noteEffectSize * scaledScreen.wToH;
  const p = 1 + 2 * h * nativeEffectSkew;

  const b = 1;
  const t = 1 - 2 * h;

  shear *= size * options.noteEffectSize;

  return {
    x1: lane - w,
    x2: lane * p - w + shear,
    x3: lane * p + w + shear,
    x4: lane + w,
    y1: b,
    y2: t,
    y3: t,
    y4: b,
  };
};

/** Baked ground-plane light; lane-centre perspective contracts toward the horizon. */
export const groundEffectLayout = ({ lane, size }: { lane: number; size: number }) =>
  nativeLaneEffectLayout({ lane, size, wToH: scaledScreen.wToH });

/**
 * Spawn quad of plane layer `plane`: the linearEffectLayout rect in that
 * plane's perspective.
 */
export const nativeEffectPlaneLayout = ({ plane, lane, size }: { plane: number; lane: number; size: number }) =>
  nativeEffectPlaneQuad(plane, lane, size, options.noteEffectSize, scaledScreen.wToH);

/** Spawn every plane layer of a native hit effect (a sizedEffectId). */
export const spawnNativeEffect = (
  variantId: ParticleEffectId,
  lane: number,
  size: number,
  duration: number,
  _sourceBirth: number,
  coalesceWall: boolean,
) => {
  const offset = (variantId as unknown as number) - (particle.effects.normalTraceNoteCircular.id as unknown as number);
  const aggregateWall =
    coalesceWall &&
    offset >= 0 &&
    offset < NATIVE_EFFECT_WIDTHS.length * NATIVE_EFFECT_PLANE_COUNT &&
    hasAggregateConnectWalls();

  for (const [sourceBase, backgroundBase] of backgroundEffectVariants) {
    const offset = (variantId as unknown as number) - sourceBase;
    if (offset < 0 || offset >= NATIVE_EFFECT_WIDTHS.length * NATIVE_EFFECT_PLANE_COUNT) continue;
    const id = (backgroundBase + Math.floor(offset / NATIVE_EFFECT_PLANE_COUNT)) as unknown as ParticleEffectId;
    if (particle.effects.exists(id))
      particle.effects.spawn(
        id,
        nativeEffectPlaneLayout({ plane: NATIVE_EFFECT_BACKGROUND.plane, lane, size }),
        duration,
        false,
      );
    break;
  }
  for (let order = 0; order < NATIVE_EFFECT_PLANE_COUNT; order++) {
    const plane = nativeEffectSpawnPlane(order);
    if (plane === 1 && aggregateWall) continue;
    if (plane === 3 && aggregateWall && connectWallDrawProfile.frameEnabled) continue;
    if (plane === 0)
      for (const [sourceBase, earlyBase] of earlyPointEffectVariants) {
        const offset = (variantId as unknown as number) - sourceBase;
        if (offset < 0 || offset >= NATIVE_EFFECT_WIDTHS.length * NATIVE_EFFECT_PLANE_COUNT) continue;
        const early = (earlyBase + Math.floor(offset / NATIVE_EFFECT_PLANE_COUNT)) as unknown as ParticleEffectId;
        if (particle.effects.exists(early))
          particle.effects.spawn(
            early,
            nativeEffectPlaneLayout({ plane, lane, size }),
            duration * NATIVE_EARLY_POINT_EFFECT.durationRatio,
            false,
          );
        break;
      }
    const id = ((variantId as unknown as number) + plane) as unknown as ParticleEffectId;
    if (particle.effects.exists(id))
      particle.effects.spawn(id, nativeEffectPlaneLayout({ plane, lane, size }), duration, false);
  }
};

export const spawnNativeSlideEffect = (variantId: ParticleEffectId, lane: number, size: number, duration: number) => {
  let selectedId = variantId;
  let selectedDuration = duration;
  if (duration === NATIVE_SHORT_SLIDE_EFFECT.sourceDuration) {
    const offset = (variantId as unknown as number) - (particle.effects.slideNoteCircular.id as unknown as number);
    const candidate = ((particle.effects.shortSlideNoteCircular.id as unknown as number) +
      offset) as unknown as ParticleEffectId;
    if (particle.effects.exists(candidate)) {
      selectedId = candidate;
      selectedDuration = NATIVE_SHORT_SLIDE_EFFECT.duration;
    }
  }
  spawnNativeEffect(selectedId, lane, size, selectedDuration, time.now, false);
};

export const spawnNativeFlickEffect = (variantId: ParticleEffectId, lane: number, size: number, duration: number) => {
  let selectedId = variantId;
  let selectedDuration = duration;
  if (duration === NATIVE_PARTICLE_TIMINGS.simpleFlick[0]) {
    for (const [sourceBase, shortBase] of shortEffectVariants) {
      const offset = (variantId as unknown as number) - sourceBase;
      if (offset < 0 || offset >= NATIVE_EFFECT_WIDTHS.length * NATIVE_EFFECT_PLANE_COUNT) continue;
      const candidate = (shortBase + offset) as unknown as ParticleEffectId;
      if (particle.effects.simpleProfile.exists && particle.effects.exists(candidate)) {
        selectedId = candidate;
        selectedDuration = duration * NATIVE_SHORT_EFFECT_DURATION_RATIO;
      }
    }
  }
  spawnNativeEffect(selectedId, lane, size, selectedDuration, time.now, false);
};

/** Empty feedback yields to active successful feedback on the same lane. */
export const restartNativeLaneEffect = (type: number, lane: number) => {
  if (lane < 0 || lane > 23) return;
  const visualExpiresAt = time.now + nativeLaneEffectLifetime;
  if (!canRestartNativeLaneEffect(type, lane, time.now, visualExpiresAt)) return;
  const previous = readNativeLaneEffectInstance(lane, time.now) as unknown as ParticleEffectInstanceId;
  if (previous) particle.effects.destroy(previous);
  const id =
    type === NativeLaneEffectType.Normal
      ? particle.effects.laneNormal.id
      : type === NativeLaneEffectType.Slide
        ? particle.effects.laneSlide.id
        : type === NativeLaneEffectType.Flick
          ? particle.effects.laneFlick.id
          : type === NativeLaneEffectType.FlickLeft
            ? particle.effects.laneFlickLeft.id
            : type === NativeLaneEffectType.FlickRight
              ? particle.effects.laneFlickRight.id
              : particle.effects.laneInVain.id;
  const instance = particle.effects.spawn(
    id,
    groundEffectLayout({ lane: (lane + 0.5) / 2 - 6, size: 0.25 }),
    nativeLaneEffectLifetime,
    false,
  );
  writeNativeLaneEffectInstance(
    type,
    lane,
    instance as unknown as number,
    visualExpiresAt,
    time.now + nativeLaneEffectGuardLifetime,
  );
};

export const hasAggregateConnectWalls = () =>
  particle.effects.sourceConnectWall0.exists && particle.effects.sourceConnectWall63.exists;

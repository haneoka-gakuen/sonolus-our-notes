// Each selectable particle item supplies the same semantic width/plane IDs.
// Every base effect owns one contiguous WIDTH_COUNT * PLANE_COUNT block.

/** Seconds from the selected effect Animator clips (Perfect, Great, Good, Bad). */
export const NATIVE_PARTICLE_TIMINGS = {
    normal: [5 / 12, 5 / 12, 5 / 12, 5 / 12],
    slide: [7 / 12, 5 / 12, 5 / 12, 5 / 12],
    flick: [5 / 12, 1 / 2, 1 / 2, 7 / 12],
    simpleFlick: [3 / 4, 1 / 2, 1 / 2, 5 / 12],
    loopAnimation: 1 / 10,
    // Common periods of the independent ParticleSystem and Animator clocks.
    // Full/Light: 2/7, 1/5, 1/4, 1/10. Simple: 1/5, 1/7, 3/20, 1/10.
    loopParticle: 2,
    loopParticles: [2, 2, 3],
} as const

/** Native judgment 1=Miss, 2=Bad, 3=Good, 4=Great, 5=Perfect (6 reserved). */
export const nativeNoteEffectDuration = (profile: number, operateType: number, judgment: number) => {
    if (judgment < 2) return 0
    if (operateType === 40 || operateType === 41 || operateType === 42 || operateType === 102) {
        if (judgment === 3 || judgment === 4) return 1 / 2
        if (profile === 2) return judgment >= 5 ? 3 / 4 : 5 / 12
        return judgment >= 5 ? 5 / 12 : 7 / 12
    }
    if (
        operateType === 20 || operateType === 21 || operateType === 22 ||
        operateType === 60 || operateType === 61 || operateType === 62 || operateType === 63 ||
        operateType === 104 || operateType === 105
    ) return judgment >= 5 ? 7 / 12 : 5 / 12
    return 5 / 12
}

export const NATIVE_EFFECT_PROFILES = ['Our Notes Light', 'Our Notes Native', 'Our Notes Simple'] as const
/** MasterLiveQualitySettings values used to author the three native profiles. */
export const NATIVE_EFFECT_PROFILE_QUALITIES = [2, 0, 0] as const
/** Unity skin folders used to author the native profiles. */
export const NATIVE_EFFECT_PROFILE_SKINS = ['effect001', 'effect001', 'effect001Simple'] as const
/** Chart widths with authored effects; must match NATIVE_EFFECT_WIDTHS. */
export const NATIVE_EFFECT_WIDTHS = [4, 6, 8, 12, 24] as const
/** Width thresholds used by nativeEffectWidthBucket. */
export const NATIVE_EFFECT_WIDTH_THRESHOLDS = [5, 7, 10, 18] as const
const WIDTH_COUNT = NATIVE_EFFECT_WIDTHS.length

/**
 * Plane layers: on-screen lane offset = lane * (alpha1 + slope * (y - 1)) in
 * stage units (y = 1 at the judgement line). Measured from the live camera
 * (trace.ts planeAlpha): vertical planes at depth 0 / -0.64 / +0.6 and the
 * ground. Plane 0 equals linearEffectLayout's nativeEffectSkew.
 */
export const NATIVE_EFFECT_PLANES = [
    { alpha1: 1, slope: -0.590625732432454 },
    { alpha1: 0.9376218323586744, slope: -0.5537835814814996 },
    { alpha1: 1.0665188470066516, slope: -0.6299134751663208 },
    { alpha1: 1, slope: 1 },
] as const
export const NATIVE_EFFECT_PLANE_COUNT = NATIVE_EFFECT_PLANES.length
export const NATIVE_EFFECT_PLANE_LABELS = ['P0', 'P1', 'P2', 'P3'] as const
/** Emit the wall and ground planes before P0's foreground particles. */
export const nativeEffectSpawnPlane = (order: number) => (order + 1) % NATIVE_EFFECT_PLANE_COUNT

/** Optional background pass uses P0 projection before the existing four passes. */
export const NATIVE_EFFECT_BACKGROUND = {
    label: 'B0',
    plane: 0,
    keys: ['normalNoteCircular', 'flickNoteCircular'],
    targets: ['play', 'watch'],
} as const

/** Base names without profile prefix, keyed by the engine's effect slots. */
export const NATIVE_EFFECT_BASES = {
    normalNoteCircular: 'Normal',
    normalNoteGreat: 'Normal Great',
    normalNoteGood: 'Normal Good',
    normalNoteBad: 'Normal Bad',
    slideNoteCircular: 'Slide',
    slideNoteGreat: 'Slide Great',
    slideNoteGood: 'Slide Good',
    slideNoteBad: 'Slide Bad',
    flickNoteCircular: 'Flick',
    flickNoteGreat: 'Flick Great',
    flickNoteGood: 'Flick Good',
    flickNoteBad: 'Flick Bad',
    flickLeftWall: 'Flick Left',
    flickLeftGreat: 'Flick Left Great',
    flickLeftGood: 'Flick Left Good',
    flickLeftBad: 'Flick Left Bad',
    flickRightWall: 'Flick Right',
    flickRightGreat: 'Flick Right Great',
    flickRightGood: 'Flick Right Good',
    flickRightBad: 'Flick Right Bad',
    normalTraceNoteCircular: 'Connect',
    normalTraceNoteGreat: 'Connect Great',
    normalTraceNoteGood: 'Connect Good',
    normalTraceNoteBad: 'Connect Bad',
    normalSlideConnectorCircular: 'Slide Loop',
} as const

export const NATIVE_SHORT_EFFECTS = {
  shortFlickNoteCircular: { sourceKey: "flickNoteCircular", baseName: "Flick" },
  shortFlickLeftWall: { sourceKey: "flickLeftWall", baseName: "Flick Left" },
  shortFlickRightWall: { sourceKey: "flickRightWall", baseName: "Flick Right" },
} as const;
export const NATIVE_SHORT_EFFECT_DURATION = 5 / 12;
export const NATIVE_SHORT_EFFECT_DURATION_RATIO = NATIVE_SHORT_EFFECT_DURATION / NATIVE_PARTICLE_TIMINGS.simpleFlick[0];

export const NATIVE_SHORT_SLIDE_EFFECT = {
  key: "shortSlideNoteCircular",
  sourceKey: "slideNoteCircular",
  baseName: "Slide",
  profiles: ["standard", "light"],
  sourceDuration: NATIVE_PARTICLE_TIMINGS.slide[0],
  duration: 0.45,
} as const;

type NativeEffectKey = keyof typeof NATIVE_EFFECT_BASES

/** Public asset/compiler contract generated into contract/native-effects.json. */
export const NATIVE_EFFECT_CONTRACT = {
    schemaVersion: 2,
    engine: 'ourNotes',
    package: '@haneoka/sonolus-our-notes',
    targets: ['play', 'watch', 'preview', 'tutorial'],
    nativeEffects: {
        profiles: NATIVE_EFFECT_PROFILES,
        semanticPrefix: 'Our Notes Native',
        simpleCapability: 'Our Notes Profile Simple',
        profileQualities: NATIVE_EFFECT_PROFILE_QUALITIES,
        profileSkins: NATIVE_EFFECT_PROFILE_SKINS,
        widths: NATIVE_EFFECT_WIDTHS,
        widthThresholds: NATIVE_EFFECT_WIDTH_THRESHOLDS,
        planes: NATIVE_EFFECT_PLANES.map((plane, index) => ({
            label: NATIVE_EFFECT_PLANE_LABELS[index]!,
            ...plane,
        })),
        baseNames: NATIVE_EFFECT_BASES,
        background: NATIVE_EFFECT_BACKGROUND,
        timings: NATIVE_PARTICLE_TIMINGS,
        shortEffects: {
            profiles: ['Our Notes Simple'],
            sourceDuration: NATIVE_PARTICLE_TIMINGS.simpleFlick[0],
            duration: NATIVE_SHORT_EFFECT_DURATION,
            bases: NATIVE_SHORT_EFFECTS,
        },
        shortSlideEffect: NATIVE_SHORT_SLIDE_EFFECT,
    },
} as const

/** Identical effect names across Standard, Light and Simple particle items. */
export const nativeEffectTable = (): Record<NativeEffectKey, string> & Record<string, string> => {
    const table = {} as Record<NativeEffectKey, string> & Record<string, string>
    for (const [key, base] of Object.entries(NATIVE_EFFECT_BASES) as [NativeEffectKey, string][]) {
        NATIVE_EFFECT_WIDTHS.forEach((width, widthIndex) => {
            NATIVE_EFFECT_PLANE_LABELS.forEach((plane, planeIndex) => {
                const first = widthIndex === 0 && planeIndex === 0
                table[first ? key : `${key}_${widthIndex}_${planeIndex}`] =
                    `${NATIVE_EFFECT_CONTRACT.nativeEffects.semanticPrefix} ${base} W${width} ${plane}`
            })
        })
    }
    return table
}

/** Appended optional IDs keep every existing native effect index stable. */
export const nativeBackgroundEffectTable = (): Record<`background_${typeof NATIVE_EFFECT_BACKGROUND.keys[number]}`, string> & Record<string, string> => {
    const table = {} as Record<`background_${typeof NATIVE_EFFECT_BACKGROUND.keys[number]}`, string> & Record<string, string>
    for (const key of NATIVE_EFFECT_BACKGROUND.keys) {
        NATIVE_EFFECT_WIDTHS.forEach((width, index) => {
            table[index === 0 ? `background_${key}` : `background_${key}_${index}`] =
                `${NATIVE_EFFECT_CONTRACT.nativeEffects.semanticPrefix} ${NATIVE_EFFECT_BASES[key]} W${width} ${NATIVE_EFFECT_BACKGROUND.label}`
        })
    }
    return table
}

export const nativeShortEffectTable = (): Record<keyof typeof NATIVE_SHORT_EFFECTS, string> &
  Record<string, string> => {
  const table = {} as Record<keyof typeof NATIVE_SHORT_EFFECTS, string> & Record<string, string>;
  for (const [key, { baseName }] of Object.entries(NATIVE_SHORT_EFFECTS)) {
    NATIVE_EFFECT_WIDTHS.forEach((width, widthIndex) => {
      NATIVE_EFFECT_PLANE_LABELS.forEach((plane, planeIndex) => {
        table[widthIndex === 0 && planeIndex === 0 ? key : `${key}_${widthIndex}_${planeIndex}`] =
          `${NATIVE_EFFECT_CONTRACT.nativeEffects.semanticPrefix} ${baseName} Short W${width} ${plane}`;
      });
    });
  }
  return table;
};

export const nativeSlideShortEffectTable = (): Record<"shortSlideNoteCircular", string> & Record<string, string> => {
  const table = {} as Record<"shortSlideNoteCircular", string> & Record<string, string>;
  NATIVE_EFFECT_WIDTHS.forEach((width, widthIndex) => {
    NATIVE_EFFECT_PLANE_LABELS.forEach((plane, planeIndex) => {
      table[
        widthIndex === 0 && planeIndex === 0
          ? NATIVE_SHORT_SLIDE_EFFECT.key
          : `${NATIVE_SHORT_SLIDE_EFFECT.key}_${widthIndex}_${planeIndex}`
      ] =
        `${NATIVE_EFFECT_CONTRACT.nativeEffects.semanticPrefix} ${NATIVE_SHORT_SLIDE_EFFECT.baseName} Short W${width} ${plane}`;
    });
  });
  return table;
};

/** Fixed Source point windows in the first half can retire without a frame scheduler. */
export const NATIVE_EARLY_POINT_EFFECT = {
    keys: ['normalNoteCircular', 'flickNoteCircular'],
    durationRatio: 1 / 2,
} as const

export const nativeEarlyPointEffectTable = (): Record<`earlyPoint_${typeof NATIVE_EARLY_POINT_EFFECT.keys[number]}`, string> & Record<string, string> => {
    const table = {} as Record<`earlyPoint_${typeof NATIVE_EARLY_POINT_EFFECT.keys[number]}`, string> & Record<string, string>
    for (const key of NATIVE_EARLY_POINT_EFFECT.keys) {
        NATIVE_EFFECT_WIDTHS.forEach((width, index) => {
            table[index === 0 ? `earlyPoint_${key}` : `earlyPoint_${key}_${index}`] =
                `${NATIVE_EFFECT_CONTRACT.nativeEffects.semanticPrefix} ${NATIVE_EFFECT_BASES[key]} W${width} P0 Early`
        })
    }
    return table
}

export const nativeOptionalEffectTable = () => ({
    ...nativeShortEffectTable(),
    ...nativeSlideShortEffectTable(),
    ...nativeBackgroundEffectTable(),
    ...nativeEarlyPointEffectTable(),
});

/** Nearest authored width bucket for an engine half width (`size`, lane units = chart width / 4). */
export const nativeEffectWidthBucket = (size: number) => {
    const width = size * 4
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[0]) return 0
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[1]) return 1
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[2]) return 2
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[3]) return 3
    return 4
}

/** Resolve a semantic base effect ID to its width variant. */
export const nativeEffectVariant = (baseId: number, size: number) =>
    baseId + nativeEffectWidthBucket(size) * NATIVE_EFFECT_PLANE_COUNT

/** Lane coefficient of plane `plane` at stage height y. */
export const nativeEffectPlaneAlpha = (plane: number, y: number) => {
    if (plane === 1) return NATIVE_EFFECT_PLANES[1].alpha1 + NATIVE_EFFECT_PLANES[1].slope * (y - 1)
    if (plane === 2) return NATIVE_EFFECT_PLANES[2].alpha1 + NATIVE_EFFECT_PLANES[2].slope * (y - 1)
    if (plane === 3) return NATIVE_EFFECT_PLANES[3].alpha1 + NATIVE_EFFECT_PLANES[3].slope * (y - 1)
    return NATIVE_EFFECT_PLANES[0].alpha1 + NATIVE_EFFECT_PLANES[0].slope * (y - 1)
}

/** Spawn corners on the selected authored plane, in Sonolus stage units. */
export const nativeEffectPlaneQuad = (
    plane: number, lane: number, size: number, effectSize: number, wToH: number,
) => {
    const w = size * effectSize
    const b = 1
    const t = 1 - 2 * effectSize * wToH
    const bottom = nativeEffectPlaneAlpha(plane, b)
    const top = nativeEffectPlaneAlpha(plane, t)
    return {
        x1: (lane - w) * bottom, x2: (lane - w) * top,
        x3: (lane + w) * top, x4: (lane + w) * bottom,
        y1: b, y2: t, y3: t, y4: b,
    }
}

export const nativeLoopEffectDuration = (profile: number) =>
    profile === 2 ? NATIVE_PARTICLE_TIMINGS.loopParticles[2] : NATIVE_PARTICLE_TIMINGS.loopParticles[0]

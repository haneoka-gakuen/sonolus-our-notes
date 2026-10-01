// Hit effects are compiled per style/quality profile, chart width bucket,
// and plane layer. Every base effect owns one contiguous block of particle ids:
//   id = base.id + ((profile * WIDTH_COUNT + widthBucket) * PLANE_COUNT + plane)
// `defineParticle` assigns ids in declaration order, so the table below must
// keep that layout.

/** Seconds from the selected effect Animator clips (Perfect, Great, Good, Bad). */
export const NATIVE_PARTICLE_TIMINGS = {
    normal: [5 / 12, 5 / 12, 5 / 12, 5 / 12],
    slide: [7 / 12, 5 / 12, 5 / 12, 5 / 12],
    flick: [5 / 12, 1 / 2, 1 / 2, 7 / 12],
    simpleFlick: [3 / 4, 1 / 2, 1 / 2, 5 / 12],
    loopAnimation: 1 / 10,
    // Ten Animator cycles per Sonolus cycle. Particle tails can exceed one
    // Animator cycle; authoring one second preserves their real-time speed.
    loopParticle: 1,
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
export const NATIVE_EFFECT_PROFILE_QUALITIES = [2, 0, 2] as const
/** Unity skin folders used to author the native profiles. */
export const NATIVE_EFFECT_PROFILE_SKINS = ['effect001', 'effect001', 'effect001Simple'] as const
/** Chart widths with authored effects; must match NATIVE_EFFECT_WIDTHS. */
export const NATIVE_EFFECT_WIDTHS = [4, 6, 8, 12, 24] as const
/** Width thresholds used by nativeEffectWidthBucket. */
export const NATIVE_EFFECT_WIDTH_THRESHOLDS = [5, 7, 10, 18] as const
const PROFILE_COUNT = NATIVE_EFFECT_PROFILES.length
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

type NativeEffectKey = keyof typeof NATIVE_EFFECT_BASES

/** Public asset/compiler contract generated into contract/native-effects.json. */
export const NATIVE_EFFECT_CONTRACT = {
    schemaVersion: 1,
    engine: 'ourNotes',
    package: '@haneoka/sonolus-our-notes',
    targets: ['play', 'watch', 'preview', 'tutorial'],
    nativeEffects: {
        profiles: NATIVE_EFFECT_PROFILES,
        profileQualities: NATIVE_EFFECT_PROFILE_QUALITIES,
        profileSkins: NATIVE_EFFECT_PROFILE_SKINS,
        widths: NATIVE_EFFECT_WIDTHS,
        widthThresholds: NATIVE_EFFECT_WIDTH_THRESHOLDS,
        planes: NATIVE_EFFECT_PLANES.map((plane, index) => ({
            label: NATIVE_EFFECT_PLANE_LABELS[index]!,
            ...plane,
        })),
        baseNames: NATIVE_EFFECT_BASES,
        timings: NATIVE_PARTICLE_TIMINGS,
    },
} as const

/**
 * Particle effect table: each base key names its first (Light, width 4)
 * variant and is followed by the remaining variants of its block.
 */
export const nativeEffectTable = (): Record<NativeEffectKey, string> & Record<string, string> => {
    const table = {} as Record<NativeEffectKey, string> & Record<string, string>
    for (const [key, base] of Object.entries(NATIVE_EFFECT_BASES) as [NativeEffectKey, string][]) {
        NATIVE_EFFECT_PROFILES.forEach((profile, profileIndex) => {
            NATIVE_EFFECT_WIDTHS.forEach((width, widthIndex) => {
                NATIVE_EFFECT_PLANE_LABELS.forEach((plane, planeIndex) => {
                    const first = profileIndex === 0 && widthIndex === 0 && planeIndex === 0
                    const name = `${profile} ${base} W${width} ${plane}`
                    table[first ? key : `${key}_${profileIndex}_${widthIndex}_${planeIndex}`] = name
                })
            })
        })
    }
    return table
}

/** Nearest authored width bucket for an engine half width (`size`, lane units = chart width / 4). */
export const nativeEffectWidthBucket = (size: number) => {
    const width = size * 4
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[0]) return 0
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[1]) return 1
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[2]) return 2
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[3]) return 3
    return 4
}

/** Resolve a base effect id to its profile/width variant. */
export const nativeEffectVariant = (baseId: number, profile: number, size: number) =>
    baseId +
    (Math.max(0, Math.min(PROFILE_COUNT - 1, profile)) * WIDTH_COUNT + nativeEffectWidthBucket(size)) *
        NATIVE_EFFECT_PLANE_COUNT

/** Lane coefficient of plane `plane` at stage height y. */
export const nativeEffectPlaneAlpha = (plane: number, y: number) => {
    if (plane === 1) return NATIVE_EFFECT_PLANES[1].alpha1 + NATIVE_EFFECT_PLANES[1].slope * (y - 1)
    if (plane === 2) return NATIVE_EFFECT_PLANES[2].alpha1 + NATIVE_EFFECT_PLANES[2].slope * (y - 1)
    if (plane === 3) return NATIVE_EFFECT_PLANES[3].alpha1 + NATIVE_EFFECT_PLANES[3].slope * (y - 1)
    return NATIVE_EFFECT_PLANES[0].alpha1 + NATIVE_EFFECT_PLANES[0].slope * (y - 1)
}

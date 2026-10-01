import { EffectClipName } from '@sonolus/core'

// Names are shared by the engine declarations and the effect-pack generator.
// The selected effect resource supplies the Our Notes / Solid / Wood / Typing group.
export const nativeSoundClips = {
    stage: EffectClipName.Stage,
    normalPerfect: EffectClipName.Perfect,
    normalGreat: EffectClipName.Great,
    normalGood: EffectClipName.Good,
    just: 'Our Notes Just',
    flickPerfect: EffectClipName.PerfectAlternative,
    flickGreat: EffectClipName.GreatAlternative,
    flickGood: EffectClipName.GoodAlternative,
    flickSide: 'Our Notes Flick Side',
    normalHold: EffectClipName.Hold,
    holdSecondary: 'Our Notes Hold Layer 2',
    normalTick: 'Our Notes Tick',
    normalTrace: 'Our Notes Trace',
    criticalTap: EffectClipName.Perfect,
    criticalFlick: EffectClipName.PerfectAlternative,
    criticalHold: EffectClipName.Hold,
    criticalTick: 'Our Notes Tick',
    criticalTrace: 'Our Notes Trace',
} as const

export const nativeSoundGroups = [
    { id: 1, name: 'Our Notes', prefix: 'default', holdGains: [0.85 * 0.35, 0.75 * 0.35] },
    { id: 2, name: 'Solid', prefix: 'solid', holdGains: [0.45] },
    { id: 3, name: 'Wood', prefix: 'wood', holdGains: [0.35] },
    { id: 4, name: 'Typing', prefix: 'typing', holdGains: [0.35] },
] as const

// MasterLiveNoteSe type order; 9 and 10 share one MasterSound ID.
export const nativeSoundTypes = [
    'InVain', 'Good', 'Great', 'Perfect', 'Flick', 'FlickSide', 'Long',
    'Just', 'Trace', 'SlideConnect', 'GekiTap', 'GekiFlick', 'GekiFlickSide', 'GekiLong',
] as const

export const nativeSoundCueSuffixes = [
    'in_vain', 'good', 'great', 'perfect', 'flick', 'flick_side', 'long',
    'just_01', 'trace', 'trace', 'geki_tap', 'geki_flick', 'geki_flick_side', 'geki_long',
] as const

export const nativeSoundPackClips: readonly (readonly [string, number])[] = [
    [EffectClipName.Perfect, 4], [EffectClipName.Great, 3], [EffectClipName.Good, 2],
    [EffectClipName.Hold, 7], [EffectClipName.PerfectAlternative, 5],
    [EffectClipName.GreatAlternative, 3], [EffectClipName.GoodAlternative, 2],
    [EffectClipName.HoldAlternative, 7], [EffectClipName.Stage, 1],
    ['Our Notes Just', 8], ['Our Notes Tick', 9], ['Our Notes Trace', 9],
    ['Our Notes Critical Tap', 4], ['Our Notes Critical Trace', 9],
    ['Our Notes Critical Hold', 7], ['Our Notes Critical Flick', 5],
    ['Our Notes Critical Tick', 9], ['Our Notes Flick Side', 6],
]

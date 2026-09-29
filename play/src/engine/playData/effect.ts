import { EffectClipName } from '@sonolus/core'

export const effect = defineEffect({
    clips: {
        stage: EffectClipName.Stage,

        normalPerfect: EffectClipName.Perfect,
        normalGreat: EffectClipName.Great,
        normalGood: EffectClipName.Good,
        // LiveNoteSeType 8 (Just) has its own two-layer cue; the game never
        // plays the Perfect waveform for a Just.
        just: 'Our Notes Just',

        flickPerfect: EffectClipName.PerfectAlternative,
        flickGreat: EffectClipName.GreatAlternative,
        flickGood: EffectClipName.GoodAlternative,
        flickSide: 'Our Notes Flick Side',

        normalHold: EffectClipName.Hold,

        normalTick: 'Our Notes Tick',

        normalTrace: 'Our Notes Trace',

        // Critical is a timing flag in Our Notes, not a separate visual/audio
        // skin. Route each operation to its ordinary native-compatible clip.
        criticalTap: EffectClipName.Perfect,
        criticalFlick: EffectClipName.PerfectAlternative,
        criticalHold: EffectClipName.Hold,
        criticalTick: 'Our Notes Tick',
        criticalTrace: 'Our Notes Trace',
    },
})

export const sfxDistance = 0.02

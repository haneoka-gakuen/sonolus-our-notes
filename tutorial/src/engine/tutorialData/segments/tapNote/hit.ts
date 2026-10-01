import { nativeNoteEffectDuration } from '../../../../../../shared/src/engine/data/nativeEffects.js'
import { effect } from '../../effect.js'
import { playTutorialSound } from '../../sound.js'
import {
    particle,
    playLaneEffect,
    playNoteEffect,
} from '../../particle.js'

export const tapNoteHit = {
    enter() {
        playTutorialSound(effect.clips.normalPerfect)

        playNoteEffect(particle.effects.normalNote, nativeNoteEffectDuration(0, 1, 5))
        playLaneEffect(particle.effects.laneNormal)
    },
}

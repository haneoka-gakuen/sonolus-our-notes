import { nativeNoteEffectDuration } from '../../../../../../shared/src/engine/data/nativeEffects.js'
import { effect } from '../../effect.js'
import { playTutorialSound } from '../../sound.js'
import {
    particle,
    playLaneEffect,
    playNoteEffect,
} from '../../particle.js'

export const slideEndNoteHit = {
    enter() {
        playTutorialSound(effect.clips.normalPerfect)

        playNoteEffect(particle.effects.slideNote, nativeNoteEffectDuration(0, 22, 5))
        playLaneEffect(particle.effects.laneSlide)
    },
}

import { nativeNoteEffectDuration } from '../../../../../../shared/src/engine/data/nativeEffects.js'
import { effect } from '../../effect.js'
import { playTutorialSound } from '../../sound.js'
import {
    particle,
    playLaneEffect,
    playNoteEffect,
} from '../../particle.js'

export const slideEndFlickNoteHit = {
    enter() {
        playTutorialSound(effect.clips.flickPerfect)

        playNoteEffect(particle.effects.flickNote, nativeNoteEffectDuration(0, 40, 5))
        playLaneEffect(particle.effects.laneFlick)
    },
}

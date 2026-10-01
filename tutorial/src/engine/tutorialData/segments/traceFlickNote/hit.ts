import { nativeNoteEffectDuration } from '../../../../../../shared/src/engine/data/nativeEffects.js'
import { effect } from '../../effect.js'
import { playTutorialSound } from '../../sound.js'
import { particle, playNoteEffect } from '../../particle.js'

export const traceFlickNoteHit = {
    enter() {
        playTutorialSound(effect.clips.flickPerfect)

        playNoteEffect(particle.effects.connectNote, nativeNoteEffectDuration(0, 104, 5))
    },
}

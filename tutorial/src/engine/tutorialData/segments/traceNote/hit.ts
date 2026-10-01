import { nativeNoteEffectDuration } from '../../../../../../shared/src/engine/data/nativeEffects.js'
import { effect } from '../../effect.js'
import { playTutorialSound } from '../../sound.js'
import { particle, playNoteEffect } from '../../particle.js'

export const traceNoteHit = {
    enter() {
        if (effect.clips.normalTrace.exists) {
            playTutorialSound(effect.clips.normalTrace)
        } else {
            playTutorialSound(effect.clips.normalPerfect)
        }

        playNoteEffect(particle.effects.connectNote, nativeNoteEffectDuration(0, 60, 5))
    },
}

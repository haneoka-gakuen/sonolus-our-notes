import { connector } from '../../components/connector.js'
import { slide } from '../../components/slide.js'
import { effect } from '../../effect.js'
import { drawHand } from '../../instruction.js'
import {
    particle,
    playLaneEffect,
    playNoteEffect,
    destroyHoldEffect, spawnHoldEffect,
} from '../../particle.js'

let sfxInstanceId = tutorialMemory(LoopedEffectClipInstanceId)
const effectInstanceIds = tutorialMemory({
    p0: ParticleEffectInstanceId,
    p1: ParticleEffectInstanceId,
    p2: ParticleEffectInstanceId,
    p3: ParticleEffectInstanceId,
})

export const slideStartNoteHit = {
    enter() {
        slide.show()
        connector.showActive()

        effect.clips.normalPerfect.play(0)

        playNoteEffect(particle.effects.slideNote, 7 / 12)
        playLaneEffect(particle.effects.laneSlide)

        sfxInstanceId = effect.clips.normalHold.loop()
        {
        const ids = spawnHoldEffect()
        effectInstanceIds.p0 = ids.p0
        effectInstanceIds.p1 = ids.p1
        effectInstanceIds.p2 = ids.p2
        effectInstanceIds.p3 = ids.p3
    }
    },

    update() {
        drawHand(Math.PI / 3, 0, 1)
    },

    exit() {
        slide.clear()
        connector.clear()

        effect.clips.stopLoop(sfxInstanceId)
        destroyHoldEffect(effectInstanceIds)
    },
}

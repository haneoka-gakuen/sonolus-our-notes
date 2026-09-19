import { nativeLaneEffectLifetime } from '../../../../shared/src/engine/data/lane.js'
import { scaledScreen } from './scaledScreen.js'

export const particle = defineParticle({
    effects: {
        laneNormal: 'Our Notes Lane Normal',
        laneSlide: 'Our Notes Lane Slide',
        laneFlick: 'Our Notes Lane Flick',

        normalNote: 'Our Notes Native Normal',
        slideNote: 'Our Notes Native Slide',
        flickNote: 'Our Notes Native Flick',
        connectNote: 'Our Notes Native Connect',
        slideLoop: 'Our Notes Native Slide Loop',
        bakedWidth4_0: 'Our Notes Native Normal Width 4',
        bakedWidth10_0: 'Our Notes Native Normal Width 10',
        bakedWidth4_1: 'Our Notes Native Slide Width 4',
        bakedWidth10_1: 'Our Notes Native Slide Width 10',
        bakedWidth4_2: 'Our Notes Native Flick Width 4',
        bakedWidth10_2: 'Our Notes Native Flick Width 10',
        bakedWidth4_3: 'Our Notes Native Connect Width 4',
        bakedWidth10_3: 'Our Notes Native Connect Width 10',
        bakedWidth4_4: 'Our Notes Native Slide Loop Width 4',
        bakedWidth10_4: 'Our Notes Native Slide Loop Width 10',
    },
})

const noteEffectLayout = () => {
    const l = -2
    const r = 2

    const b = 1
    const t = 1 - 2 * scaledScreen.wToH

    return new Rect({ l, r, b, t })
}

export const playNoteEffect = (effect: ParticleEffect, duration: number) =>
    particle.effects.spawn(sizedEffectId(effect.id, 2), noteEffectLayout(), duration, false)

export const playLaneEffect = (effect: ParticleEffect) =>
    effect.spawn(
        noteEffectLayout(),
        nativeLaneEffectLifetime,
        false,
    )

export const spawnHoldEffect = () =>
    particle.effects.spawn(sizedEffectId(particle.effects.slideLoop.id, 2), noteEffectLayout(), 1, true)

/** Select an authored width capture instead of stretching every star across a wide note. */
export const sizedEffectId = (id: ParticleEffect['id'], size: number) => {
    if (id === particle.effects.normalNote.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_0.exists) return particle.effects.bakedWidth4_0.id
        if (size >= 2 && particle.effects.bakedWidth10_0.exists) return particle.effects.bakedWidth10_0.id
        return id
    }
    if (id === particle.effects.slideNote.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_1.exists) return particle.effects.bakedWidth4_1.id
        if (size >= 2 && particle.effects.bakedWidth10_1.exists) return particle.effects.bakedWidth10_1.id
        return id
    }
    if (id === particle.effects.flickNote.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_2.exists) return particle.effects.bakedWidth4_2.id
        if (size >= 2 && particle.effects.bakedWidth10_2.exists) return particle.effects.bakedWidth10_2.id
        return id
    }
    if (id === particle.effects.connectNote.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_3.exists) return particle.effects.bakedWidth4_3.id
        if (size >= 2 && particle.effects.bakedWidth10_3.exists) return particle.effects.bakedWidth10_3.id
        return id
    }
    if (id === particle.effects.slideLoop.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_4.exists) return particle.effects.bakedWidth4_4.id
        if (size >= 2 && particle.effects.bakedWidth10_4.exists) return particle.effects.bakedWidth10_4.id
        return id
    }
    return id
}

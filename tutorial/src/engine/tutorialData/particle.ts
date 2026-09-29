import { nativeLaneEffectLifetime } from '../../../../shared/src/engine/data/lane.js'
import { scaledScreen } from './scaledScreen.js'

// The tutorial lane spans -2..2 (chart width 8) and uses the default Light profile.
export const particle = defineParticle({
    effects: {
        laneNormal: 'Our Notes Lane Normal',
        laneSlide: 'Our Notes Lane Slide',
        laneFlick: 'Our Notes Lane Flick',

        normalNote: 'Our Notes Light Normal W8 P0',
        normalNote_P1: 'Our Notes Light Normal W8 P1',
        normalNote_P2: 'Our Notes Light Normal W8 P2',
        normalNote_P3: 'Our Notes Light Normal W8 P3',
        slideNote: 'Our Notes Light Slide W8 P0',
        slideNote_P1: 'Our Notes Light Slide W8 P1',
        slideNote_P2: 'Our Notes Light Slide W8 P2',
        slideNote_P3: 'Our Notes Light Slide W8 P3',
        flickNote: 'Our Notes Light Flick W8 P0',
        flickNote_P1: 'Our Notes Light Flick W8 P1',
        flickNote_P2: 'Our Notes Light Flick W8 P2',
        flickNote_P3: 'Our Notes Light Flick W8 P3',
        connectNote: 'Our Notes Light Connect W8 P0',
        connectNote_P1: 'Our Notes Light Connect W8 P1',
        connectNote_P2: 'Our Notes Light Connect W8 P2',
        connectNote_P3: 'Our Notes Light Connect W8 P3',
        slideLoop: 'Our Notes Light Slide Loop W8 P0',
        slideLoop_P1: 'Our Notes Light Slide Loop W8 P1',
        slideLoop_P2: 'Our Notes Light Slide Loop W8 P2',
        slideLoop_P3: 'Our Notes Light Slide Loop W8 P3',
    },
})

const noteEffectLayout = () => {
    const l = -2
    const r = 2

    const b = 1
    const t = 1 - 2 * scaledScreen.wToH

    return new Rect({ l, r, b, t })
}

/** The lane is centred, so every plane layer (P0..P3, consecutive ids) shares one rect. */
export const playNoteEffect = (effect: ParticleEffect, duration: number) => {
    for (let plane = 0; plane < 4; plane++)
        particle.effects.spawn(
            ((effect.id as unknown as number) + plane) as unknown as ParticleEffectId,
            noteEffectLayout(),
            duration,
            false,
        )
}

export const playLaneEffect = (effect: ParticleEffect) =>
    effect.spawn(
        noteEffectLayout(),
        nativeLaneEffectLifetime,
        false,
    )

/** Hold loop: all four plane layers (consecutive ids) on the centred rect. */
export const spawnHoldEffect = (): HoldEffectInstances => {
    const id = particle.effects.slideLoop.id as unknown as number
    const layout = noteEffectLayout()
    return {
        p0: particle.effects.spawn(id as unknown as ParticleEffectId, layout, 1, true),
        p1: particle.effects.spawn((id + 1) as unknown as ParticleEffectId, layout, 1, true),
        p2: particle.effects.spawn((id + 2) as unknown as ParticleEffectId, layout, 1, true),
        p3: particle.effects.spawn((id + 3) as unknown as ParticleEffectId, layout, 1, true),
    }
}

export type HoldEffectInstances = {
    p0: ParticleEffectInstanceId
    p1: ParticleEffectInstanceId
    p2: ParticleEffectInstanceId
    p3: ParticleEffectInstanceId
}

export const destroyHoldEffect = (instances: HoldEffectInstances) => {
    particle.effects.destroy(instances.p0)
    particle.effects.destroy(instances.p1)
    particle.effects.destroy(instances.p2)
    particle.effects.destroy(instances.p3)
}


import { nativeEffectSkew } from '../../../../shared/src/engine/data/lane.js'
import { options } from '../configuration/options.js'
import {
    NATIVE_EFFECT_PLANE_COUNT,
    nativeEffectPlaneAlpha,
    nativeEffectTable,
    nativeEffectVariant,
} from '../../../../shared/src/engine/data/nativeEffects.js'
import { scaledScreen } from './scaledScreen.js'

// Legacy PJS slots are still probed through `.exists` guards. They name no
// authored effect, so the guards keep them from spawning anything.
const unused = 'Our Notes Unused'

export const particle = defineParticle({
    effects: {
        laneInVain: 'Our Notes Lane In Vain',
        laneNormal: 'Our Notes Lane Normal',
        laneSlide: 'Our Notes Lane Slide',
        laneFlick: 'Our Notes Lane Flick',
        laneFlickLeft: 'Our Notes Lane Flick Left',
        laneFlickRight: 'Our Notes Lane Flick Right',

        // Base slot + profile/width variants; resolve with sizedEffectId.
        ...nativeEffectTable(),

        // Our Notes Critical changes judgment windows only; it has no
        // separate visual. These resolve to the ordinary variants' blocks.
        normalNoteLinear: unused,
        slideNoteLinear: unused,
        flickNoteLinear: unused,
        flickNoteDirectional: unused,
        criticalNoteCircular: unused,
        criticalNoteLinear: unused,
        normalTraceNoteLinear: unused,
        criticalTraceNoteCircular: unused,
        criticalTraceNoteLinear: unused,
        normalSlideTickNote: unused,
        criticalSlideTickNote: unused,
        normalSlideConnectorLinear: unused,
        criticalSlideConnectorCircular: unused,
        criticalSlideConnectorLinear: unused,
        flickLeftSparks: unused,
        flickRightSparks: unused,
    },
})

/**
 * Selected profile/width variant of a base effect. Critical and slide-tick
 * aliases map onto their ordinary block (no separate authored visual).
 */
export const sizedEffectId = (baseId: ParticleEffectId, size: number): ParticleEffectId => {
    let id: number = baseId as unknown as number
    const { effects } = particle
    if (baseId === effects.criticalNoteCircular.id) id = effects.normalNoteCircular.id as unknown as number
    if (baseId === effects.criticalTraceNoteCircular.id) id = effects.normalTraceNoteCircular.id as unknown as number
    if (baseId === effects.normalSlideTickNote.id) id = effects.normalTraceNoteCircular.id as unknown as number
    if (baseId === effects.criticalSlideTickNote.id) id = effects.normalTraceNoteCircular.id as unknown as number
    if (baseId === effects.criticalSlideConnectorCircular.id)
        id = effects.normalSlideConnectorCircular.id as unknown as number
    return nativeEffectVariant(id, options.noteEffectProfile, size) as unknown as ParticleEffectId
}

export const linearEffectLayout = ({
    lane,
    size,
    shear,
}: {
    lane: number
    size: number
    shear: number
}) => {
    // LiveGameNoteEffectBase.SetWidth scales the effect root horizontally by
    // the authored note width instead of using one fixed-width particle quad.
    const w = size * options.noteEffectSize
    const h = options.noteEffectSize * scaledScreen.wToH
    const p = 1 + 2 * h * nativeEffectSkew

    const b = 1
    const t = 1 - 2 * h

    shear *= size * options.noteEffectSize

    return {
        x1: lane - w,
        x2: lane * p - w + shear,
        x3: lane * p + w + shear,
        x4: lane + w,
        y1: b,
        y2: t,
        y3: t,
        y4: b,
    }
}

/** Baked ground-plane light; lane-centre perspective contracts toward the horizon. */
export const groundEffectLayout = ({ lane, size }: { lane: number; size: number }) => {
    const h = scaledScreen.wToH
    const top = 1 - 2 * h
    return { x1: lane - size, x2: lane * top - size,
        x3: lane * top + size, x4: lane + size,
        y1: 1, y2: top, y3: top, y4: 1 }
}

/**
 * Spawn quad of plane layer `plane`: the linearEffectLayout rect in that
 * plane's perspective.
 */
export const nativeEffectPlaneLayout = ({ plane, lane, size }: { plane: number; lane: number; size: number }) => {
    const w = size * options.noteEffectSize
    const h = options.noteEffectSize * scaledScreen.wToH
    const b = 1
    const t = 1 - 2 * h
    // Rectified plane: lane offset and the effect's own width both scale by
    // the plane's perspective alpha(y), so flat faces stay exact rectangles.
    const bottom = nativeEffectPlaneAlpha(plane, b)
    const top = nativeEffectPlaneAlpha(plane, t)
    return {
        x1: (lane - w) * bottom,
        x2: (lane - w) * top,
        x3: (lane + w) * top,
        x4: (lane + w) * bottom,
        y1: b,
        y2: t,
        y3: t,
        y4: b,
    }
}

/** Spawn every plane layer of a native hit effect (a sizedEffectId). */
export const spawnNativeEffect = (variantId: ParticleEffectId, lane: number, size: number, duration: number) => {
    for (let plane = 0; plane < NATIVE_EFFECT_PLANE_COUNT; plane++) {
        particle.effects.spawn(
            ((variantId as unknown as number) + plane) as unknown as ParticleEffectId,
            nativeEffectPlaneLayout({ plane, lane, size }),
            duration,
            false,
        )
    }
}

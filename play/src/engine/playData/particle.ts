import { nativeEffectSkew } from '../../../../shared/src/engine/data/lane.js'
import { options } from '../configuration/options.js'
import { scaledScreen } from './scaledScreen.js'

// The single baked hit animation already contains the wall and billboards.
// Secondary legacy effect slots stay absent to avoid rendering them twice.
const unsupportedUnityMesh = 'Our Notes Unsupported Unity Wall Mesh'

export const particle = defineParticle({
    effects: {
        laneInVain: 'Our Notes Lane In Vain',
        laneNormal: 'Our Notes Lane Normal',
        laneSlide: 'Our Notes Lane Slide',
        laneFlick: 'Our Notes Lane Flick',
        laneFlickLeft: 'Our Notes Lane Flick Left',
        laneFlickRight: 'Our Notes Lane Flick Right',

        normalNoteCircular: 'Our Notes Native Normal',
        normalNoteGreat: 'Our Notes Native Normal Great',
        normalNoteGood: 'Our Notes Native Normal Good',
        normalNoteBad: 'Our Notes Native Normal Bad',
        normalNoteLinear: unsupportedUnityMesh,

        slideNoteCircular: 'Our Notes Native Slide',
        slideNoteGreat: 'Our Notes Native Slide Great',
        slideNoteGood: 'Our Notes Native Slide Good',
        slideNoteBad: 'Our Notes Native Slide Bad',
        slideNoteLinear: unsupportedUnityMesh,

        flickNoteCircular: 'Our Notes Native Flick',
        flickNoteGreat: 'Our Notes Native Flick Great',
        flickNoteGood: 'Our Notes Native Flick Good',
        flickNoteBad: 'Our Notes Native Flick Bad',
        flickNoteLinear: unsupportedUnityMesh,
        flickNoteDirectional: unsupportedUnityMesh,
        flickLeftWall: 'Our Notes Native Flick Left',
        flickLeftGreat: 'Our Notes Native Flick Left Great',
        flickLeftGood: 'Our Notes Native Flick Left Good',
        flickLeftBad: 'Our Notes Native Flick Left Bad',
        flickLeftSparks: unsupportedUnityMesh,
        flickLeftDirectional: unsupportedUnityMesh,
        flickRightWall: 'Our Notes Native Flick Right',
        flickRightGreat: 'Our Notes Native Flick Right Great',
        flickRightGood: 'Our Notes Native Flick Right Good',
        flickRightBad: 'Our Notes Native Flick Right Bad',
        flickRightSparks: unsupportedUnityMesh,
        flickRightDirectional: unsupportedUnityMesh,

        // Our Notes Critical changes selected judgment windows; it has no
        // PJS-style yellow visual/effect unit. Keep these aliases ordinary.
        criticalNoteCircular: 'Our Notes Native Normal',
        criticalNoteLinear: unsupportedUnityMesh,
        criticalNoteDirectional: unsupportedUnityMesh,

        normalTraceNoteCircular: 'Our Notes Native Connect',
        normalTraceNoteGreat: 'Our Notes Native Connect Great',
        normalTraceNoteGood: 'Our Notes Native Connect Good',
        normalTraceNoteBad: 'Our Notes Native Connect Bad',
        normalTraceNoteLinear: unsupportedUnityMesh,

        criticalTraceNoteCircular: 'Our Notes Native Connect',
        criticalTraceNoteLinear: unsupportedUnityMesh,

        normalSlideTickNote: 'Our Notes Native Connect',

        criticalSlideTickNote: 'Our Notes Native Connect',

        normalSlideConnectorCircular: 'Our Notes Native Slide Loop',
        normalSlideConnectorLinear: unsupportedUnityMesh,

        criticalSlideConnectorCircular: 'Our Notes Native Slide Loop',
        criticalSlideConnectorLinear: unsupportedUnityMesh,
        bakedWidth4_0: 'Our Notes Native Normal Width 4',
        bakedWidth10_0: 'Our Notes Native Normal Width 10',
        bakedWidth4_1: 'Our Notes Native Normal Great Width 4',
        bakedWidth10_1: 'Our Notes Native Normal Great Width 10',
        bakedWidth4_2: 'Our Notes Native Normal Good Width 4',
        bakedWidth10_2: 'Our Notes Native Normal Good Width 10',
        bakedWidth4_3: 'Our Notes Native Normal Bad Width 4',
        bakedWidth10_3: 'Our Notes Native Normal Bad Width 10',
        bakedWidth4_4: 'Our Notes Native Slide Width 4',
        bakedWidth10_4: 'Our Notes Native Slide Width 10',
        bakedWidth4_5: 'Our Notes Native Slide Great Width 4',
        bakedWidth10_5: 'Our Notes Native Slide Great Width 10',
        bakedWidth4_6: 'Our Notes Native Slide Good Width 4',
        bakedWidth10_6: 'Our Notes Native Slide Good Width 10',
        bakedWidth4_7: 'Our Notes Native Slide Bad Width 4',
        bakedWidth10_7: 'Our Notes Native Slide Bad Width 10',
        bakedWidth4_8: 'Our Notes Native Flick Width 4',
        bakedWidth10_8: 'Our Notes Native Flick Width 10',
        bakedWidth4_9: 'Our Notes Native Flick Great Width 4',
        bakedWidth10_9: 'Our Notes Native Flick Great Width 10',
        bakedWidth4_10: 'Our Notes Native Flick Good Width 4',
        bakedWidth10_10: 'Our Notes Native Flick Good Width 10',
        bakedWidth4_11: 'Our Notes Native Flick Bad Width 4',
        bakedWidth10_11: 'Our Notes Native Flick Bad Width 10',
        bakedWidth4_12: 'Our Notes Native Flick Left Width 4',
        bakedWidth10_12: 'Our Notes Native Flick Left Width 10',
        bakedWidth4_13: 'Our Notes Native Flick Left Great Width 4',
        bakedWidth10_13: 'Our Notes Native Flick Left Great Width 10',
        bakedWidth4_14: 'Our Notes Native Flick Left Good Width 4',
        bakedWidth10_14: 'Our Notes Native Flick Left Good Width 10',
        bakedWidth4_15: 'Our Notes Native Flick Left Bad Width 4',
        bakedWidth10_15: 'Our Notes Native Flick Left Bad Width 10',
        bakedWidth4_16: 'Our Notes Native Flick Right Width 4',
        bakedWidth10_16: 'Our Notes Native Flick Right Width 10',
        bakedWidth4_17: 'Our Notes Native Flick Right Great Width 4',
        bakedWidth10_17: 'Our Notes Native Flick Right Great Width 10',
        bakedWidth4_18: 'Our Notes Native Flick Right Good Width 4',
        bakedWidth10_18: 'Our Notes Native Flick Right Good Width 10',
        bakedWidth4_19: 'Our Notes Native Flick Right Bad Width 4',
        bakedWidth10_19: 'Our Notes Native Flick Right Bad Width 10',
        bakedWidth4_20: 'Our Notes Native Connect Width 4',
        bakedWidth10_20: 'Our Notes Native Connect Width 10',
        bakedWidth4_21: 'Our Notes Native Connect Great Width 4',
        bakedWidth10_21: 'Our Notes Native Connect Great Width 10',
        bakedWidth4_22: 'Our Notes Native Connect Good Width 4',
        bakedWidth10_22: 'Our Notes Native Connect Good Width 10',
        bakedWidth4_23: 'Our Notes Native Connect Bad Width 4',
        bakedWidth10_23: 'Our Notes Native Connect Bad Width 10',
        bakedWidth4_24: 'Our Notes Native Slide Loop Width 4',
        bakedWidth10_24: 'Our Notes Native Slide Loop Width 10',
    },
})

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

/** Select an authored width capture instead of stretching every star across a wide note. */
export const sizedEffectId = (id: ParticleEffect['id'], size: number) => {
    if (id === particle.effects.normalNoteCircular.id || id === particle.effects.criticalNoteCircular.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_0.exists) return particle.effects.bakedWidth4_0.id
        if (size >= 2 && particle.effects.bakedWidth10_0.exists) return particle.effects.bakedWidth10_0.id
        return id
    }
    if (id === particle.effects.normalNoteGreat.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_1.exists) return particle.effects.bakedWidth4_1.id
        if (size >= 2 && particle.effects.bakedWidth10_1.exists) return particle.effects.bakedWidth10_1.id
        return id
    }
    if (id === particle.effects.normalNoteGood.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_2.exists) return particle.effects.bakedWidth4_2.id
        if (size >= 2 && particle.effects.bakedWidth10_2.exists) return particle.effects.bakedWidth10_2.id
        return id
    }
    if (id === particle.effects.normalNoteBad.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_3.exists) return particle.effects.bakedWidth4_3.id
        if (size >= 2 && particle.effects.bakedWidth10_3.exists) return particle.effects.bakedWidth10_3.id
        return id
    }
    if (id === particle.effects.slideNoteCircular.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_4.exists) return particle.effects.bakedWidth4_4.id
        if (size >= 2 && particle.effects.bakedWidth10_4.exists) return particle.effects.bakedWidth10_4.id
        return id
    }
    if (id === particle.effects.slideNoteGreat.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_5.exists) return particle.effects.bakedWidth4_5.id
        if (size >= 2 && particle.effects.bakedWidth10_5.exists) return particle.effects.bakedWidth10_5.id
        return id
    }
    if (id === particle.effects.slideNoteGood.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_6.exists) return particle.effects.bakedWidth4_6.id
        if (size >= 2 && particle.effects.bakedWidth10_6.exists) return particle.effects.bakedWidth10_6.id
        return id
    }
    if (id === particle.effects.slideNoteBad.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_7.exists) return particle.effects.bakedWidth4_7.id
        if (size >= 2 && particle.effects.bakedWidth10_7.exists) return particle.effects.bakedWidth10_7.id
        return id
    }
    if (id === particle.effects.flickNoteCircular.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_8.exists) return particle.effects.bakedWidth4_8.id
        if (size >= 2 && particle.effects.bakedWidth10_8.exists) return particle.effects.bakedWidth10_8.id
        return id
    }
    if (id === particle.effects.flickNoteGreat.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_9.exists) return particle.effects.bakedWidth4_9.id
        if (size >= 2 && particle.effects.bakedWidth10_9.exists) return particle.effects.bakedWidth10_9.id
        return id
    }
    if (id === particle.effects.flickNoteGood.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_10.exists) return particle.effects.bakedWidth4_10.id
        if (size >= 2 && particle.effects.bakedWidth10_10.exists) return particle.effects.bakedWidth10_10.id
        return id
    }
    if (id === particle.effects.flickNoteBad.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_11.exists) return particle.effects.bakedWidth4_11.id
        if (size >= 2 && particle.effects.bakedWidth10_11.exists) return particle.effects.bakedWidth10_11.id
        return id
    }
    if (id === particle.effects.flickLeftWall.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_12.exists) return particle.effects.bakedWidth4_12.id
        if (size >= 2 && particle.effects.bakedWidth10_12.exists) return particle.effects.bakedWidth10_12.id
        return id
    }
    if (id === particle.effects.flickLeftGreat.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_13.exists) return particle.effects.bakedWidth4_13.id
        if (size >= 2 && particle.effects.bakedWidth10_13.exists) return particle.effects.bakedWidth10_13.id
        return id
    }
    if (id === particle.effects.flickLeftGood.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_14.exists) return particle.effects.bakedWidth4_14.id
        if (size >= 2 && particle.effects.bakedWidth10_14.exists) return particle.effects.bakedWidth10_14.id
        return id
    }
    if (id === particle.effects.flickLeftBad.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_15.exists) return particle.effects.bakedWidth4_15.id
        if (size >= 2 && particle.effects.bakedWidth10_15.exists) return particle.effects.bakedWidth10_15.id
        return id
    }
    if (id === particle.effects.flickRightWall.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_16.exists) return particle.effects.bakedWidth4_16.id
        if (size >= 2 && particle.effects.bakedWidth10_16.exists) return particle.effects.bakedWidth10_16.id
        return id
    }
    if (id === particle.effects.flickRightGreat.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_17.exists) return particle.effects.bakedWidth4_17.id
        if (size >= 2 && particle.effects.bakedWidth10_17.exists) return particle.effects.bakedWidth10_17.id
        return id
    }
    if (id === particle.effects.flickRightGood.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_18.exists) return particle.effects.bakedWidth4_18.id
        if (size >= 2 && particle.effects.bakedWidth10_18.exists) return particle.effects.bakedWidth10_18.id
        return id
    }
    if (id === particle.effects.flickRightBad.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_19.exists) return particle.effects.bakedWidth4_19.id
        if (size >= 2 && particle.effects.bakedWidth10_19.exists) return particle.effects.bakedWidth10_19.id
        return id
    }
    if (id === particle.effects.normalTraceNoteCircular.id || id === particle.effects.criticalTraceNoteCircular.id || id === particle.effects.normalSlideTickNote.id || id === particle.effects.criticalSlideTickNote.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_20.exists) return particle.effects.bakedWidth4_20.id
        if (size >= 2 && particle.effects.bakedWidth10_20.exists) return particle.effects.bakedWidth10_20.id
        return id
    }
    if (id === particle.effects.normalTraceNoteGreat.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_21.exists) return particle.effects.bakedWidth4_21.id
        if (size >= 2 && particle.effects.bakedWidth10_21.exists) return particle.effects.bakedWidth10_21.id
        return id
    }
    if (id === particle.effects.normalTraceNoteGood.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_22.exists) return particle.effects.bakedWidth4_22.id
        if (size >= 2 && particle.effects.bakedWidth10_22.exists) return particle.effects.bakedWidth10_22.id
        return id
    }
    if (id === particle.effects.normalTraceNoteBad.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_23.exists) return particle.effects.bakedWidth4_23.id
        if (size >= 2 && particle.effects.bakedWidth10_23.exists) return particle.effects.bakedWidth10_23.id
        return id
    }
    if (id === particle.effects.normalSlideConnectorCircular.id || id === particle.effects.criticalSlideConnectorCircular.id) {
        if (size <= 1.25 && particle.effects.bakedWidth4_24.exists) return particle.effects.bakedWidth4_24.id
        if (size >= 2 && particle.effects.bakedWidth10_24.exists) return particle.effects.bakedWidth10_24.id
        return id
    }
    return id
}

import { fxSpawnQuad, fxWorldWidth } from '../../../../shared/src/engine/data/nativeHitFx.js'
import {
    LOOP_FX_COUNT,
    LOOP_FX_DURATION,
    LOOP_FX_FIRST,
    hitFxBucket,
    hitFxCount,
    hitFxDuration,
    hitFxFirst,
} from '../../../../shared/src/engine/data/nativeHitFxNames.generated.js'
import { particle } from './particle.js'

/** Hit-effect parts are declared consecutively from fx0, in blocks per effect, judgement and width bucket. */
const fxId = (offset: number) => ((particle.effects.fx0.id as unknown as number) + offset) as unknown as ParticleEffectId

/** Kinds: 0 normal, 1 just, 2 slide, 3 connect, 4/5/6 flick up/left/right. Judgement: native 2 Bad .. 6 Just. */
export const spawnHitFx = (kind: number, judgment: number, lane: number, size: number) => {
    const first = hitFxFirst(kind, judgment)
    if (first < 0) return
    const count = hitFxCount(kind, judgment)
    const duration = hitFxDuration(kind, judgment)
    const base = first + hitFxBucket(fxWorldWidth(size)) * count
    const quad = fxSpawnQuad(lane, size)
    for (let i = 0; i < count; i++) particle.effects.spawn(fxId(base + i), quad, duration, false)
}

export const LOOP_FX_PARTS = LOOP_FX_COUNT

export const spawnLoopFx = (index: number, lane: number, size: number) =>
    particle.effects.spawn(
        fxId(LOOP_FX_FIRST + hitFxBucket(fxWorldWidth(size)) * LOOP_FX_COUNT + index),
        fxSpawnQuad(lane, size),
        LOOP_FX_DURATION,
        true,
    )

export const moveLoopFx = (instance: ParticleEffectInstanceId, lane: number, size: number) => {
    particle.effects.move(instance, fxSpawnQuad(lane, size))
}

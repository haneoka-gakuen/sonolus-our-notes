import { NATIVE_EFFECT_WIDTH_THRESHOLDS } from './nativeEffects.js'

// Interpolating the two moving edges separately can put an exactly authored
// width just below its threshold, repeatedly restarting the particle loop.
// This tolerance is in chart-width units; it does not change the drawn bounds.
export const HOLD_EFFECT_WIDTH_EPSILON = 1e-9

export const stableHoldEffectWidthBucket = (size: number) => {
    const width = size * 4
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[0] - HOLD_EFFECT_WIDTH_EPSILON) return 0
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[1] - HOLD_EFFECT_WIDTH_EPSILON) return 1
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[2] - HOLD_EFFECT_WIDTH_EPSILON) return 2
    if (width < NATIVE_EFFECT_WIDTH_THRESHOLDS[3] - HOLD_EFFECT_WIDTH_EPSILON) return 3
    return 4
}

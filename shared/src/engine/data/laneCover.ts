import { horizonY, judgmentY } from './lane.js'

/**
 * Our Notes "Notes Start Position" (ノーツ開始位置, OptionItemType NoteStartPosition,
 * default 0). LiveLaneView.UpdateMaskSizeAndPosition sizes a screen-space
 * SpriteMask from the top of the 1920x1080 canvas down by
 * `(1080 - 224) * ratio` px (16:9; 224 px is the judgment root above the
 * bottom edge); notes are drawn only outside the mask.
 *
 * Notes move along `approach()`: the perspective scale at time-to-hit `d` is
 * `1.065 ** (-45 * d / duration)`. The mask bottom therefore maps to a fixed
 * fraction of the approach duration, so the cover is a cheap time clip with
 * no per-sprite masking: an object is visible once `target - now` is at most
 * `duration * laneCoverVisibleFraction(ratio)`.
 */
export const laneCoverVisibleFraction = (ratio: number) => {
    if (ratio <= 0) return 1
    const cutoffY = 1 - ratio * (2 - 224 / 540)
    const scale = (horizonY - cutoffY) / (horizonY - judgmentY)
    return Math.clamp(-Math.log(scale) / (45 * Math.log(1.065)), 0, 1)
}

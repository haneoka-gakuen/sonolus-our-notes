import { note as _note } from '../../../../shared/src/engine/data/note.js'
import { laneCoverVisibleFraction } from '../../../../shared/src/engine/data/laneCover.js'
import { options } from '../configuration/options.js'

export const note = {
    ..._note,

    get duration() {
        return Math.lerp(0.35, 4, Math.unlerpClamped(12, 1, options.noteSpeed) ** 1.30999994)
    },

    /** Approach time left visible below the lane cover (Notes Start Position). */
    get coverDuration(): number {
        return this.duration * laneCoverVisibleFraction(options.laneCover)
    },

    /** True while an object reaching the judgment line at `targetScaledTime` is under the lane cover. */
    isCovered(targetScaledTime: number): boolean {
        return options.laneCover > 0 && time.scaled < targetScaledTime - this.coverDuration
    },
}

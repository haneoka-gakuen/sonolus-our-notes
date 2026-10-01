import { nativeSoundClips } from '../../../../shared/src/engine/data/nativeSound.js'

export const effect = defineEffect({ clips: nativeSoundClips })
export const sfxDistance = 0.02

// The caller unions active replay intervals before scheduling this cue.
export function scheduleHeldSound(start: number, end: number) {
    if (end <= start || !effect.clips.normalHold.exists) return
    const primary = effect.clips.normalHold.scheduleLoop(start)
    effect.clips.scheduleStopLoop(primary, end)
    if (effect.clips.holdSecondary.exists) {
        const secondary = effect.clips.holdSecondary.scheduleLoop(start)
        effect.clips.scheduleStopLoop(secondary, end)
    }
}

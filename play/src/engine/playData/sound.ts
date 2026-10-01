import { nativeSoundClips } from '../../../../shared/src/engine/data/nativeSound.js'

export const effect = defineEffect({ clips: nativeSoundClips })
export const sfxDistance = 0.02

// One global native long-line cue, even when several connectors are held.
export interface HeldSoundState {
    holdInstanceId: LoopedEffectClipInstanceId
    holdSecondaryInstanceId: LoopedEffectClipInstanceId
}

export function stopHeldSound(state: HeldSoundState) {
    if (state.holdSecondaryInstanceId) {
        effect.clips.stopLoop(state.holdSecondaryInstanceId)
        state.holdSecondaryInstanceId = 0
    }
    if (state.holdInstanceId) {
        effect.clips.stopLoop(state.holdInstanceId)
        state.holdInstanceId = 0
    }
}

export function updateHeldSound(state: HeldSoundState, active: boolean, enabled: boolean) {
    if (!enabled || !active || !effect.clips.normalHold.exists) {
        stopHeldSound(state)
        return
    }
    if (state.holdInstanceId) return
    state.holdInstanceId = effect.clips.normalHold.loop()
    if (effect.clips.holdSecondary.exists)
        state.holdSecondaryInstanceId = effect.clips.holdSecondary.loop()
}

export function scheduleHeldSound(start: number, end: number) {
    if (end <= start || !effect.clips.normalHold.exists) return
    const primary = effect.clips.normalHold.scheduleLoop(start)
    effect.clips.scheduleStopLoop(primary, end)
    if (effect.clips.holdSecondary.exists) {
        const secondary = effect.clips.holdSecondary.scheduleLoop(start)
        effect.clips.scheduleStopLoop(secondary, end)
    }
}

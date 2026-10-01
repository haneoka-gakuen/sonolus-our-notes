import { nativeSoundClips } from '../../../../shared/src/engine/data/nativeSound.js'

export const effect = defineEffect({ clips: nativeSoundClips })

const held = tutorialMemory({
    primary: LoopedEffectClipInstanceId,
    secondary: LoopedEffectClipInstanceId,
})

// Tutorial exposes no level-option block. Its volume follows the client.
export function playTutorialSound(clip: EffectClip) {
    if (clip.exists) clip.play(0)
}

export function stopHeldSound() {
    if (held.secondary) {
        effect.clips.stopLoop(held.secondary)
        held.secondary = 0
    }
    if (held.primary) {
        effect.clips.stopLoop(held.primary)
        held.primary = 0
    }
}

export function startHeldSound() {
    stopHeldSound()
    if (!effect.clips.normalHold.exists) return
    held.primary = effect.clips.normalHold.loop()
    if (effect.clips.holdSecondary.exists) held.secondary = effect.clips.holdSecondary.loop()
}

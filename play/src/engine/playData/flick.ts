import { FlickDirection } from '../../../../shared/src/engine/data/FlickDirection.js'
import { disallowEmpty } from './archetypes/InputManager.js'

export const minFlickVR = 0.5

// FTLiveSimulator's flick input is a movement-velocity crossing sampled while
// the finger stays pressed (ScreenTouchInputProvider.GetFlickState runs for
// Moved/Stationary phases only). A release velocity cannot express a swipe
// during a held slide, so movement is the primary signal and vr a fallback
// for swipes that release within one frame.
export const minFlickDelta = 0.15
export const minFlickSpeed = 14

export function isFlickTouch(touch: Touch): boolean {
    const { x, y } = touch.delta
    if (x * x + y * y >= minFlickDelta * minFlickDelta) return true
    const { x: vx, y: vy } = touch.velocity
    if (vx * vx + vy * vy >= minFlickSpeed * minFlickSpeed) return true
    return touch.vr >= minFlickVR
}


/**
 * FlickUpdater's near-position latch scan: any pressed finger (held or
 * fresh) whose swipe begins inside [l, r] latches the note at the swipe's
 * event time. Returns -9999 when no qualifying swipe occurred this frame.
 * Hitboxes are full-height natively (judgement Y offsets are unbounded), so
 * only the X bounds are checked, in transformed screen coordinates.
 */
// FTLiveSimulator drains bucket 0 through GetPriorityNote: one note wins per
// frame, so a single swipe judges exactly one flick. Touches consumed by
// another flick in the same frame are skipped here.
const consumedFlickTouches = levelMemory({
    ids: Dictionary(16, TouchId, Number),
    frame: Number,
})

export function scanFlickLatch(l: number, r: number): number {
    let latch = -9999
    for (const touch of touches) {
        if (!isFlickTouch(touch)) continue
        if (touch.lastPosition.x < l || touch.lastPosition.x > r) continue

        const index = consumedFlickTouches.ids.indexOf(touch.id)
        if (index !== -1 && consumedFlickTouches.ids.getValue(index) === time.now) continue

        disallowEmpty(touch)
        latch = touch.time
    }
    return latch
}

/** Marks the swipe that judged a flick as consumed for this frame. */
export function consumeFlickTouch(latchedTime: number): void {
    for (const touch of touches) {
        if (touch.time !== latchedTime) continue
        consumedFlickTouches.ids.set(touch.id, time.now)
        return
    }
}

/**
 * IsJudgementFlickNote: a latched swipe judges on the release frame, or while
 * pressed once the note time has been reached. A wrong-direction or
 * pre-window swipe never latches, so it neither consumes nor fails.
 */
export function isFlickLatchReady(latchedTime: number, targetTime: number): boolean {
    if (latchedTime === -9999) return false
    if (time.now >= targetTime) return true
    for (const touch of touches) if (touch.ended) return true
    return false
}

import { FlickDirection } from '../../../../shared/src/engine/data/FlickDirection.js'
import { options } from '../configuration/options.js'
import { disallowEmpty } from './archetypes/InputManager.js'

export const minFlickVR = 0.5

// FTLiveSimulator's flick input is a movement-velocity crossing sampled while
// the finger stays pressed (ScreenTouchInputProvider.GetFlickState runs for
// Moved/Stationary phases only). Keep the existing displacement, Cartesian
// velocity, and radial velocity thresholds for the default input policy.
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
 * Optional "Match Flick Direction" standard option (off by default: native Our
 * Notes flicks accept any direction). Mirrors the half-plane rule of the GBP
 * engines (Burrito's DirectionalFlickNote: `dx * direction >= 0`): a left
 * arrow accepts any swipe whose horizontal component is not rightward (6
 * through 9 to 12 o'clock), a right arrow the mirrored half-plane. Up-arrow
 * flicks stay omnidirectional. Positive screen X points right; the imported
 * direction is already mirrored.
 */
export function matchesFlickDirection(x: number, y: number, direction: FlickDirection): boolean {
    if (direction === FlickDirection.Up) return true
    if (x === 0 && y === 0) return false
    return x * direction >= 0
}

export function isMatchingFlickTouch(touch: Touch, direction: FlickDirection): boolean {
    // Use the signal that qualified the flick. A contrary current displacement
    // cannot be overridden by velocity left over from the preceding movement.
    const { x, y } = touch.delta
    if (x * x + y * y >= minFlickDelta * minFlickDelta)
        return matchesFlickDirection(x, y, direction)
    const { x: vx, y: vy } = touch.velocity
    return matchesFlickDirection(vx, vy, direction)
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

export function scanFlickLatch(l: number, r: number, direction: FlickDirection): number {
    let latch = -9999
    for (const touch of touches) {
        if (!isFlickTouch(touch)) continue
        if (options.matchFlickDirection && !isMatchingFlickTouch(touch, direction)) continue
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
 * pressed once the note time has been reached. Pre-window swipes never latch;
 * with direction matching enabled, wrong-direction swipes never latch either.
 */
export function isFlickLatchReady(latchedTime: number, targetTime: number): boolean {
    if (latchedTime === -9999) return false
    if (time.now >= targetTime) return true
    for (const touch of touches) if (touch.ended) return true
    return false
}

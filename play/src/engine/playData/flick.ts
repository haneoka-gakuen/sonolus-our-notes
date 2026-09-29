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

// IsTargetDirectionFlick quantizes the swipe against the note's horizontal
// axis within DirectionFlickAngle degrees; Normal (Up) accepts any direction.
// The authored angle is a per-live setting that is not in the master data;
// 60 degrees keeps comfortable diagonal swipes inside the cone.
const directionFlickCos = Math.cos((60 * Math.PI) / 180)

export function isFlickTouch(touch: Touch): boolean {
    const { x, y } = touch.delta
    if (x * x + y * y >= minFlickDelta * minFlickDelta) return true
    const { x: vx, y: vy } = touch.velocity
    if (vx * vx + vy * vy >= minFlickSpeed * minFlickSpeed) return true
    return touch.vr >= minFlickVR
}

export function matchesFlickDirection(touch: Touch, direction: FlickDirection): boolean {
    if (direction === FlickDirection.Up) return true
    let dx = touch.delta.x
    let dy = touch.delta.y
    if (dx === 0 && dy === 0) {
        dx = touch.velocity.x
        dy = touch.velocity.y
        if (dx === 0 && dy === 0) return true // release-only signal: direction unknown
    }
    const axis = (direction === FlickDirection.Left ? -dx : dx) / Math.hypot(dx, dy)
    return axis >= directionFlickCos
}

/**
 * FlickUpdater's near-position latch scan: any pressed finger (held or
 * fresh) whose swipe begins inside [l, r] latches the note at the swipe's
 * event time. Returns -9999 when no qualifying swipe occurred this frame.
 * Hitboxes are full-height natively (judgement Y offsets are unbounded), so
 * only the X bounds are checked, in transformed screen coordinates.
 */
export function scanFlickLatch(direction: FlickDirection, l: number, r: number): number {
    let latch = -9999
    for (const touch of touches) {
        if (!isFlickTouch(touch)) continue
        if (!matchesFlickDirection(touch, direction)) continue
        if (touch.lastPosition.x < l || touch.lastPosition.x > r) continue

        disallowEmpty(touch)
        latch = touch.time
    }
    return latch
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

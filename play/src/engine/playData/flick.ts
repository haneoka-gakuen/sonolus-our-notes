import { FlickDirection } from "../../../../shared/src/engine/data/FlickDirection.js";
import { ourNotesInputRules } from "../../../../shared/src/engine/data/ourNotesInputRules.js";
import { options } from "../configuration/options.js";
import { disallowEmpty } from "./archetypes/InputManager.js";
import { inputEventMs, inputFrameMs, isWithinSourceWindow, usesSourceTiming } from "./inputClock.js";

// Sonolus velocity.r measures half PlayArea heights per second. Calibrate the
// formal physical rule against an explicit reference height; the client does
// not expose the device's physical display dimensions.
const referencePlayAreaHeightCm = 8;
export const minFlickVR =
  (2 * ourNotesInputRules.flick.distanceCm) /
  (ourNotesInputRules.flick.referenceFrameSeconds * referencePlayAreaHeightCm);

export function isFlickTouch(touch: Touch): boolean {
  // Moved/Stationary can establish a new latch. A prior latch still settles
  // through isFlickLatchReady when its bound finger is released.
  if (touch.started || touch.ended) return false;
  return touch.vr > minFlickVR / options.flickSensitivity;
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
  if (direction === FlickDirection.Up) return true;
  if (x === 0 && y === 0) return false;
  return x * direction >= 0;
}

export function isMatchingFlickTouch(touch: Touch, direction: FlickDirection): boolean {
  const { x, y } = touch.velocity;
  return matchesFlickDirection(x, y, direction);
}

/**
 * FlickUpdater's near-position latch scan: a maintained finger whose
 * swipe begins inside [l, r] latches the note at the swipe's
 * event time and finger ID. The time is -9999 when no swipe qualifies.
 * Hitboxes are full-height natively (judgement Y offsets are unbounded), so
 * only the X bounds are checked, in transformed screen coordinates.
 */
// A touch ID completes one flick per update cycle. Touches consumed by
// another flick in the same frame are skipped here.
const consumedFlickTouches = levelMemory({
  ids: Dictionary(16, TouchId, Number),
  frame: Number,
});

function clearConsumedFlicksFromPreviousFrame(): void {
  if (consumedFlickTouches.frame === time.now) return;

  consumedFlickTouches.ids.clear();
  consumedFlickTouches.frame = time.now;
}

export type FlickLatch = { time: number; touchId: TouchId };

export function scanFlickLatch(
  l: number,
  r: number,
  direction: FlickDirection,
  sourceTargetMs: number,
  window: Range,
): FlickLatch {
  clearConsumedFlicksFromPreviousFrame();

  let latch = -9999;
  let latchedTouchId = 0 as unknown as TouchId;
  for (const touch of touches) {
    if (!isFlickTouch(touch)) continue;
    if (usesSourceTiming() && !isWithinSourceWindow(inputEventMs(touch.time), sourceTargetMs, window)) continue;
    if (options.matchFlickDirection && !isMatchingFlickTouch(touch, direction)) continue;
    if (touch.lastPosition.x < l || touch.lastPosition.x > r) continue;

    const index = consumedFlickTouches.ids.indexOf(touch.id);
    if (index !== -1 && consumedFlickTouches.ids.getValue(index) === time.now) continue;

    disallowEmpty(touch);
    latch = touch.time;
    latchedTouchId = touch.id;
  }
  return { time: latch, touchId: latchedTouchId };
}

/** Consumes the finger that supplied the latched swipe for this frame. */
export function consumeFlickTouch(latchedTouchId: TouchId): void {
  clearConsumedFlicksFromPreviousFrame();

  consumedFlickTouches.ids.set(latchedTouchId, time.now);
}

/**
 * IsJudgementFlickNote: a latched swipe judges on the release frame, or while
 * pressed once the note time has been reached. Pre-window swipes never latch;
 * with direction matching enabled, wrong-direction swipes never latch either.
 */
export function isFlickLatchReady(
  latchedTime: number,
  targetTime: number,
  latchedTouchId: TouchId,
  sourceTargetMs: number,
  window: Range,
): boolean {
  if (latchedTime === -9999) return false;
  if (usesSourceTiming()) {
    const frameMs = inputFrameMs();
    if (!isWithinSourceWindow(frameMs, sourceTargetMs, window)) return false;
    if (!isWithinSourceWindow(inputEventMs(latchedTime), sourceTargetMs, window)) return false;
    if (frameMs >= sourceTargetMs) return true;
  } else if (time.now >= targetTime + input.offset) return true;
  for (const touch of touches) if (touch.id === latchedTouchId && touch.ended) return true;
  return false;
}

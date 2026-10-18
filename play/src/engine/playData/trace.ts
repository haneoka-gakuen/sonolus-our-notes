// TraceUpdaterBase reserves early Press and grades PressExit at its input time.
// At/after the target, maintained Press grades at the note's own time.
import { containsInputEvent, hasInputTargetArrived, hasInputWindowEnded } from "./inputClock.js";

export const getTraceHit = (
  touch: Touch,
  fullHitbox: Rect,
  inputTime: Range,
  targetTime: number,
  sourceTargetMs: number,
  window: Range,
) => {
  const inside = fullHitbox.contains(touch.position);
  const wasInside = touch.started ? fullHitbox.contains(touch.startPosition) : fullHitbox.contains(touch.lastPosition);
  const exited = touch.ended ? inside || wasInside : !inside && wasInside;
  let hitTime = -9999;
  let atTarget = false;

  if (exited) {
    const eventTime = touch.ended ? touch.time : time.now - input.offset;
    if (containsInputEvent(eventTime, inputTime, sourceTargetMs, window)) hitTime = eventTime;
  } else if (
    !touch.ended &&
    inside &&
    hasInputTargetArrived(targetTime, sourceTargetMs) &&
    !hasInputWindowEnded(inputTime, sourceTargetMs, window)
  ) {
    hitTime = targetTime;
    atTarget = true;
  }
  return { time: hitTime, atTarget };
};

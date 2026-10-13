// TraceUpdaterBase reserves early Press and grades PressExit at its input time.
// At/after the target, maintained Press grades at the note's own time.
export const getTraceHitTime = (touch: Touch, fullHitbox: Rect, inputTime: Range, targetTime: number) => {
  const inside = fullHitbox.contains(touch.position);
  const wasInside = touch.started ? fullHitbox.contains(touch.startPosition) : fullHitbox.contains(touch.lastPosition);
  const exited = touch.ended ? inside || wasInside : !inside && wasInside;

  if (exited) {
    const hitTime = touch.ended ? touch.time : time.now - input.offset;
    return inputTime.contains(hitTime + input.offset) ? hitTime : -9999;
  }
  if (touch.ended || !inside || time.now < targetTime + input.offset || time.now > inputTime.max) return -9999;

  return targetTime;
};

export const scrollClockSchema = {
  head: { name: "clockHead", type: Number },
  at: { name: "clockTime", type: Number },
  value: { name: "clockValue", type: Number },
  scale: { name: "clockScale", type: Number },
  next: { name: "clockNext", type: Number },
  exactSpawn: { name: "clockExactSpawn", type: Number },
};
export interface ScrollClockData { at: number; value: number; scale: number; next: number }
export const readScrollTime = (ref: number, now: number, get: (index: number) => ScrollClockData): number => {
  let result = now;
  while (ref > 0) {
    const change = get(ref);
    if (change.at > now) break;
    result = change.value + (now - change.at) * change.scale;
    ref = change.next;
  }
  return result;
};

/** Recover the first entry of a point on one or two authored clocks. */
export function recoverScrollSpawn(
  left: number, right: number, ratio: number, target: number, until: number, get: (index: number) => ScrollClockData,
): number {
  let from = -4.5;
  let valueL = from, valueR = from, scaleL = 1, scaleR = 1;
  if (ratio === 0 || left === right) right = 0;
  if (ratio === 1 && right > 0) { left = right; right = 0; }
  const blend = right > 0 ? ratio : 0;
  while (from < until) {
    const endL = left > 0 ? get(left).at : until;
    const endR = right > 0 ? get(right).at : until;
    const to = Math.min(until, endL, endR);
    const scale = scaleL + (scaleR - scaleL) * blend;
    const start = target - (valueL + (valueR - valueL) * blend);
    const end = start - (to - from) * scale;
    if (start >= -.64 && start <= 4.4) return from;
    if (start > 4.4 && end <= 4.4) return from + (start - 4.4) / scale;
    if (start < -.64 && end >= -.64) return from + (start + .64) / scale;
    if (to >= until) break;
    valueL += (to - from) * scaleL;
    valueR += (to - from) * scaleR;
    from = to;
    if (left > 0 && endL === to) {
      const segment = get(left);
      valueL = segment.value;
      scaleL = segment.scale;
      left = segment.next;
    }
    if (right > 0 && endR === to) {
      const segment = get(right);
      valueR = segment.value;
      scaleR = segment.scale;
      right = segment.next;
    }
  }
  return until;
}

export const forcedScrollDuration = (speed: number): number => {
  if (speed <= 12) return Math.ceil(1000 * Math.lerp(0.35, 4, Math.unlerpClamped(12, 1, speed) ** 1.30999994)) / 1000;
  const previous = Math.ceil(1000 * Math.lerp(0.35, 4, (1 / 11) ** 1.30999994)) / 1000;
  return Math.ceil(350 * (0.35 / previous) ** (speed - 12)) / 1000;
};

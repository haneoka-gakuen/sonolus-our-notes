export const scrollClockSchema = {
  head: { name: "clockHead", type: Number },
  at: { name: "clockTime", type: Number },
  value: { name: "clockValue", type: Number },
  scale: { name: "clockScale", type: Number },
  next: { name: "clockNext", type: Number },
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
export const forcedScrollDuration = (speed: number): number => {
  if (speed <= 12) return Math.ceil(1000 * Math.lerp(0.35, 4, Math.unlerpClamped(12, 1, speed) ** 1.30999994)) / 1000;
  const previous = Math.ceil(1000 * Math.lerp(0.35, 4, (1 / 11) ** 1.30999994)) / 1000;
  return Math.ceil(350 * (0.35 / previous) ** (speed - 12)) / 1000;
};

import type { Windows } from "./windows.js";

// MasterLiveSettings, Intl build 25.
export const nativeAssist = {
  maxLevel: 5,
  gaugeMax: 100,
  perfectsToLevelDown: 20,
};

const choose = (level: number, a: number, b: number, c: number, d: number, e: number, f: number) => {
  if (level === 0) return a;
  if (level === 1) return b;
  if (level === 2) return c;
  if (level === 3) return d;
  if (level === 4) return e;
  return f;
};

export function assistInputWindow(type: number, level: number, base: Range) {
  let early = base.min;
  let late = base.max;
  if (level > 0) {
    if (type === 1 || type === 10) {
      late = choose(level, 130, 133, 137, 143, 149, 156) / 1000;
      early = -late;
    } else if (type === 5 || type === 12) {
      early = -(83 + level * 5) / 1000;
      late = choose(level, 130, 135, 140, 146, 152, 159) / 1000;
    } else if (type === 11) {
      late = choose(level, 208, 216, 222, 231, 241, 251) / 1000;
    } else if (type === 2 || type === 15 || type === 21 || type === 22) {
      early = -(67 + level * 5) / 1000;
      late = choose(level, 130, 133, 137, 143, 149, 156) / 1000;
    }
  }
  return new Range(early, late);
}

/** MasterLiveJudgementTiming, ordered by the native judgement priority. */
export function assistWindows(type: number, level: number, base: Windows): Windows {
  let perfectMin = base.perfect.min;
  let perfectMax = base.perfect.max;
  let greatMin = base.great.min;
  let greatMax = base.great.max;
  let goodMin = base.good.min;
  let goodMax = base.good.max;
  let badMin = base.bad.min;
  let badMax = base.bad.max;
  let missMax = base.miss.max;

  if (level > 0) {
    if (type === 1 || type === 10) {
      goodMax = choose(level, 100, 111, 114, 118, 124, 129) / 1000;
      goodMin = -goodMax;
      badMax = choose(level, 125, 128, 132, 137, 143, 150) / 1000;
      badMin = -badMax;
      missMax = choose(level, 130, 133, 137, 143, 149, 156) / 1000;
    } else if (type === 5 || type === 12) {
      perfectMin = -(83 + 5 * level) / 1000;
      perfectMax = type === 12 && level === 3 ? 0.058 : 0.067;
      goodMax = choose(level, 117, 120, 124, 128, 133, 139) / 1000;
      badMax = choose(level, 125, 130, 135, 140, 146, 153) / 1000;
      missMax = choose(level, 130, 135, 140, 146, 152, 159) / 1000;
    } else if (type === 11) {
      goodMax = choose(level, 191, 196, 202, 210, 219, 229) / 1000;
      badMax = choose(level, 208, 214, 220, 229, 239, 249) / 1000;
      missMax = choose(level, 208, 216, 222, 231, 241, 251) / 1000;
    } else if (type === 2 || type === 15 || type === 21 || type === 22) {
      perfectMax = (67 + 5 * level) / 1000;
      perfectMin = -perfectMax;
      greatMin = perfectMin;
      greatMax = perfectMax;
      goodMin = perfectMin;
      goodMax = perfectMax;
      badMin = perfectMin;
      badMax = perfectMax;
      missMax = choose(level, 130, 133, 137, 143, 149, 156) / 1000;
    }
  }

  const missMin = type === 1 || type === 10 ? -missMax : base.miss.min;
  return {
    perfect: new Range(perfectMin, perfectMax),
    great: new Range(greatMin, greatMax),
    good: new Range(goodMin, goodMax),
    bad: new Range(badMin, badMax),
    miss: new Range(missMin, missMax),
    input: assistInputWindow(type, level, base.input),
  };
}

export const assistPoints = (judgment: number) =>
  judgment === 1 ? 100 : judgment === 2 ? 80 : judgment === 3 ? 60 : judgment === 4 ? 25 : 0;

export const assistCountsTowardLevelDown = (operateType: number) =>
  operateType !== 21 &&
  (operateType < 60 || operateType > 63) &&
  operateType !== 104 &&
  operateType !== 105 &&
  operateType !== 120;

export function assistAreaExtra(operateType: number, level: number) {
  if ((operateType >= 60 && operateType <= 63) || operateType === 80 || operateType === 82 ||
      operateType === 104 || operateType === 105) return level === 5 ? 0.15 : level * 0.025;
  return level * 0.05;
}

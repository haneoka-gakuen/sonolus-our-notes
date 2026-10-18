import { ClaimManager } from "./ClaimManager.js";
import { inputEventMs, inputFrameMs, usesSourceTiming } from "../inputClock.js";

const disallowedEmpties = levelMemory({
  old: Collection(16, TouchId),
  now: Collection(16, TouchId),
});

export const canEmpty = (touch: Touch) => !disallowedEmpties.now.has(touch.id);

export const disallowEmpty = (touch: Touch) => {
  disallowedEmpties.now.add(touch.id);
};

const claimStartManager = new ClaimManager();

export const claimStart = (
  index: number,
  time: number,
  hitbox: Rect,
  fullHitbox: Rect,
  sourceTargetMs: number,
  window: Range,
) => {
  if (!usesSourceTiming()) {
    claimStartManager.claim(index, time, hitbox, fullHitbox, (touch) => touch.started, 0, 0, 0, 0);
    return;
  }

  claimStartManager.claim(
    index,
    time,
    hitbox,
    fullHitbox,
    (touch, inputMinMs, inputMaxMs) => {
      if (!touch.started) return false;
      const eventMs = inputEventMs(touch.startTime);
      return eventMs >= inputMinMs && eventMs <= inputMaxMs;
    },
    sourceTargetMs + Math.round(window.min * 1000),
    sourceTargetMs + Math.round(window.max * 1000),
    sourceTargetMs,
    0,
  );
};

export const getClaimedStart = (index: number) => claimStartManager.getClaimedTouchIndex(index);

export const claimEndManager = new ClaimManager();

const isMaintained = (touch: Touch) => !touch.started && !touch.ended;

export const claimEnd = (
  index: number,
  noteTime: number,
  hitbox: Rect,
  fullHitbox: Rect,
  lockoutTime: number,
  sourceTargetMs: number,
  window: Range,
) => {
  if (!usesSourceTiming()) {
    claimEndManager.claim(
      index,
      noteTime,
      hitbox,
      fullHitbox,
      (touch) => canEnd(touch, lockoutTime) && (touch.ended || (time.now >= noteTime && isMaintained(touch))),
      0,
      0,
      0,
      0,
    );
    return;
  }
  claimEndManager.claim(
    index,
    noteTime,
    hitbox,
    fullHitbox,
    (touch, inputMinMs, inputMaxMs, targetMs, ownLockoutTime) => {
      if (!canEnd(touch, ownLockoutTime)) return false;
      if (touch.ended) {
        const eventMs = inputEventMs(touch.time);
        return eventMs >= inputMinMs && eventMs <= inputMaxMs;
      }
      return inputFrameMs() >= targetMs && isMaintained(touch);
    },
    sourceTargetMs + Math.round(window.min * 1000),
    sourceTargetMs + Math.round(window.max * 1000),
    sourceTargetMs,
    lockoutTime,
  );
};

export const getClaimedEnd = (index: number) => claimEndManager.getClaimedTouchIndex(index);

const disallowedEnds = levelMemory({
  old: Dictionary(16, TouchId, Number),
  now: Dictionary(16, TouchId, Number),
});

const canEnd = (touch: Touch, targetTime: number) => {
  const index = disallowedEnds.now.indexOf(touch.id);
  if (index === -1) return true;

  return disallowedEnds.now.getValue(index) < targetTime;
};

export const disallowEnd = (touch: Touch, untilTime: number) => {
  disallowedEnds.now.set(touch.id, untilTime);
};

export class InputManager extends SpawnableArchetype({}) {
  updateSequential() {
    claimStartManager.clear();

    claimEndManager.clear();

    disallowedEmpties.now.copyTo(disallowedEmpties.old);
    disallowedEmpties.now.clear();

    disallowedEnds.now.copyTo(disallowedEnds.old);
    disallowedEnds.now.clear();

    for (const touch of touches) {
      if (disallowedEmpties.old.has(touch.id)) disallowedEmpties.now.add(touch.id);

      const index = disallowedEnds.old.indexOf(touch.id);
      if (index !== -1) disallowedEnds.now.set(touch.id, disallowedEnds.old.getValue(index));
    }
  }
}

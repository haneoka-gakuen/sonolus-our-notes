// LevelData opts into the imported music-relative millisecond grid once.
export const sourceTimingProfile = 1;
export const sourceTimingProfileDataName = "ourNotesTimingProfile";
export const inputClock = levelMemory({ profile: Number });

export const usesSourceTiming = () => inputClock.profile === sourceTimingProfile;
export const inputFrameMs = () => Math.floor((time.now - input.offset) * 1000);
export const inputEventMs = (eventTime: number) => Math.floor(eventTime * 1000);

export type InputAccuracy = { seconds: number; milliseconds: number };

export const getInputAccuracy = (
  eventTime: number,
  targetTime: number,
  sourceTargetMs: number,
  atTarget: boolean,
): InputAccuracy => {
  let seconds = eventTime - targetTime;
  let milliseconds = seconds * 1000;
  if (usesSourceTiming()) {
    milliseconds = atTarget ? 0 : inputEventMs(eventTime) - sourceTargetMs;
    seconds = milliseconds / 1000;
  }
  return { seconds, milliseconds };
};

const containsMilliseconds = (window: Range, milliseconds: number) =>
  milliseconds >= Math.round(window.min * 1000) && milliseconds <= Math.round(window.max * 1000);

export const isWithinSourceWindow = (musicMs: number, sourceTargetMs: number, window: Range) =>
  containsMilliseconds(window, musicMs - sourceTargetMs);

export const containsInputAccuracy = (window: Range, accuracy: InputAccuracy) =>
  usesSourceTiming() ? containsMilliseconds(window, accuracy.milliseconds) : window.contains(accuracy.seconds);

export const canReceiveInput = (legacyWindow: Range, sourceTargetMs: number, window: Range) =>
  usesSourceTiming() ? containsMilliseconds(window, inputFrameMs() - sourceTargetMs) : time.now >= legacyWindow.min;

export const isWithinInputWindow = (legacyWindow: Range, sourceTargetMs: number, window: Range) =>
  usesSourceTiming() ? containsMilliseconds(window, inputFrameMs() - sourceTargetMs) : legacyWindow.contains(time.now);

export const hasInputWindowEnded = (legacyWindow: Range, sourceTargetMs: number, window: Range) =>
  usesSourceTiming() ? inputFrameMs() - sourceTargetMs > Math.round(window.max * 1000) : time.now > legacyWindow.max;

export const hasInputTargetArrived = (targetTime: number, sourceTargetMs: number) =>
  usesSourceTiming() ? inputFrameMs() >= sourceTargetMs : time.now >= targetTime + input.offset;

export const containsInputEvent = (eventTime: number, legacyWindow: Range, sourceTargetMs: number, window: Range) =>
  usesSourceTiming()
    ? containsMilliseconds(window, inputEventMs(eventTime) - sourceTargetMs)
    : legacyWindow.contains(eventTime + input.offset);

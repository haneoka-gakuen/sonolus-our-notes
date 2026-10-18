// Formal 1.0.3: MasterLiveSettings.flick_distance and
// ScreenTouchInputProvider.GetFlickState's 60 Hz reference frame.
export const ourNotesInputRules = {
  flick: {
    distanceCm: 0.2,
    referenceFrameSeconds: 1 / 60,
  },
} as const;

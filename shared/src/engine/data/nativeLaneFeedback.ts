export const NativeLaneEffectType = {
  InVain: 0,
  Normal: 1,
  Slide: 2,
  Flick: 3,
  FlickLeft: 4,
  FlickRight: 5,
} as const;

type NativeLaneEffectState = { type: number; instance: number; expiresAt: number; guardExpiresAt: number };

// Compiler globals are declared locally for the standalone shared typecheck.
declare const Tuple: (length: number, definition: unknown) => unknown;
declare const levelMemory: (definition: unknown) => {
  get(index: number): Readonly<NativeLaneEffectState>;
  set(index: number, value: NativeLaneEffectState): void;
};

const instances = levelMemory(Tuple(24, { type: Number, instance: Number, expiresAt: Number, guardExpiresAt: Number }));

const nativeRoundToEven = (value: number) => {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction < 0.5) return floor;
  if (fraction > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
};

export const nativeLaneFeedbackFirst = (lane: number, size: number) => nativeRoundToEven((lane - size + 6) * 2);
export const nativeLaneFeedbackLast = (lane: number, size: number) =>
  nativeLaneFeedbackFirst(lane, size) + Math.max(1, nativeRoundToEven(size * 4)) - 1;

/** Finger coordinates index the 24 projected lane centres, then select an odd-ended pair. */
export const nativeEmptyLaneFeedbackPair = (laneCoordinate: number) => {
  const source = Math.max(0, Math.min(23, nativeRoundToEven((laneCoordinate + 6) * 2 - 0.5)));
  return Math.floor(source / 2) - 6;
};

/** LiveLaneEffectView keeps one active feedback type per physical lane. */
export const canRestartNativeLaneEffect = (type: number, lane: number, now: number, visualExpiresAt: number) => {
  const slot = instances.get(lane);
  // Source reduces this frame's requests to the highest lane-effect enum.
  if (slot.instance && slot.expiresAt === visualExpiresAt && type <= slot.type) return false;
  return type !== NativeLaneEffectType.InVain || slot.guardExpiresAt <= now || slot.type === NativeLaneEffectType.InVain;
};

export const readNativeLaneEffectInstance = (lane: number, now: number) => {
  const slot = instances.get(lane);
  return slot.expiresAt > now ? slot.instance : 0;
};

export const writeNativeLaneEffectInstance = (
  type: number,
  lane: number,
  instance: number,
  expiresAt: number,
  guardExpiresAt: number,
) => {
  instances.set(lane, { type, instance, expiresAt, guardExpiresAt });
};

export const clearNativeLaneEffectInstances = () => {
  for (let index = 0; index < 24; index++) {
    instances.set(index, { type: NativeLaneEffectType.InVain, instance: 0, expiresAt: 0, guardExpiresAt: 0 });
  }
};

export const GEKISOU_STAGE_ROM = {
  pointerSlot: 29,
  magic: 63901,
  headerSize: 7,
  slotCount: 10,
  slotStride: 10,
} as const;

export const GEKISOU_COUNTDOWN_ROM = {
  magic: 63902,
  slotCount: 5,
  slotStride: 10,
  leadMs: 3000,
  durationMs: 3100,
  missionCount: 3,
} as const;

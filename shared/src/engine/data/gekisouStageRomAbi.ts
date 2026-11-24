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

export const GEKISOU_MISSION_HUD_ROM = {
  magic: 63903,
  fps: 60,
  headerSize: 7,
  titleTable: 1,
  glyphTable: 2,
  numberTable: 3,
  gaugeTable: 4,
  symbolTable: 5,
  resultTable: 6,
  drawStride: 10,
  glyphStride: 5,
  numberStride: 11,
  showFrames: 11,
  gaugeStride: 37,
  resultFrames: 41,
  resultSlots: 8,
  symbolFrames: 36,
  symbolStride: 3,
} as const;

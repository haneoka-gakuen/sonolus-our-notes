import { getNativeLaneUnitWidth, horizonY, judgmentY } from "./lane.js";
import { GEKISOU_STAGE_ROM } from "./gekisouStageRomAbi.js";

export const gekisouStageSprites = {
  gekisouStage0: "Our Notes GEKISO Stage 0",
  gekisouStage1: "Our Notes GEKISO Stage 1",
  gekisouStage2: "Our Notes GEKISO Stage 2",
  gekisouStage3: "Our Notes GEKISO Stage 3",
  gekisouStage4: "Our Notes GEKISO Stage 4",
  gekisouStage5: "Our Notes GEKISO Stage 5",
  gekisouStage6: "Our Notes GEKISO Stage 6",
  gekisouStage7: "Our Notes GEKISO Stage 7",
  gekisouStage8: "Our Notes GEKISO Stage 8",
  gekisouStage9: "Our Notes GEKISO Stage 9",
  gekisouStage10: "Our Notes GEKISO Stage 10",
  gekisouStage11: "Our Notes GEKISO Stage 11",
  gekisouStage12: "Our Notes GEKISO Stage 12",
  gekisouStage13: "Our Notes GEKISO Stage 13",
  gekisouStage14: "Our Notes GEKISO Stage 14",
  gekisouStage15: "Our Notes GEKISO Stage 15",
  gekisouStage16: "Our Notes GEKISO Stage 16",
  gekisouStage17: "Our Notes GEKISO Stage 17",
  gekisouStage18: "Our Notes GEKISO Stage 18",
  gekisouStage19: "Our Notes GEKISO Stage 19",
} as const;

const rom = (index: number) => native.Get(3000, index);
const xUnit = getNativeLaneUnitWidth(2);
const ySpan = judgmentY - horizonY;

// An inactive range returns -1 so a later inactive range cannot erase the active one.
export function gekisouStageFrame(now: number, mission: number, start: number, end: number, mode: number) {
  const base = rom(GEKISOU_STAGE_ROM.pointerSlot);
  if (!mission || end <= start || base <= 0 || rom(base) !== GEKISOU_STAGE_ROM.magic) return -1;
  const standby = start - rom(base + 2);
  if (now < standby) return -1;
  const fps = rom(base + 1);
  const standbyFrames = Math.round(rom(base + 2) * fps / 1000);
  const inFrames = rom(base + 3);
  const loopFrames = rom(base + 4);
  const outFrames = rom(base + 5);
  const exit = end + rom(base + 6);
  let frame = 0;
  if (now >= exit) {
    const elapsed = Math.floor((now - exit) * fps / 1000);
    if (elapsed >= outFrames) return -1;
    frame = standbyFrames + inFrames + loopFrames + elapsed;
  } else if (now < start) {
    frame = Math.min(standbyFrames - 1, Math.floor((now - standby) * fps / 1000));
  } else {
    const elapsed = Math.floor((now - start) * fps / 1000);
    frame = standbyFrames + (elapsed < inFrames ? elapsed : inFrames + (elapsed - inFrames) % loopFrames);
  }
  const variant = mode === 2 ? standbyFrames + inFrames + loopFrames + outFrames : 0;
  return base + GEKISOU_STAGE_ROM.headerSize +
    (variant + frame) * GEKISOU_STAGE_ROM.slotCount * GEKISOU_STAGE_ROM.slotStride;
}

export function drawGekisouStageLight(first: SkinSprite, frame: number, z: number) {
  if (frame <= 0 || !first.exists) return;
  for (let slot = 0; slot < GEKISOU_STAGE_ROM.slotCount; slot++) {
    const sample = frame + slot * GEKISOU_STAGE_ROM.slotStride;
    const alpha = rom(sample);
    if (alpha <= 0) continue;
    const sprite = (first.id + rom(sample + 1)) as SkinSpriteId;
    native.Draw(sprite,
      rom(sample + 2) / xUnit, (rom(sample + 3) - horizonY) / ySpan,
      rom(sample + 4) / xUnit, (rom(sample + 5) - horizonY) / ySpan,
      rom(sample + 6) / xUnit, (rom(sample + 7) - horizonY) / ySpan,
      rom(sample + 8) / xUnit, (rom(sample + 9) - horizonY) / ySpan,
      slot === 0 ? z - 1 : z + slot / 100, alpha, 0, 0, 0,
    );
  }
}

import { GEKISOU_COUNTDOWN_ROM, GEKISOU_STAGE_ROM } from "./gekisouStageRomAbi.js";
import { getNativeLaneUnitWidth, horizonY, judgmentY } from "./lane.js";
import type { soloHudSpriteNames } from "./soloModeHudSprites.js";

type Sprites = Record<keyof typeof soloHudSpriteNames, SkinSprite>;

const layer = 1000;
const originY = -horizonY / (judgmentY - horizonY);
const pixelY = 2 / (1080 * (horizonY - judgmentY));

// LiveStateProperty waits for late input for 251 ms, then delays completion by 500 ms.
export const gekisouSettleMs = 751;

export function gekisouHudVisible(now: number, mission: number, start: number, end: number) {
  return mission > 0 && mission <= GEKISOU_COUNTDOWN_ROM.missionCount && end > start && now >= start - GEKISOU_COUNTDOWN_ROM.leadMs && now < end + gekisouSettleMs;
}

function tile(id: SkinSpriteId, ratio: number, x: number, y: number, w: number, h: number, z: number, alpha: number) {
  if (!native.HasSkinSprite(id) || alpha <= 0) return;
  const pixelX = pixelY / ratio;
  const left = (x - w / 2) * pixelX;
  const right = (x + w / 2) * pixelX;
  const top = originY + (y - h / 2) * pixelY;
  const bottom = originY + (y + h / 2) * pixelY;
  native.Draw(id, left, bottom, left, top, right, top, right, bottom, layer + z, alpha, 0, 0, 0);
}

function digitWidth(digit: number) {
  return digit === 1 ? 68 : digit === 4 ? 112 : digit === 8 ? 108 : 106;
}

function drawNumber(sprites: Sprites, ratio: number, value: number, x: number, y: number, height: number, alpha: number) {
  if (!sprites.digit0.exists || alpha <= 0) return;
  const scale = height / 158;
  let width = 0;
  let remain = Math.floor(Math.max(0, value));
  do {
    width += digitWidth(remain % 10) * scale;
    remain = Math.floor(remain / 10);
  } while (remain > 0);
  remain = Math.floor(Math.max(0, value));
  let right = (x + width / 2) * pixelY / ratio;
  const top = originY + (y - height / 2) * pixelY;
  const bottom = originY + (y + height / 2) * pixelY;
  do {
    const digit = remain % 10;
    const left = right - digitWidth(digit) * scale * pixelY / ratio;
    native.Draw(sprites.digit0.id + digit, left, bottom, left, top, right, top, right, bottom, layer + 2, alpha, 0, 0, 0);
    right = left;
    remain = Math.floor(remain / 10);
  } while (remain > 0);
}

const smooth = (t: number) => {
  const x = Math.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const read = (index: number) => native.Get(3000, index);
const xUnit = getNativeLaneUnitWidth(2);
const ySpan = judgmentY - horizonY;

function drawCountdown(first: SkinSprite, mission: number, relativeMs: number) {
  if (!first.exists) return;
  const stage = read(GEKISOU_STAGE_ROM.pointerSlot);
  if (stage <= 0 || read(stage) !== GEKISOU_STAGE_ROM.magic) return;
  const fps = read(stage + 1);
  const stageFrames = Math.round(read(stage + 2) * fps / 1000) + read(stage + 3) + read(stage + 4) + read(stage + 5);
  const header = stage + GEKISOU_STAGE_ROM.headerSize + 2 * stageFrames * GEKISOU_STAGE_ROM.slotCount * GEKISOU_STAGE_ROM.slotStride;
  if (read(header) !== GEKISOU_COUNTDOWN_ROM.magic) return;
  const stride = GEKISOU_COUNTDOWN_ROM.slotCount * GEKISOU_COUNTDOWN_ROM.slotStride;
  const frameCount = Math.round(GEKISOU_COUNTDOWN_ROM.durationMs * fps / 1000);
  const frame = Math.floor((relativeMs + GEKISOU_COUNTDOWN_ROM.leadMs) * fps / 1000);
  const start = header + 1 + ((mission - 1) * frameCount + frame) * stride;
  for (let slot = 0; slot < GEKISOU_COUNTDOWN_ROM.slotCount; slot++) {
    const sample = start + slot * GEKISOU_COUNTDOWN_ROM.slotStride;
    const alpha = read(sample);
    if (alpha <= 0) continue;
    const id = (first.id + read(sample + 1)) as SkinSpriteId;
    native.Draw(id,
      read(sample + 2) / xUnit, (read(sample + 3) - horizonY) / ySpan,
      read(sample + 4) / xUnit, (read(sample + 5) - horizonY) / ySpan,
      read(sample + 6) / xUnit, (read(sample + 7) - horizonY) / ySpan,
      read(sample + 8) / xUnit, (read(sample + 9) - horizonY) / ySpan,
      layer + slot / 100, alpha, 0, 0, 0,
    );
  }
}

export interface GekisouHudState {
  mission: number;
  value: number;
  sinceStart: number;
  sinceEnd: number;
  luckGauge: number;
  luckRush: number;
  luckDraw: number;
}

export function drawGekisouHud(sprites: Sprites, ratio: number, values: GekisouHudState) {
  const { mission, sinceStart, sinceEnd } = values;
  if (sinceStart < GEKISOU_COUNTDOWN_ROM.durationMs - GEKISOU_COUNTDOWN_ROM.leadMs)
    drawCountdown(sprites.countdown1, mission, sinceStart);
  if (sinceStart < 0) return;

  const alpha = 1 - smooth((sinceEnd - 251) / 500);
  tile(mission === 1 ? sprites.countCombo.id : mission === 2 ? sprites.countLuck.id : sprites.countJust.id,
    ratio, 0, -260, 190, 34, 1, alpha);
  if (values.value >= 0) drawNumber(sprites, ratio, values.value, 0, -147, 144, alpha);
  if (mission !== 2 || values.luckGauge < 0) return;
  tile(sprites.luckGaugeBase.id, ratio, 0, 51, 228, 20, 1, alpha);
  const fillWidth = Math.clamp(values.luckGauge, 0, 1) * 216;
  if (fillWidth > 0)
    tile(values.luckRush > 0 ? sprites.luckRushGauge.id : sprites.luckGauge.id, ratio, -108 + fillWidth / 2, 51, fillWidth, 12, 2, alpha);
  const result = values.luckDraw > 0 ? values.luckDraw : values.luckRush > 0 ? 4 : 0;
  if (result > 0) {
    const id = result === 1 ? sprites.noLuck.id : result === 2 ? sprites.luck.id :
      result === 3 ? sprites.superLuck.id : sprites.luckRush.id;
    const height = result === 1 ? 224 * 182 / 438 : result === 2 ? 224 * 211 / 375 :
      result === 3 ? 224 * 332 / 421 : 224 * 333 / 424;
    tile(id, ratio, 0, 70 + height / 2, 224, height, 3, alpha);
  }
}

export function drawAssistHud(sprites: Sprites, ratio: number, assistLevel: number, right: number, top: number) {
  const x = right * ratio / pixelY - 290;
  const y = top / pixelY + 150;
  tile(sprites.modeAssist.id, ratio, x, y, 156, 22.4, 1, 1);
  drawNumber(sprites, ratio, assistLevel, x, y + 33, 34, 1);
}

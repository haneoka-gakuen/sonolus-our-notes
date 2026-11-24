import { GEKISOU_COUNTDOWN_ROM, GEKISOU_MISSION_HUD_ROM as missionRom, GEKISOU_STAGE_ROM } from "./gekisouStageRomAbi.js";
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

function countdownHeader() {
  const stage = read(GEKISOU_STAGE_ROM.pointerSlot);
  if (stage <= 0 || read(stage) !== GEKISOU_STAGE_ROM.magic) return -1;
  const fps = read(stage + 1);
  const stageFrames = Math.round(read(stage + 2) * fps / 1000) + read(stage + 3) + read(stage + 4) + read(stage + 5);
  const header = stage + GEKISOU_STAGE_ROM.headerSize + 2 * stageFrames * GEKISOU_STAGE_ROM.slotCount * GEKISOU_STAGE_ROM.slotStride;
  return read(header) === GEKISOU_COUNTDOWN_ROM.magic ? header : -1;
}

function drawProjected(id: SkinSpriteId, x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number, z: number, alpha: number) {
  native.Draw(id, x1 / xUnit, (y1 - horizonY) / ySpan, x2 / xUnit, (y2 - horizonY) / ySpan,
    x3 / xUnit, (y3 - horizonY) / ySpan, x4 / xUnit, (y4 - horizonY) / ySpan, layer + z, alpha, 0, 0, 0);
}

function drawRecord(first: SkinSpriteId, sample: number, z: number, alpha: number) {
  const opacity = alpha * read(sample);
  if (opacity <= 0) return;
  const id = (first + read(sample + 1)) as SkinSpriteId;
  drawProjected(id, read(sample + 2), read(sample + 3), read(sample + 4), read(sample + 5), read(sample + 6),
    read(sample + 7), read(sample + 8), read(sample + 9), z, opacity);
}

function drawCountdown(first: SkinSprite, header: number, mission: number, relativeMs: number) {
  if (!first.exists) return;
  const stride = GEKISOU_COUNTDOWN_ROM.slotCount * GEKISOU_COUNTDOWN_ROM.slotStride;
  const frameCount = Math.round(GEKISOU_COUNTDOWN_ROM.durationMs * missionRom.fps / 1000);
  const frame = Math.floor((relativeMs + GEKISOU_COUNTDOWN_ROM.leadMs) * missionRom.fps / 1000);
  const start = header + 1 + ((mission - 1) * frameCount + frame) * stride;
  for (let slot = 0; slot < GEKISOU_COUNTDOWN_ROM.slotCount; slot++)
    drawRecord(first.id, start + slot * GEKISOU_COUNTDOWN_ROM.slotStride, slot / 100, 1);
}

function drawPlane(id: SkinSpriteId, transform: number, l: number, b: number, r: number, t: number, z: number, alpha: number) {
  const xx = read(transform), xy = read(transform + 1), x0 = read(transform + 2);
  const yx = read(transform + 3), yy = read(transform + 4), y0 = read(transform + 5);
  const wx = read(transform + 6), wy = read(transform + 7), w0 = read(transform + 8);
  const dl = wx * l + w0, dr = wx * r + w0, db = wy * b, dt = wy * t;
  drawProjected(id,
    (xx * l + xy * b + x0) / (dl + db), (yx * l + yy * b + y0) / (dl + db),
    (xx * l + xy * t + x0) / (dl + dt), (yx * l + yy * t + y0) / (dl + dt),
    (xx * r + xy * t + x0) / (dr + dt), (yx * r + yy * t + y0) / (dr + dt),
    (xx * r + xy * b + x0) / (dr + db), (yx * r + yy * b + y0) / (dr + db), z, alpha);
}

function drawMissionNumber(first: SkinSprite, world: number, kind: number, value: number, alpha: number) {
  if (!first.exists) return;
  const glyphs = world + read(world + missionRom.glyphTable);
  const transform = world + read(world + missionRom.numberTable) + kind * missionRom.numberStride;
  const spacing = read(transform + 9);
  const capacity = read(transform + 10);
  let remain = Math.floor(Math.max(0, value)) % Math.pow(10, capacity);
  const number = remain;
  let width = -spacing;
  do {
    width += read(glyphs + (remain % 10) * missionRom.glyphStride) + spacing;
    remain = Math.floor(remain / 10);
  } while (remain > 0);
  remain = number;
  let right = width / 2;
  do {
    const digit = remain % 10;
    const glyph = glyphs + digit * missionRom.glyphStride;
    const cell = read(glyph);
    const center = right - cell / 2;
    drawPlane((first.id + digit) as SkinSpriteId, transform,
      center + read(glyph + 1), read(glyph + 2), center + read(glyph + 3), read(glyph + 4), 2, alpha);
    right -= cell + spacing;
    remain = Math.floor(remain / 10);
  } while (remain > 0);
}

function drawLuckGauge(sprites: Sprites, transform: number, fill: number, rush: boolean, alpha: number) {
  const width = read(transform + 9) * Math.clamp(fill, 0, 1);
  if (width <= 0) return;
  const bottom = read(transform + 10), top = read(transform + 11);
  if (rush) {
    drawPlane(sprites.luckRushGauge.id, transform, 0, bottom, width, top, 2, alpha);
    return;
  }
  const cap = Math.min(read(transform + 12), width / 2);
  drawPlane(sprites.luckGaugeLeft.id, transform, 0, bottom, cap, top, 2, alpha);
  if (width > 2 * cap)
    drawPlane(sprites.luckGauge.id, transform, cap, bottom, width - cap, top, 2, alpha);
  drawPlane(sprites.luckGaugeRight.id, transform, width - cap, bottom, width, top, 2, alpha);
}

function drawLuck(sprites: Sprites, world: number, values: GekisouHudState, alpha: number) {
  if (!sprites.luckGaugeBase.exists || !sprites.luckSymbol0.exists) return;
  const intro = Math.min(missionRom.showFrames - 1, Math.floor(values.sinceStart * missionRom.fps / 1000));
  const gauge = world + read(world + missionRom.gaugeTable) + intro * missionRom.gaugeStride;
  const symbols = world + read(world + missionRom.symbolTable);
  const rush = values.luckRush > 0;
  drawRecord(sprites.countCombo.id, gauge, 1, alpha);
  drawRecord(sprites.countCombo.id, gauge + missionRom.drawStride, 1, alpha);
  drawLuckGauge(sprites, gauge + 2 * missionRom.drawStride, values.luckGauge, rush, alpha);
  const variant = symbols + (rush ? missionRom.symbolStride : 0);
  const cycleAge = (values.sinceStart / 1000) % read(variant + 1);
  const frame = Math.min(missionRom.symbolFrames - 1,
    Math.floor(cycleAge / read(variant) * read(variant + 2) * missionRom.symbolFrames));
  const symbol = (rush ? sprites.rushSymbol0.id : sprites.luckSymbol0.id) + frame;
  const scale = read(symbols + 2 * missionRom.symbolStride + Math.min(3, values.luckRush));
  const cx = read(gauge + 33), cy = read(gauge + 34);
  const width = scale * read(gauge + 35), height = scale * read(gauge + 36);
  drawProjected(symbol as SkinSpriteId, cx - width, cy - height, cx - width, cy + height,
    cx + width, cy + height, cx + width, cy - height, 1, alpha);
  const resultFrame = Math.floor(values.luckAge * missionRom.fps);
  if (values.luckDraw <= 0 || resultFrame < 0 || resultFrame >= missionRom.resultFrames) return;
  const stride = missionRom.resultSlots * missionRom.drawStride;
  const result = world + read(world + missionRom.resultTable) +
    ((values.luckDraw - 1) * missionRom.resultFrames + resultFrame) * stride;
  for (let slot = 0; slot < missionRom.resultSlots; slot++)
    drawRecord(sprites.countCombo.id, result + slot * missionRom.drawStride, 3 + slot / 100, alpha);
}

export interface GekisouHudState {
  mission: number;
  value: number;
  sinceStart: number;
  sinceEnd: number;
  luckGauge: number;
  luckRush: number;
  luckDraw: number;
  luckAge: number;
}

export function drawGekisouHud(sprites: Sprites, values: GekisouHudState) {
  const { mission, sinceStart, sinceEnd } = values;
  const header = countdownHeader();
  if (header < 0) return;
  if (sinceStart < GEKISOU_COUNTDOWN_ROM.durationMs - GEKISOU_COUNTDOWN_ROM.leadMs)
    drawCountdown(sprites.countdown1, header, mission, sinceStart);
  if (sinceStart < 0) return;

  const world = header + 1 + GEKISOU_COUNTDOWN_ROM.missionCount * GEKISOU_COUNTDOWN_ROM.slotCount *
    GEKISOU_COUNTDOWN_ROM.slotStride * Math.round(GEKISOU_COUNTDOWN_ROM.durationMs * missionRom.fps / 1000);
  if (read(world) !== missionRom.magic) return;
  const alpha = 1 - smooth((sinceEnd - 251) / 500);
  if (mission === 2) {
    drawLuck(sprites, world, values, alpha);
    return;
  }
  const kind = mission === 1 ? 0 : 1;
  drawRecord(sprites.countCombo.id, world + read(world + missionRom.titleTable) + kind * missionRom.drawStride, 1, alpha);
  drawMissionNumber(sprites.digit0, world, kind, values.value, alpha);
}

export function drawAssistHud(sprites: Sprites, ratio: number, assistLevel: number, right: number, top: number) {
  const x = right * ratio / pixelY - 290;
  const y = top / pixelY + 150;
  tile(sprites.modeAssist.id, ratio, x, y, 156, 22.4, 1, 1);
  drawNumber(sprites, ratio, assistLevel, x, y + 33, 34, 1);
}

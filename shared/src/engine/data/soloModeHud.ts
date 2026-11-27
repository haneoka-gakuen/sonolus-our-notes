import { GEKISOU_COUNTDOWN_ROM, GEKISOU_MISSION_HUD_ROM as missionRom, GEKISOU_STAGE_ROM } from "./gekisouStageRomAbi.js";
import { getNativeLaneUnitWidth, horizonY, judgmentY } from "./lane.js";
import { nativeAssist } from "./assist.js";
import type { soloHudSpriteNames } from "./soloModeHudSprites.js";
import { perspectiveLayout } from "./utils.js";

type Sprites = Record<keyof typeof soloHudSpriteNames, SkinSprite>;

const layer = 1000;
const originY = -horizonY / (judgmentY - horizonY);

// LiveStateProperty waits for late input for 251 ms, then delays completion by 500 ms.
export const gekisouSettleMs = 751;

export function gekisouHudVisible(now: number, mission: number, start: number, end: number) {
  return mission > 0 && mission <= GEKISOU_COUNTDOWN_ROM.missionCount && end > start && now >= start - GEKISOU_COUNTDOWN_ROM.leadMs && now < end + gekisouSettleMs;
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

export function drawAssistHud(sprites: Sprites, assistLevel: number, right: number, bottom: number, ratio: number) {
  // LiveUICanvas expands from 1920 × 1080. AssistLabel is 60 px from the
  // bottom with a 51 px parent height and a centered 607 × 106 px sprite.
  const pixelY = Math.min((2 * right * ratio) / 1920, (2 * bottom) / 1080);
  const pixelX = pixelY / ratio;
  const center = originY + bottom - 85.5 * pixelY;
  const halfWidth = 303.5 * pixelX;
  const t = center - 53 * pixelY;
  const b = center + 53 * pixelY;
  if (sprites.assistTitleLeft.exists && sprites.assistTitleRight.exists) {
    sprites.assistTitleLeft.draw(new Rect({ l: -halfWidth, r: 0, t, b }), [layer], 1);
    sprites.assistTitleRight.draw(new Rect({ l: 0, r: halfWidth, t, b }), [layer], 1);
  } else if (sprites.modeAssist.exists) {
    sprites.modeAssist.draw(new Rect({ l: -halfWidth, r: halfWidth, t, b }), [layer], 1);
  }

  if (!sprites.assistLevel0.exists) return;
  const digit = Math.clamp(Math.floor(assistLevel), 0, nativeAssist.maxLevel);
  const layout = perspectiveLayout({
    l: (halfWidth + 14 * pixelX) / center,
    r: (halfWidth + 44 * pixelX) / center,
    t: center - 22 * pixelY,
    b: center + 22 * pixelY,
  });
  native.Draw(sprites.assistLevel0.id + digit, layout.x1, layout.y1, layout.x2, layout.y2,
    layout.x3, layout.y3, layout.x4, layout.y4, layer, 1, 0, 0, 0);
}

const hudLayer = 1000;

export interface SoloHudSprites {
  digit0: SkinSprite;
  modeGekisou: SkinSprite;
  modeCombo: SkinSprite;
  modeJust: SkinSprite;
  modeLuck: SkinSprite;
  modeAssist: SkinSprite;
  modeScore: SkinSprite;
  modeMaxCombo: SkinSprite;
  modeAssistFullCombo: SkinSprite;
}

function drawLabel(sprite: SkinSprite, x: number, y: number, width: number, height: number) {
  if (!sprite.exists) return;
  sprite.draw(new Rect({ l: x - width / 2, r: x + width / 2, t: y, b: y + height }), [hudLayer], 1);
}

function drawNumber(sprites: SoloHudSprites, value: number, x: number, y: number) {
  if (!sprites.digit0.exists) return;
  const width = 0.3;
  let remain = Math.floor(Math.max(0, value));
  let count = 1;
  for (let cursor = remain; cursor >= 10; cursor = Math.floor(cursor / 10)) count++;
  for (let i = count - 1; i >= 0; i--) {
    const digit = remain % 10;
    const left = x + (i - count / 2) * width;
    const right = left + width;
    const bottom = y + 0.052;
    native.Draw(sprites.digit0.id + digit, left, bottom, left, y, right, y, right, bottom, hudLayer, 1, 0, 0, 0);
    remain = Math.floor(remain / 10);
  }
}

export function drawSoloModeHud(
  sprites: SoloHudSprites,
  values: { score: number; countdown: number; mission: number; missionValue: number; assistLevel: number; result: number; combo: number },
) {
  if (values.result > 0) {
    if (values.result === 2) drawLabel(sprites.modeAssistFullCombo, 0, 0.35, 4.6, 0.055);
    else if (values.result === 1) drawLabel(sprites.modeAssist, 0, 0.35, 1.55, 0.048);
    else drawLabel(sprites.modeGekisou, 0, 0.35, 1.55, 0.048);
    drawLabel(sprites.modeScore, 0, 0.455, 1.0, 0.035);
    drawNumber(sprites, values.score, 0, 0.505);
    drawLabel(sprites.modeMaxCombo, 0, 0.598, 1.85, 0.038);
    drawNumber(sprites, values.combo, 0, 0.65);
    return;
  }
  if (values.score >= 0) {
    drawLabel(sprites.modeScore, -4.3, 0.25, 1.1, 0.035);
    drawNumber(sprites, values.score, -4.3, 0.297);
  }
  if (values.assistLevel >= 0) {
    drawLabel(sprites.modeAssist, 4.3, 0.25, 1.25, 0.035);
    drawNumber(sprites, values.assistLevel, 4.3, 0.297);
  }
  if (values.mission === 0) return;
  if (values.mission === 1) drawLabel(sprites.modeCombo, 0, 0.43, 1.1, 0.04);
  if (values.mission === 2) drawLabel(sprites.modeLuck, 0, 0.43, 1.1, 0.04);
  if (values.mission === 3) drawLabel(sprites.modeJust, 0, 0.43, 1.1, 0.04);
  if (values.countdown > 0) drawNumber(sprites, values.countdown, 0, 0.486);
  else drawNumber(sprites, values.missionValue, 0, 0.486);
}

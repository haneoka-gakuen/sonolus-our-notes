import { planeEffectLayout, stageToPixel, stageTransform } from "/sonolus-preview.mjs";

const stageColor = [10, 22, 49];
const screenWidth = 640;
const screenHeight = 360;
const frameCount = 25;

function encodeStageLight(target, background, rgba, offset) {
  const opacity = Math.ceil(255 * Math.max(...target.map((value, index) => value / (255 - background[index]))));
  if (!opacity) return;
  for (let channel = 0; channel < 3; channel += 1) {
    rgba[offset + channel] = Math.round(background[channel] + 255 * target[channel] / opacity);
  }
  rgba[offset + 3] = opacity;
}

/** Recover the light needed behind the native foreground without raising its opacity. */
function readLightField(source, background, black, white, plane) {
  const field = new Float32Array(screenWidth * screenHeight * 3);
  const [bottomLeft, topLeft, topRight, bottomRight] = plane;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let y = 0; y < screenHeight; y += 1) {
    const v = (y + 0.5 - bottomLeft[1]) / (topLeft[1] - bottomLeft[1]);
    const left = bottomLeft[0] + v * (topLeft[0] - bottomLeft[0]);
    const right = bottomRight[0] + v * (topRight[0] - bottomRight[0]);
    if (right - left < 1) continue;
    for (let x = 0; x < screenWidth; x += 1) {
      const i = y * screenWidth + x;
      let maximum = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const offset = i * 4 + channel;
        const transmission = (white[offset] - black[offset]) / 255;
        const deficit = source[offset] - background[offset];
        const value = deficit > 2 && transmission > 0.04
          ? Math.min(255 - stageColor[channel], deficit / transmission)
          : 0;
        field[i * 3 + channel] = value;
        maximum = Math.max(maximum, value);
      }
      if (maximum > 5) {
        const u = (x + 0.5 - left) / (right - left);
        x0 = Math.min(x0, 2 * u - 1);
        y0 = Math.min(y0, 2 * v - 1);
        x1 = Math.max(x1, 2 * u - 1);
        y1 = Math.max(y1, 2 * v - 1);
      }
    }
  }
  if (!(x1 > x0 && y1 > y0)) return undefined;
  return { field, bounds: [x0 - 0.03, y0 - 0.02, x1 + 0.03, y1 + 0.02] };
}

function encodeField({ field, bounds }, plane, sampleWidth, sampleHeight) {
  const [bottomLeft, topLeft, topRight, bottomRight] = plane;
  const [x0, y0, x1, y1] = bounds;
  const pixelPoint = (x, y) => {
    const u = (x + 1) / 2;
    const v = (y + 1) / 2;
    return [0, 1].map((axis) => {
      const left = bottomLeft[axis] + v * (topLeft[axis] - bottomLeft[axis]);
      const right = bottomRight[axis] + v * (topRight[axis] - bottomRight[axis]);
      return left + u * (right - left);
    });
  };
  const bl = pixelPoint(x0, y0), tl = pixelPoint(x0, y1);
  const tr = pixelPoint(x1, y1), br = pixelPoint(x1, y0);
  const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const light = [0, 0, 0];
      for (const dy of [0.25, 0.75]) {
        for (const dx of [0.25, 0.75]) {
          const u = (x + dx) / sampleWidth;
          const v = (y + dy) / sampleHeight;
          // Native draws the carrier as two affine triangles with a shared diagonal.
          const map = (axis) => Math.floor(tl[axis] + (u < v
            ? u * (br[axis] - bl[axis]) + v * (bl[axis] - tl[axis])
            : u * (tr[axis] - tl[axis]) + v * (br[axis] - tr[axis])));
          const sx = map(0), sy = map(1);
          if (sx < 0 || sx >= screenWidth || sy < 0 || sy >= screenHeight) continue;
          for (let channel = 0; channel < 3; channel += 1) {
            light[channel] += field[(sy * screenWidth + sx) * 3 + channel] / 4;
          }
        }
      }
      encodeStageLight(light, stageColor, pixels, (y * sampleWidth + x) * 4);
    }
  }
  return pixels;
}

export async function captureSourceGlow({ previewEffect, previewSonolus, widths, notes, lowQuality, simple, sampleWidth = 24, sampleHeight = 20 }) {
  const canvas = new OffscreenCanvas(screenWidth, screenHeight);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const pixels = async (png) => {
    const bitmap = await createImageBitmap(await fetch(png).then((response) => response.blob()));
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return context.getImageData(0, 0, screenWidth, screenHeight).data;
  };
  const transform = stageTransform(16 / 9);
  const project = stageToPixel(transform, screenWidth, screenHeight);
  const effects = [];
  for (const width of widths) {
    const chartLane = 12 - width / 2;
    const plane = planeEffectLayout(transform, 0, 0, width / 4).map(project);
    for (const note of notes) {
      const base = `Our Notes Native ${note} W${width}`;
      const direction = note === "Flick Left" ? "left" : note === "Flick Right" ? "right" : "none";
      const sideFlick = direction !== "none";
      if (simple && !sideFlick) throw Error("Simple glow capture requires a side flick");
      const frames = [];
      for (let frame = 0; frame < frameCount; frame += 1) {
        const source = await previewEffect({
          kind: note === "Normal" ? "tap" : "flick",
          direction,
          judgement: "perfect",
          lane: chartLane,
          width,
          age: frame / 60,
          screenWidth,
          screenHeight,
          backgroundRgb: stageColor,
          renderingScale: lowQuality ? 0.71 : 1,
          bloomQuality: lowQuality ? 2 : 0,
          sourceSeed: 4660,
        });
        const native = async (backgroundRgb, foregroundOnly = false) => pixels((await previewSonolus({
          names: [base],
          ...(foregroundOnly && sideFlick ? { planeOrder: [0] } : {}),
          chartLane,
          width,
          progress: frame / (simple ? 45 : frameCount),
          screenWidth,
          screenHeight,
          backgroundRgb,
          seed: 4660,
        })).png);
        const [background, black, white] = await Promise.all([native(stageColor), native([0, 0, 0], true), native([255, 255, 255], true)]);
        const field = readLightField(await pixels(source.png), background, black, white, plane);
        if (!field) continue;
        frames.push({
          frame,
          bounds: field.bounds,
          pixels: Array.from(encodeField(field, plane, sampleWidth, sampleHeight)),
        });
      }
      effects.push({ name: `${base} ${sideFlick ? "P0" : "B0"}`, frames });
    }
  }
  return { profile: simple ? "simple" : lowQuality ? "light" : "standard", frameCount, width: sampleWidth, height: sampleHeight, effects };
}

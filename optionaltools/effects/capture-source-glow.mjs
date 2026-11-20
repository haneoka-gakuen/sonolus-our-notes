import { planeEffectLayout, stageToPixel, stageTransform } from "/sonolus-preview.mjs";

const stageColors = [[10, 22, 49], [54, 40, 38]];
const screenWidth = 640;
const screenHeight = 360;
const frameCount = 25;

function lightBounds(samples, black, white, plane) {
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
      const offset = (y * screenWidth + x) * 4;
      let maximum = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const index = offset + channel;
        if (white[index] - black[index] <= 10) continue;
        for (const [source, foreground] of samples) {
          maximum = Math.max(maximum, source[index] - foreground[index]);
        }
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
  return [x0 - 0.03, y0 - 0.02, x1 + 0.03, y1 + 0.02];
}

/** Fit one source-over texel through the foreground on several stage colors. */
function fitLightTexel(samples, black, white, offsets, pixels, destination) {
  // Displayed light is T × (premultiplied color − opacity × underlay).
  // Black and white foreground passes recover T and the color beneath the halo.
  const fit = Array.from({ length: 3 }, () => ({ t2: 0, t2u: 0, t2uu: 0, td: 0, tdu: 0, maxUnderlay: 0 }));
  for (const offset of offsets) {
    for (let channel = 0; channel < 3; channel += 1) {
      const i = offset + channel;
      const transmission = (white[i] - black[i]) / 255;
      if (transmission <= 0.04) continue;
      const stats = fit[channel];
      for (const [source, foreground] of samples) {
        const underlay = Math.max(0, Math.min(1, (foreground[i] - black[i]) / (255 * transmission)));
        const delta = Math.max(0, source[i] - foreground[i]) / 255;
        const t2 = transmission ** 2;
        stats.t2 += t2;
        stats.t2u += t2 * underlay;
        stats.t2uu += t2 * underlay ** 2;
        stats.td += transmission * delta;
        stats.tdu += transmission * delta * underlay;
        stats.maxUnderlay = Math.max(stats.maxUnderlay, underlay);
      }
    }
  }
  // A glow should lift the underlay on every captured plate.
  const premultiplied = (s, a) =>
    s.t2 ? Math.max(a * s.maxUnderlay, Math.min(a, (s.td + a * s.t2u) / s.t2)) : 0;
  const error = (a) => {
    let score = 0.015 * a * a;
    for (const s of fit) {
      const c = premultiplied(s, a);
      score += s.t2 * c * c + s.t2uu * a * a - 2 * s.t2u * c * a - 2 * s.td * c + 2 * s.tdu * a;
    }
    return score;
  };
  let low = 0, high = 1;
  for (let i = 0; i < 14; i += 1) {
    const a = (2 * low + high) / 3, b = (low + 2 * high) / 3;
    if (error(a) <= error(b)) high = b;
    else low = a;
  }
  const opacity = Math.round(255 * (low + high) / 2);
  if (!opacity || fit.every(({ td }) => !td)) return;
  for (let c = 0; c < 3; c++) {
    pixels[destination + c] = Math.round(255 * premultiplied(fit[c], opacity / 255) / (opacity / 255));
  }
  pixels[destination + 3] = opacity;
}

function encodeField(bounds, samples, black, white, plane, sampleWidth, sampleHeight) {
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
      const offsets = [];
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
          offsets.push((sy * screenWidth + sx) * 4);
        }
      }
      fitLightTexel(samples, black, white, offsets, pixels, (y * sampleWidth + x) * 4);
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
        const source = (backgroundRgb) => previewEffect({
          kind: note === "Normal" ? "tap" : "flick",
          direction,
          judgement: "perfect",
          lane: chartLane,
          width,
          age: frame / 60,
          screenWidth,
          screenHeight,
          backgroundRgb,
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
        const [black, white] = await Promise.all([native([0, 0, 0], true), native([255, 255, 255], true)]);
        const samples = [];
        for (const color of stageColors) {
          const reference = await source(color);
          samples.push([await pixels(reference.png), await native(color)]);
        }
        const bounds = lightBounds(samples, black, white, plane);
        if (!bounds) continue;
        frames.push({
          frame,
          bounds,
          pixels: Array.from(encodeField(bounds, samples, black, white, plane, sampleWidth, sampleHeight)),
        });
      }
      effects.push({ name: `${base} ${sideFlick ? "P0" : "B0"}`, frames });
    }
  }
  return { profile: simple ? "simple" : lowQuality ? "light" : "standard", frameCount, width: sampleWidth, height: sampleHeight, effects };
}

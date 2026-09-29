// Offline Sonolus particle renderer for side-by-side comparison with the
// Cassiopeia three.js effect. Follows Sonolus Studio's particle preview:
// sprite tinted by `color` (fill, destination-in, multiply), drawn as two
// affine triangles inside the bilinear spawn quad with globalAlpha = a.
// Spawn quads use the engine's Initialization transform and
// linearEffectLayout / groundEffectLayout formulas.

const TAU = Math.PI * 2;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = TAU / 3;
const c5 = TAU / 4.5;
const inFns = {
  Sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  Quad: (t) => t * t,
  Cubic: (t) => t ** 3,
  Quart: (t) => t ** 4,
  Quint: (t) => t ** 5,
  Expo: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)),
  Circ: (t) => 1 - Math.sqrt(1 - t * t),
  Back: (t) => c3 * t ** 3 - c1 * t * t,
  Elastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * c4)),
};
void c2;
void c5;
export function ease(name, t) {
  if (!name || name === "linear") return t;
  if (name === "none") return t >= 1 ? 1 : 0;
  const m = /^(inOut|outIn|in|out)([A-Z]\w*)$/.exec(name);
  const fin = m && inFns[m[2]];
  if (!fin) return t;
  const fout = (x) => 1 - fin(1 - x);
  switch (m[1]) {
    case "in":
      return fin(t);
    case "out":
      return fout(t);
    case "inOut":
      return t < 0.5 ? fin(2 * t) / 2 : 1 - fin(2 - 2 * t) / 2;
    default:
      return t < 0.5 ? fout(2 * t) / 2 : 0.5 + fin(2 * t - 1) / 2;
  }
}

// shared/src/engine/data/lane.ts
const horizonY = 1.115119873136453;
const judgmentY = -0.5815420740473228;
const judgmentHalfX = 0.7932747292495311;
const pitchSin = 0.49400949727308147;
const pitchCos = 0.8694565064475608;
const tanHalf = 0.5095254494944288;
const nativeEffectSkew =
  (pitchSin * tanHalf * (horizonY - judgmentY)) / (pitchCos + pitchSin * tanHalf * judgmentY);

/** Engine Initialization: stage-unit -> screen transform for a given aspect. */
export function stageTransform(aspect) {
  const target = 16 / 9;
  const screen = { w: 2 * aspect, h: 2 };
  const stage =
    aspect >= target ? { w: target * screen.h, h: screen.h } : { w: screen.w, h: screen.w / target };
  const t = (stage.h / 2) * horizonY;
  const b = (stage.h / 2) * judgmentY;
  const w = (stage.w / 2) * (judgmentHalfX / 6);
  return { sx: w, sy: b - t, ty: t, wToH: w / (t - b) };
}

export function linearEffectLayout(tr, lane, size, effectSize = 1) {
  const w = size * effectSize;
  const h = effectSize * tr.wToH;
  const p = 1 + 2 * h * nativeEffectSkew;
  const b = 1;
  const t = 1 - 2 * h;
  return [
    [lane - w, b],
    [lane * p - w, t],
    [lane * p + w, t],
    [lane + w, b],
  ];
}

export function groundEffectLayout(tr, lane, size) {
  const top = 1 - 2 * tr.wToH;
  return [
    [lane - size, 1],
    [lane * top - size, top],
    [lane * top + size, top],
    [lane + size, 1],
  ];
}

const expr = (e, r) => {
  if (!e) return 0;
  let v = 0;
  for (const [k, c] of Object.entries(e)) {
    if (k === "c") v += c;
    else {
      const m = /^(r|sinr|cosr)(\d)$/.exec(k);
      const x = r[Number(m[2]) - 1];
      v += c * (m[1] === "r" ? x : m[1] === "sinr" ? Math.sin(TAU * x) : Math.cos(TAU * x));
    }
  }
  return v;
};
const prop = (p, r, q) => {
  const from = expr(p?.from, r);
  const to = expr(p?.to, r);
  return from + (to - from) * ease(p?.ease, q);
};

const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export class SonolusParticlePreview {
  constructor(data, image) {
    this.data = data;
    this.image = image;
    this.tinted = new Map();
    this.byName = new Map(data.effects.map((effect) => [effect.name, effect]));
  }

  sprite(index, color) {
    const key = `${index}${color}`;
    let canvas = this.tinted.get(key);
    if (canvas) return canvas;
    const s = this.data.sprites[index];
    // texture * color with the texture's own alpha (the renderer's sprite
    // shader). Sonolus Studio's fill + destination-in + multiply trick lifts
    // semi-transparent texels toward white (c + 1 - a), so it is not used.
    canvas = new OffscreenCanvas(s.w, s.h);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.image, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
    const hex = color.replace("#", "");
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const tint = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    if (tint.some((value) => value < 1)) {
      const data = ctx.getImageData(0, 0, s.w, s.h);
      for (let i = 0; i < data.data.length; i += 4)
        for (let c = 0; c < 3; c += 1) data.data[i + c] = Math.round(data.data[i + c] * tint[c]);
      ctx.putImageData(data, 0, 0);
    }
    this.tinted.set(key, canvas);
    return canvas;
  }

  /**
   * Draw one effect instance. `quad` is [bl, tl, tr, br] in stage units;
   * `toPixel` maps stage units to canvas pixels. `seed` fixes r1..r8.
   */
  draw(ctx, name, quad, progress, toPixel, seed = 1, loop = false) {
    const effect = this.byName.get(name);
    if (!effect) throw Error(`Unknown effect ${name}`);
    let state = seed >>> 0 || 1;
    const rand = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
    const rect = quad.map(toPixel);
    let drawn = 0;
    for (const group of effect.groups) {
      for (let instance = 0; instance < group.count; instance += 1) {
        const r = Array.from({ length: 8 }, rand);
        for (const particle of group.particles) {
          let p = progress;
          const start = particle.start;
          const end = particle.start + particle.duration;
          if (loop && p < start) p += 1;
          if (p < start || p > end) continue;
          const q = (p - start) / Math.max(1e-9, end - start);
          const x = prop(particle.x, r, q);
          const y = prop(particle.y, r, q);
          const w = prop(particle.w, r, q);
          const h = prop(particle.h, r, q);
          const rot = prop(particle.r, r, q);
          const a = prop(particle.a, r, q);
          if (a <= 0) continue;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          const point = (n) => {
            const sx = (n === 0 || n === 1 ? -1 : 1) * w;
            const sy = (n === 0 || n === 3 ? -1 : 1) * h;
            const px = (x + sx * cos - sy * sin + 1) / 2;
            const py = (y + sy * cos + sx * sin + 1) / 2;
            return lerp2(lerp2(rect[0], rect[3], px), lerp2(rect[1], rect[2], px), py);
          };
          const p0 = point(0);
          const p1 = point(1);
          const p2 = point(2);
          const p3 = point(3);
          const texture = this.sprite(particle.sprite, particle.color);
          ctx.globalAlpha = Math.min(1, a);
          for (const [m, clip] of [
            [
              [p3[0] - p0[0], p3[1] - p0[1], p0[0] - p1[0], p0[1] - p1[1], p1[0], p1[1]],
              [
                [0, 0],
                [0, 1],
                [1, 1],
              ],
            ],
            [
              [p2[0] - p1[0], p2[1] - p1[1], p3[0] - p2[0], p3[1] - p2[1], p1[0], p1[1]],
              [
                [0, 0],
                [1, 0],
                [1, 1],
              ],
            ],
          ]) {
            ctx.save();
            ctx.transform(...m);
            ctx.beginPath();
            ctx.moveTo(...clip[0]);
            ctx.lineTo(...clip[1]);
            ctx.lineTo(...clip[2]);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(texture, 0, 0, 1, 1);
            ctx.restore();
          }
          drawn += 1;
        }
      }
    }
    ctx.globalAlpha = 1;
    return drawn;
  }
}

/** Stage units -> canvas pixels for a canvas of the given size (screen y up). */
export function stageToPixel(tr, width, height) {
  const aspect = width / height;
  return ([sx, sy]) => {
    const x = sx * tr.sx;
    const y = sy * tr.sy + tr.ty;
    return [((x / aspect + 1) / 2) * width, ((1 - y) / 2) * height];
  };
}

// engine shared/src/engine/data/nativeEffects.ts NATIVE_EFFECT_PLANES
export const NATIVE_EFFECT_PLANES = [
  { alpha1: 1, slope: -0.590625732432454 },
  { alpha1: 0.9376218323586744, slope: -0.5537835814814996 },
  { alpha1: 1.0665188470066516, slope: -0.6299134751663208 },
  { alpha1: 1, slope: 1 },
];

/** Engine nativeEffectPlaneLayout. */
export function planeEffectLayout(tr, plane, lane, size, effectSize = 1) {
  const w = size * effectSize;
  const h = effectSize * tr.wToH;
  const b = 1;
  const t = 1 - 2 * h;
  const { alpha1, slope } = NATIVE_EFFECT_PLANES[plane];
  const bottom = alpha1 + slope * (b - 1);
  const top = alpha1 + slope * (t - 1);
  return [
    [(lane - w) * bottom, b],
    [(lane - w) * top, t],
    [(lane + w) * top, t],
    [(lane + w) * bottom, b],
  ];
}

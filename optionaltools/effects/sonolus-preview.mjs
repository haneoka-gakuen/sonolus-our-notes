// Offline Sonolus particle renderer for side-by-side comparison with the
// Cassiopeia three.js effect. Follows Sonolus Studio's particle preview:
// sprite tinted by `color` (fill, destination-in, multiply), drawn as two
// affine triangles inside the bilinear spawn quad with globalAlpha = a.
// Spawn quads use the engine's Initialization transform and
// linearEffectLayout / groundEffectLayout formulas.

import { nativeLaneEffectLayout } from "../../shared/src/engine/data/nativeLaneEffectLayout.ts";
import { nativeEffectPlaneAlpha } from "../../shared/src/engine/data/nativeEffects.ts";
import { SIMPLE_LOOP_ROM } from "../../shared/src/engine/data/simpleLoopRomAbi.ts";
import { SIMPLE_LOOP_WORLD_ROM } from "../../shared/src/engine/data/simpleLoopWorldRomAbi.ts";
import { projectSourceViewBillboard } from "../../shared/src/engine/data/sourceViewBillboard.ts";
import { SIMPLE_LOOP_PHASE_EFFECTS } from "../../shared/src/engine/data/simpleLoopPhaseEffects.ts";

/** Read the engine's actual little-endian Float32 ROM for the authoring preview. */
export function readSourceLoopRom(bytes) {
  const view = new DataView(bytes);
  const get = (i) => view.getFloat32(i * 4, true);
  if (get(0) === SIMPLE_LOOP_WORLD_ROM.magic) return readSourceWorldLoopRom(get, bytes.byteLength);
  if (get(0) !== SIMPLE_LOOP_ROM.magic || get(1) !== SIMPLE_LOOP_ROM.version || get(11) * 4 !== bytes.byteLength)
    throw Error("Source particle ROM does not match the engine ABI");
  const sizeOffset = get(7),
    sizeCount = get(8);
  const size = (phase) => {
    let i = 0;
    while (i < sizeCount - 2 && phase >= get(sizeOffset + (i + 1) * 5)) i++;
    const a = sizeOffset + i * 5;
    if (phase <= get(sizeOffset)) return Math.max(0, get(sizeOffset + 4));
    if (phase >= get(sizeOffset + (sizeCount - 1) * 5)) return Math.max(0, get(sizeOffset + (sizeCount - 1) * 5 + 4));
    const dt = phase - get(a);
    return Math.max(0, ((get(a + 1) * dt + get(a + 2)) * dt + get(a + 3)) * dt + get(a + 4));
  };
  const records = Array.from({ length: get(4) }, (_, i) => {
    const a = get(5) + i * 4;
    return { birth: get(a), lifetime: get(a + 1), offset: get(a + 2), keys: get(a + 3) };
  });
  return {
    period: get(3),
    records,
    sample(record, phase) {
      let i = 0;
      while (i < record.keys - 2 && phase >= get(record.offset + (i + 1) * 11)) i++;
      const a = record.offset + i * 11,
        b = a + 11;
      const q = Math.max(0, Math.min(1, (phase - get(a)) / (get(b) - get(a))));
      const at = (axis) => get(a + axis) + (get(b + axis) - get(a + axis)) * q;
      const scale = size(phase),
        cx = at(1),
        cy = at(2);
      return [0, 3, 2, 1].map((corner) => [cx + at(3 + corner * 2) * scale, cy + at(4 + corner * 2) * scale]);
    },
  };
}

function readSourceWorldLoopRom(get, byteLength) {
  if (
    (get(1) !== SIMPLE_LOOP_WORLD_ROM.version && get(1) !== SIMPLE_LOOP_WORLD_ROM.phaseVersion) ||
    get(11) * 4 !== byteLength
  )
    throw Error("Source world ROM does not match its ABI");
  const frame = {
    cameraY: get(16),
    cameraZ: get(17),
    sinPitch: get(18),
    cosPitch: get(19),
    scaleX: get(20),
    scaleY: get(21),
    offsetY: get(22),
    expandX: get(24),
    expandY: get(25),
  };
  const so = get(7),
    sc = get(8),
    records = Array.from({ length: get(4) }, (_, i) => {
      const p = get(5) + i * 8;
      return {
        birth: get(p),
        lifetime: get(p + 1),
        slope: get(p + 2),
        intercept: get(p + 3),
        baseX: get(p + 4),
        baseY: get(p + 5),
        offset: get(p + 6),
        keys: get(p + 7),
      };
    });
  return {
    coordinate: "stage",
    phaseOffset: get(1) === SIMPLE_LOOP_WORLD_ROM.phaseVersion,
    phaseProgramCount: get(27),
    maximumLatePhase: get(28),
    canonicalWToH: get(26),
    period: get(3),
    records,
    sample(record, phase, lane, birthWidth) {
      let s = 0,
        m = 0;
      while (s < sc - 2 && phase >= get(so + (s + 1) * 5)) s++;
      const p = so + s * 5,
        dt = phase - get(p);
      let scale = Math.max(0, ((get(p + 1) * dt + get(p + 2)) * dt + get(p + 3)) * dt + get(p + 4));
      if (phase <= get(so)) scale = Math.max(0, get(so + 4));
      if (phase >= get(so + (sc - 1) * 5)) scale = Math.max(0, get(so + (sc - 1) * 5 + 4));
      while (m < record.keys - 2 && phase >= get(record.offset + (m + 1) * 3)) m++;
      const a = record.offset + m * 3,
        b = a + 3,
        q = Math.max(0, Math.min(1, (phase - get(a)) / (get(b) - get(a))));
      const y = get(a + 1) + (get(b + 1) - get(a + 1)) * q,
        z = get(a + 2) + (get(b + 2) - get(a + 2)) * q,
        x = lane * get(23) + record.intercept + record.slope * birthWidth;
      const f = projectSourceViewBillboard(x, y, z, record.baseX * scale, record.baseY * scale, frame);
      return [
        [f.x - f.halfWidth, f.y + f.halfHeight],
        [f.x - f.halfWidth, f.y - f.halfHeight],
        [f.x + f.halfWidth, f.y - f.halfHeight],
        [f.x + f.halfWidth, f.y + f.halfHeight],
      ];
    },
  };
}

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
const nativeEffectSkew = (pitchSin * tanHalf * (horizonY - judgmentY)) / (pitchCos + pitchSin * tanHalf * judgmentY);

/** Engine Initialization: stage-unit -> screen transform for a given aspect. */
export function stageTransform(aspect) {
  const target = 16 / 9;
  const screen = { w: 2 * aspect, h: 2 };
  const stage = aspect >= target ? { w: target * screen.h, h: screen.h } : { w: screen.w, h: screen.w / target };
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
  const quad = nativeLaneEffectLayout({ lane, size, wToH: tr.wToH });
  return [
    [quad.x1, quad.y1],
    [quad.x2, quad.y2],
    [quad.x3, quad.y3],
    [quad.x4, quad.y4],
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
          const layer = (this.triangleLayer ??= new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height));
          if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
            layer.width = ctx.canvas.width;
            layer.height = ctx.canvas.height;
          }
          const paint = layer.getContext("2d");
          paint.clearRect(0, 0, layer.width, layer.height);
          paint.globalCompositeOperation = "lighter";
          paint.globalAlpha = Math.min(1, a);
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
            paint.save();
            paint.transform(...m);
            paint.beginPath();
            paint.moveTo(...clip[0]);
            paint.lineTo(...clip[1]);
            paint.lineTo(...clip[2]);
            paint.closePath();
            paint.clip();
            paint.drawImage(texture, 0, 0, 1, 1);
            paint.restore();
          }
          ctx.globalAlpha = 1;
          ctx.drawImage(layer, 0, 0);
          drawn += 1;
        }
      }
    }
    ctx.globalAlpha = 1;
    return drawn;
  }

  /** Same source-slot particle resource, Move corners and applied birth epoch as the engine. */
  drawMovedSourceSlot(ctx, rom, age, tr, lane, toPixel, frameRate = 60, effectSize = 1, size = 2, layoutAt) {
    let drawn = 0,
      residents = 0,
      droppedLate = 0;
    const names = [SIMPLE_LOOP_ROM.effectName, ...Object.values(SIMPLE_LOOP_PHASE_EFFECTS)];
    const cycle = Math.floor(age / rom.period);
    for (let c = Math.max(0, cycle - 1); c <= cycle; c++)
      for (const record of rom.records) {
        const birth = c * rom.period + record.birth;
        const appliedBirth = Math.ceil((birth - 1e-10) * frameRate) / frameRate;
        const elapsed = age - appliedBirth;
        const lateness = appliedBirth - birth,
          latePhase = lateness / record.lifetime,
          duration = record.lifetime - (rom.phaseOffset ? lateness : 0);
        if (elapsed < 0 || elapsed >= duration) continue;
        if (rom.phaseOffset && latePhase > rom.maximumLatePhase) {
          droppedLate++;
          continue;
        }
        const phase = (age - (rom.phaseOffset ? birth : appliedBirth)) / record.lifetime,
          program = rom.phaseOffset ? Math.round((latePhase / rom.maximumLatePhase) * (rom.phaseProgramCount - 1)) : 0;
        const current = layoutAt?.(age) ?? { lane, size },
          born = layoutAt?.(appliedBirth) ?? { lane, size };
        const quad = rom.sample(record, phase, current.lane, born.size * 4).map(([x, y]) => {
          if (rom.coordinate === "stage")
            return [
              current.lane + (x - current.lane) * effectSize,
              1 + ((y - 1) * effectSize * tr.wToH) / rom.canonicalWToH,
            ];
          const stageY = 1 - (y + 1) * effectSize * tr.wToH;
          return [(lane + x * 2 * effectSize) * nativeEffectPlaneAlpha(0, stageY), stageY];
        });
        residents++;
        drawn += this.draw(ctx, names[program], quad, elapsed / duration, toPixel);
      }
    return { drawn, residents, droppedLate };
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

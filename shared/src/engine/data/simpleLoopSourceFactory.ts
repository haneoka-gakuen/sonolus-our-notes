import { projectSourceViewBillboard, projectSourceCameraBillboard } from "./sourceViewBillboard.js";
import { SIMPLE_LOOP_WORLD_ROM as ABI } from "./simpleLoopWorldRomAbi.js";
import {
  sourceLoopPhaseEffectId,
  sourceLoopPhaseEffectsExist,
  type SimpleLoopPhaseEffects,
} from "./simpleLoopPhaseEffects.js";
type Resident = {
  id: number;
  sourceBirth: number;
  record: number;
  motionCursor: number;
  sizeCursor: number;
  birthX: number;
  lifetime: number;
  motionEnd: number;
};
type Program = { owner: number; epoch: number; next: number; cycle: number; lastNow: number; endTime: number; residentEnd: number };
declare const native: {
  Get(block: number, index: number): number;
  SpawnParticleEffect(
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    duration: number,
    loop: boolean,
  ): number;
  MoveParticleEffect(
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
  ): number;
  DestroyParticleEffect(id: number): number;
};
declare const Tuple: (count: number, definition: unknown) => unknown;
export type SimpleLoopSourcePool = {
  programs: {
    get(index: number): Readonly<Program>;
    set(index: number, value: Readonly<Program>): void;
  };
  residents: {
    get(index: number): Readonly<Resident>;
    set(index: number, value: Readonly<Resident>): void;
  };
};
export const simpleLoopSourceMemory = (programCount: number) => ({
  programs: Tuple(programCount, {
    owner: Number,
    epoch: Number,
    next: Number,
    cycle: Number,
    lastNow: Number,
    endTime: Number,
    residentEnd: Number,
  }),
  residents: Tuple(programCount * ABI.maxResidents, {
    id: Number,
    sourceBirth: Number,
    record: Number,
    motionCursor: Number,
    sizeCursor: Number,
    birthX: Number,
    lifetime: Number,
    motionEnd: Number,
  }),
});
const rom = (index: number) => native.Get(3000, index);
export const validSimpleLoopRom = () =>
  rom(0) === ABI.magic &&
  (rom(1) === ABI.version ||
    (rom(1) === ABI.phaseVersion && rom(27) === ABI.phaseCount && rom(28) === ABI.maximumLatePhase)) &&
  rom(6) === 8 &&
  rom(9) === 5 &&
  rom(10) === 3 &&
  rom(12) === ABI.maxResidents;
export const hasSimpleLoopSourceEffects = (effects: SimpleLoopPhaseEffects) =>
  rom(1) !== ABI.phaseVersion || sourceLoopPhaseEffectsExist(effects);

export const createSimpleLoopSource = (pool: SimpleLoopSourcePool, programCount: number) => ({ pool, programCount });
export type SimpleLoopSource = ReturnType<typeof createSimpleLoopSource>;
export const releaseSimpleLoopSource = (source: SimpleLoopSource, owner: number, now: number, forget: boolean) => {
  for (let i = 0; i < source.programCount; i++) {
    const program = source.pool.programs.get(i);
    if (program.owner !== owner + 1) continue;
    for (let j = 0; j < program.residentEnd; j++) {
      const index = i * ABI.maxResidents + j;
      const slot = source.pool.residents.get(index);
      if (!slot.id) continue;
      if (!forget && now < slot.sourceBirth + slot.lifetime) native.DestroyParticleEffect(slot.id);
      source.pool.residents.set(index, { ...slot, id: 0 });
    }
    source.pool.programs.set(i, { ...program, owner: 0, residentEnd: 0 });
  }
};
export const retireSimpleLoopSources = (source: SimpleLoopSource, now: number, skip: boolean) => {
  for (let i = 0; i < source.programCount; i++) {
    const p = source.pool.programs.get(i);
    if (p.owner && (skip || now >= p.endTime)) releaseSimpleLoopSource(source, p.owner - 1, now, skip);
  }
};
/** Sequential admission freezes birth shape width; a width change never restarts the PS clock. */
export const updateSimpleLoopSource = (
  source: SimpleLoopSource,
  owner: number,
  now: number,
  lane: number,
  size: number,
  effects: SimpleLoopPhaseEffects,
  endTime: number,
) => {
  let pi = -1;
  for (let i = 0; i < source.programCount; i++) {
    if (source.pool.programs.get(i).owner !== owner + 1) continue;
    pi = i;
    break;
  }
  if (pi < 0) {
    for (let i = 0; i < source.programCount; i++) {
      if (source.pool.programs.get(i).owner) continue;
      pi = i;
      break;
    }
    if (pi < 0) return false;
    source.pool.programs.set(pi, { owner: owner + 1, epoch: now, next: 0, cycle: 0, lastNow: now, endTime, residentEnd: 0 });
  }
  const p = { ...source.pool.programs.get(pi) };
  if (now < p.lastNow) {
    releaseSimpleLoopSource(source, owner, now, true);
    return false;
  }
  p.lastNow = now;
  let residentEnd = 0;
  for (let j = 0; j < p.residentEnd; j++) {
    const index = pi * ABI.maxResidents + j;
    const slot = source.pool.residents.get(index);
    if (!slot.id) continue;
    if (now >= slot.sourceBirth + slot.lifetime) source.pool.residents.set(index, { ...slot, id: 0 });
    else residentEnd = j + 1;
  }
  p.residentEnd = residentEnd;
  const count = rom(4),
    records = rom(5),
    period = rom(3),
    phaseOffset = rom(1) === ABI.phaseVersion;
  while (p.epoch + p.cycle * period + rom(records + p.next * 8) <= now) {
    const record = records + p.next * 8,
      birth = p.epoch + p.cycle * period + rom(record);
    const lifetime = rom(record + 1),
      latePhase = (now - birth) / lifetime;
    if (now < birth + lifetime && (!phaseOffset || latePhase <= rom(28))) {
      let free = -1;
      for (let j = 0; j < ABI.maxResidents; j++) {
        if (source.pool.residents.get(pi * ABI.maxResidents + j).id) continue;
        free = j;
        break;
      }
      if (free >= 0) {
        const index = pi * ABI.maxResidents + free;
        const motion = rom(record + 6);
        const slot: Resident = {
          id: 0,
          record,
          birthX: rom(record + 2) * Math.max(0, size * 4),
          sourceBirth: phaseOffset ? birth : now,
          motionCursor: motion,
          motionEnd: motion + (rom(record + 7) - 2) * 3,
          sizeCursor: 0,
          lifetime,
        };
        const effectId = phaseOffset
          ? sourceLoopPhaseEffectId(Math.round((latePhase / rom(28)) * (rom(27) - 1)), effects)
          : effects.sourceSimpleLoop.id;
        slot.id = native.SpawnParticleEffect(
          effectId,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          slot.sourceBirth + lifetime - now,
          false,
        );
        source.pool.residents.set(index, slot);
        p.residentEnd = Math.max(p.residentEnd, free + 1);
      }
    }
    p.next++;
    if (p.next >= count) {
      p.next = 0;
      p.cycle++;
    }
  }
  source.pool.programs.set(pi, p);
  const so = rom(7),
    sc = rom(8);
  for (let j = 0; j < p.residentEnd; j++) {
    const previous = source.pool.residents.get(pi * ABI.maxResidents + j);
    if (!previous.id) continue;
    const slot = { ...previous },
      age = (now - slot.sourceBirth) / slot.lifetime;
    while (slot.motionCursor < slot.motionEnd && age >= rom(slot.motionCursor + 3)) slot.motionCursor += 3;
    while (slot.sizeCursor < sc - 2 && age >= rom(so + (slot.sizeCursor + 1) * 5)) slot.sizeCursor++;
    if (slot.motionCursor !== previous.motionCursor || slot.sizeCursor !== previous.sizeCursor)
      source.pool.residents.set(pi * ABI.maxResidents + j, slot);
  }
  return true;
};
const moveSimpleLoopResidents = (
  source: SimpleLoopSource,
  pi: number,
  now: number,
  residentEnd: number,
  lane: number,
  effectSize: number,
  wToH: number,
  project: typeof projectSourceViewBillboard,
) => {
  const frame = {
    cameraY: rom(16),
    cameraZ: rom(17),
    sinPitch: rom(18),
    cosPitch: rom(19),
    scaleX: rom(20),
    scaleY: rom(21),
    offsetY: rom(22),
    expandX: rom(24),
    expandY: rom(25),
  };
  const emitterX = lane * rom(23),
    verticalScale = (effectSize * wToH) / rom(26),
    so = rom(7),
    sc = rom(8),
    firstSizeTime = rom(so),
    lastSizeTime = rom(so + (sc - 1) * 5);
  for (let j = 0; j < residentEnd; j++) {
    const index = pi * ABI.maxResidents + j;
    if (!source.pool.residents.get(index).id) continue;
    const slot = source.pool.residents.get(index),
      phase = (now - slot.sourceBirth) / slot.lifetime,
      a = slot.motionCursor,
      b = a + 3,
      fromTime = rom(a),
      q = Math.max(0, Math.min(1, (phase - fromTime) / (rom(b) - fromTime)));
    const wy = Math.lerp(rom(a + 1), rom(b + 1), q),
      wz = Math.lerp(rom(a + 2), rom(b + 2), q),
      s = so + slot.sizeCursor * 5,
      dt = phase - rom(s);
    let sizeValue = Math.max(0, ((rom(s + 1) * dt + rom(s + 2)) * dt + rom(s + 3)) * dt + rom(s + 4));
    if (phase <= firstSizeTime) sizeValue = Math.max(0, rom(so + 4));
    if (phase >= lastSizeTime) sizeValue = Math.max(0, rom(so + (sc - 1) * 5 + 4));
    const wx = emitterX + rom(slot.record + 3) + slot.birthX;
    const point = project(
      wx,
      wy,
      wz,
      rom(slot.record + 4) * sizeValue,
      rom(slot.record + 5) * sizeValue,
      frame,
    );
    const cx = lane + (point.x - lane) * effectSize,
      cy = 1 + (point.y - 1) * verticalScale,
      hw = point.halfWidth * effectSize,
      hh = point.halfHeight * verticalScale;
    native.MoveParticleEffect(slot.id, cx - hw, cy + hh, cx - hw, cy - hh, cx + hw, cy - hh, cx + hw, cy + hh);
  }
};

/** Parallel sampling only reads shared state. Local0 follows the current emitter. */
export const moveSimpleLoopSource = (source: SimpleLoopSource, owner: number, now: number, lane: number, effectSize: number, wToH: number) => {
  let pi = -1;
  for (let i = 0; i < source.programCount; i++) {
    if (source.pool.programs.get(i).owner !== owner + 1) continue;
    pi = i;
    break;
  }
  if (pi < 0) return;
  if (rom(16) === 0 && rom(17) === 0 && rom(18) === 0 && rom(19) === 1)
    moveSimpleLoopResidents(source, pi, now, source.pool.programs.get(pi).residentEnd, lane, effectSize, wToH, projectSourceCameraBillboard);
  else moveSimpleLoopResidents(source, pi, now, source.pool.programs.get(pi).residentEnd, lane, effectSize, wToH, projectSourceViewBillboard);
};


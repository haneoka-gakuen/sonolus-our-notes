import { nativeEffectPlaneQuad } from "./nativeEffects.js";
import { nativeStage } from "./lane.js";
import { simpleConnectWallGain, standardConnectWallGain } from "./connectWallEnvelope.generated.js";
import { CONNECT_WALL_LEVEL_COUNT, CONNECT_WALL_POOL } from "./connectWallContract.js";
import { connectWallDrawRange, connectWallDrawAlpha } from "./connectWallDraw.generated.js";
import { connectFrameDrawGain, connectFrameDrawAlpha, connectFrameDrawRange } from "./connectFrameDraw.generated.js";
import {
  CONNECT_FRAME_DRAW_GEOMETRY,
  CONNECT_FRAME_DRAW_RANGES,
  CONNECT_FRAME_DRAW_PIECES,
} from "./connectWallDrawContract.js";

// Draw stores wall/frame radiance; particle fallback stores instance/quantized level.
type Group = { head: number; lane: number; size: number; wall: number; frame: number };
type Birth = { next: number; time: number };
type Memory<T> = { get(index: number): Readonly<T>; set(index: number, value: Readonly<T>): void };
declare const Tuple: (count: number, definition: unknown) => unknown;
declare const levelMemory: <T>(definition: unknown) => Memory<T>;
declare const native: {
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
  DestroyParticleEffect(id: number): number;
  Draw(
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    z1: number,
    a: number,
    z2: number,
    z3: number,
    z4: number,
  ): void;
};
const GROUP_COUNT = CONNECT_WALL_POOL.groupCount;
const BIRTH_COUNT = CONNECT_WALL_POOL.birthCount;
const groups = levelMemory<Group>(
  Tuple(GROUP_COUNT, {
    head: Number,
    lane: Number,
    size: Number,
    wall: Number,
    frame: Number,
  }),
);
// A positive link is slot + 1, -1 ends a live chain, and 0 marks a free slot.
const births = levelMemory<Birth>(Tuple(BIRTH_COUNT, { next: Number, time: Number }));

export const clearConnectWallAggregate = (drawProfile: number) => {
  for (let i = 0; i < GROUP_COUNT; i++) {
    const group = groups.get(i);
    if (drawProfile < 0 && group.wall) native.DestroyParticleEffect(group.wall);
    groups.set(i, { ...group, head: 0, wall: 0, frame: 0 });
  }
  for (let i = 0; i < BIRTH_COUNT; i++) births.set(i, { next: 0, time: 0 });
};

const wallLevel = (energy: number) =>
  energy >= 0.0078125
    ? Math.max(1, Math.min(CONNECT_WALL_LEVEL_COUNT - 1, Math.round(Math.log(energy) * 8.656170245333781 + 37)))
    : 0;

const updateGroup = (
  index: number,
  now: number,
  baseEffect: number,
  effectSize: number,
  wToH: number,
  drawProfile: number,
  frameEnabled: boolean,
  simple: boolean,
) => {
  const group = groups.get(index);
  if (!group.head) return;
  let energy = 0,
    frameEnergy = 0,
    head = group.head,
    previous = -1,
    entry = head;
  while (entry > 0) {
    const i = entry - 1;
    const birth = births.get(i);
    const next = birth.next;
    const age = now - birth.time;
    if (age >= (frameEnabled ? 5 / 12 : simple ? 0.225 : 1 / 3)) {
      if (previous < 0) head = next > 0 ? next : 0;
      else births.set(previous, { ...births.get(previous), next });
      births.set(i, { next: 0, time: 0 });
    } else {
      previous = i;
      energy += simple ? simpleConnectWallGain(age) : standardConnectWallGain(age);
      if (frameEnabled) frameEnergy += connectFrameDrawGain(drawProfile, age);
    }
    entry = next;
  }
  if (drawProfile >= 0) {
    groups.set(index, { ...group, head, wall: energy, frame: frameEnergy });
    return;
  }
  const level = wallLevel(energy);
  if (level === group.frame && (level === 0 || group.wall)) {
    if (head !== group.head) groups.set(index, { ...group, head });
    return;
  }
  if (group.wall) native.DestroyParticleEffect(group.wall);
  let instance = 0;
  if (level) {
    const worldWidth = (group.size * nativeStage.laneWidth) / 6;
    const widthCorrection = (1 - 0.15 / worldWidth) / (1 - 0.15 / (nativeStage.laneWidth / 3));
    const q = nativeEffectPlaneQuad(1, group.lane, group.size * widthCorrection, effectSize, wToH);
    instance = native.SpawnParticleEffect(baseEffect + level, q.x1, q.y1, q.x2, q.y2, q.x3, q.y3, q.x4, q.y4, 1, true);
  }
  groups.set(index, { ...group, head, wall: instance, frame: level });
};

export const admitConnectWall = (
  now: number,
  birth: number,
  lane: number,
  size: number,
  simple: boolean,
  baseEffect: number,
  effectSize: number,
  wToH: number,
  refresh: boolean,
  drawProfile: number,
  frameEnabled: boolean,
) => {
  if (now - birth >= (frameEnabled ? 5 / 12 : simple ? 0.225 : 1 / 3)) return true;
  let groupIndex = -1,
    freeGroup = -1,
    freeBirth = -1;
  for (let i = 0; i < GROUP_COUNT; i++) {
    const g = groups.get(i);
    if (g.head && g.lane === lane && g.size === size) groupIndex = i;
    if (!g.head && freeGroup < 0) freeGroup = i;
  }
  for (let i = 0; i < BIRTH_COUNT; i++) if (!births.get(i).next && freeBirth < 0) freeBirth = i;
  if (groupIndex < 0) groupIndex = freeGroup;
  if (groupIndex < 0 || freeBirth < 0) return false;
  const previous = groups.get(groupIndex);
  births.set(freeBirth, { next: previous.head || -1, time: birth });
  if (!previous.head)
    groups.set(groupIndex, {
      head: freeBirth + 1,
      lane,
      size,
      wall: 0,
      frame: 0,
    });
  else groups.set(groupIndex, { ...previous, head: freeBirth + 1 });
  if (refresh) updateGroup(groupIndex, now, baseEffect, effectSize, wToH, drawProfile, frameEnabled, simple);
  return true;
};

export const updateConnectWallAggregate = (
  now: number,
  skip: boolean,
  baseEffect: number,
  effectSize: number,
  wToH: number,
  drawProfile: number,
  frameEnabled: boolean,
  simple: boolean,
) => {
  if (skip) {
    clearConnectWallAggregate(drawProfile);
    return;
  }
  for (let i = 0; i < GROUP_COUNT; i++) updateGroup(i, now, baseEffect, effectSize, wToH, drawProfile, frameEnabled, simple);
};

export const drawConnectWallAggregate = (
  profile: number,
  baseSprite: number,
  frameSprite: number,
  effectSize: number,
  wToH: number,
) => {
  if (profile < 0) return;
  for (let i = 0; i < GROUP_COUNT; i++) {
    const group = groups.get(i);
    if (!group.head) continue;
    if (group.wall > 0) {
      const range = connectWallDrawRange(group.wall);
      const alpha = connectWallDrawAlpha(profile, range, group.wall);
      const worldWidth = (group.size * nativeStage.laneWidth) / 6;
      const correction = (1 - 0.15 / worldWidth) / (1 - 0.15 / (nativeStage.laneWidth / 3));
      const q = nativeEffectPlaneQuad(1, group.lane, group.size * correction, effectSize, wToH);
      const sprite = baseSprite + profile * 18 + range * 2;
      if (range > 0) native.Draw(sprite, q.x1, q.y1, q.x2, q.y2, q.x3, q.y3, q.x4, q.y4, 2000, 1, 0, 0, 0);
      if (alpha > 0) native.Draw(sprite + 1, q.x1, q.y1, q.x2, q.y2, q.x3, q.y3, q.x4, q.y4, 2000.0001, alpha, 0, 0, 0);
    }
    if (frameSprite < 0 || group.frame <= 0) continue;
    const range = connectFrameDrawRange(profile, group.frame);
    const alpha = connectFrameDrawAlpha(profile, range, group.frame);
    for (let piece = 0; piece < CONNECT_FRAME_DRAW_PIECES; piece++) {
      const geometry = CONNECT_FRAME_DRAW_GEOMETRY;
      const capHalfWidth = profile === 1 ? geometry.lightCapHalfWidth : geometry.capHalfWidth;
      const middleBoundary = profile === 1 ? geometry.lightMiddleBoundary : geometry.middleBoundary;
      const size =
        piece === 1 ? (geometry.edgeCenterScale * group.size - capHalfWidth) / middleBoundary : geometry.referenceSize;
      const lane =
        group.lane + (piece - 1) * geometry.edgeCenterScale * (group.size - geometry.referenceSize) * effectSize;
      const q = nativeEffectPlaneQuad(3, lane, size, effectSize, wToH);
      const sprite =
        frameSprite + ((profile * CONNECT_FRAME_DRAW_RANGES + range) * CONNECT_FRAME_DRAW_PIECES + piece) * 2;
      if (range > 0) native.Draw(sprite, q.x1, q.y1, q.x2, q.y2, q.x3, q.y3, q.x4, q.y4, 2000.0002, 1, 0, 0, 0);
      if (alpha > 0) native.Draw(sprite + 1, q.x1, q.y1, q.x2, q.y2, q.x3, q.y3, q.x4, q.y4, 2000.0003, alpha, 0, 0, 0);
    }
  }
};

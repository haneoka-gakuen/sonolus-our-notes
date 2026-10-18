import { SIMPLE_LOOP_WORLD_ROM as ABI } from "./simpleLoopWorldRomAbi.js";
import {
  createSimpleLoopSource,
  simpleLoopSourceMemory,
  releaseSimpleLoopSource as release,
  retireSimpleLoopSources as retire,
  updateSimpleLoopSource as update,
  moveSimpleLoopSource as move,
  type SimpleLoopSourcePool,
} from "./simpleLoopSourceFactory.js";
import type { SimpleLoopPhaseEffects } from "./simpleLoopPhaseEffects.js";
export { validSimpleLoopRom, hasSimpleLoopSourceEffects } from "./simpleLoopSourceFactory.js";

declare const levelMemory: (definition: unknown) => SimpleLoopSourcePool;
const source = createSimpleLoopSource(levelMemory(simpleLoopSourceMemory(ABI.programCount)), ABI.programCount);
export const releaseSimpleLoopSource = (owner: number, now: number, forget: boolean) => release(source, owner, now, forget);
export const retireSimpleLoopSources = (now: number, skip: boolean) => retire(source, now, skip);
export const updateSimpleLoopSource = (owner: number, now: number, lane: number, size: number, effects: SimpleLoopPhaseEffects, endTime: number) => update(source, owner, now, lane, size, effects, endTime);
export const moveSimpleLoopSource = (owner: number, now: number, lane: number, effectSize: number, wToH: number) => move(source, owner, now, lane, effectSize, wToH);

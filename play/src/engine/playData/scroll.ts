import { archetypes } from "./archetypes/index.js";
export const currentScrollTime = (ref: number): number => archetypes.ScrollClock.sharedMemory.get(ref).current;

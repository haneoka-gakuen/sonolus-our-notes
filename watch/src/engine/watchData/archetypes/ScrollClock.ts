import { scrollClockSchema, readScrollTime } from "../../../../../shared/src/engine/data/scroll.js";
import { archetypes } from "./index.js";
export class ScrollClock extends Archetype {
  import = this.defineImport(scrollClockSchema);
  sharedMemory = this.defineSharedMemory({ current: Number });
  updateSequentialOrder = -10;
  preprocess() { this.sharedMemory.current = this.import.value; }
  updateSequential() { this.sharedMemory.current = readScrollTime(this.info.index, time.now, index => archetypes.ScrollClock.import.get(index)); }
  spawnTime(): number { return this.import.head === 1 ? -999999999 : 999999999; }
  despawnTime(): number { return 999999999; }
}

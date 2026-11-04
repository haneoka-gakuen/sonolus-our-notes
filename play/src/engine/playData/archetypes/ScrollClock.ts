import { scrollClockSchema } from "../../../../../shared/src/engine/data/scroll.js";
import { archetypes } from "./index.js";
export class ScrollClock extends Archetype {
  import = this.defineImport(scrollClockSchema);
  sharedMemory = this.defineSharedMemory({ current: Number });
  cursor = this.entityMemory(Number);
  previousTime = this.entityMemory(Number);
  updateSequentialOrder = -10;
  preprocess() {
    this.sharedMemory.current = this.import.value;
    this.cursor = this.info.index;
    this.previousTime = -999999999;
  }
  updateSequential() {
    let cursor = time.now < this.previousTime ? this.info.index : this.cursor;
    while (archetypes.ScrollClock.import.get(cursor).next > 0) {
      const next = archetypes.ScrollClock.import.get(cursor).next;
      if (archetypes.ScrollClock.import.get(next).at > time.now) break;
      cursor = next;
    }
    this.cursor = cursor;
    this.previousTime = time.now;
    const segment = archetypes.ScrollClock.import.get(cursor);
    this.sharedMemory.current = time.now < segment.at ? time.now : segment.value + (time.now - segment.at) * segment.scale;
  }
  spawnOrder(): number { return -999999999; }
  shouldSpawn() { return this.import.head === 1; }
}

import { forcedScrollDuration } from "../../../../../shared/src/engine/data/scroll.js";
import { currentScrollTime } from "../scroll.js";
import { approach } from "../../../../../shared/src/engine/data/note.js";
import { simLine } from "../../../../../shared/src/engine/data/simLine.js";
import { options } from "../../configuration/options.js";
import { note } from "../note.js";
import { getZ, layer, skin } from "../skin.js";
import { archetypes } from "./index.js";

export class SimLine extends Archetype {
  import = this.defineImport({
    aRef: { name: "a", type: Number },
    bRef: { name: "b", type: Number },
  });

  targetTime = this.entityMemory(Number);

  visualTime = this.entityMemory(Range);
  hiddenTime = this.entityMemory(Number);

  initialized = this.entityMemory(Boolean);

  left = this.entityMemory(Number);
  right = this.entityMemory(Number);
  z = this.entityMemory(Number);

  preprocess() {
    if (!options.simLineEnabled) return;

    this.targetTime = bpmChanges.at(this.aImport.beat).time;

    this.visualTime.copyFrom(Range.l.mul(note.duration).add(timeScaleChanges.at(this.targetTime).scaledTime));
  }

  spawnTime(): number {
    return this.customScroll ? Math.min(this.aImport.scrollSpawn, this.bImport.scrollSpawn) : this.visualTime.min;
  }

  despawnTime(): number {
    return replay.isReplay
      ? Math.min(this.visualTime.max, this.aSharedMemory.despawnTime, this.bSharedMemory.despawnTime)
      : this.visualTime.max;
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    this.globalInitialize();
  }

  updateParallel() {
    if (this.customScroll) { this.renderScroll(); return; }
    if (options.hidden > 0 && time.scaled > this.hiddenTime) return;
    if (note.isCovered(this.visualTime.max)) return;

    this.render();
  }

  get aImport() {
    return archetypes.NormalTapNote.import.get(this.import.aRef);
  }

  get aSharedMemory() {
    return archetypes.NormalTapNote.sharedMemory.get(this.import.aRef);
  }

  get bImport() {
    return archetypes.NormalTapNote.import.get(this.import.bRef);
  }

  get bSharedMemory() {
    return archetypes.NormalTapNote.sharedMemory.get(this.import.bRef);
  }

  globalInitialize() {
    if (options.hidden > 0) this.hiddenTime = this.visualTime.max - note.duration * options.hidden;

    this.left = Math.min(this.aImport.lane, this.bImport.lane);
    this.right = Math.max(this.aImport.lane, this.bImport.lane);

    this.z = getZ(layer.simLine, this.targetTime, this.left);
  }

  get customScroll(): boolean { return this.aImport.scrollRef > 0 && this.bImport.scrollRef > 0; }
  renderScroll() {
    const durationA = this.aImport.forceNoteSpeed > 0 ? forcedScrollDuration(this.aImport.forceNoteSpeed) : note.duration;
    const durationB = this.bImport.forceNoteSpeed > 0 ? forcedScrollDuration(this.bImport.forceNoteSpeed) : note.duration;
    const a = this.aImport.scrollTarget - currentScrollTime(this.aImport.scrollRef);
    const b = this.bImport.scrollTarget - currentScrollTime(this.bImport.scrollRef);
    const cover = options.laneCover > 0 ? note.coverDuration / note.duration : 1.1;
    if (a < 0 || b < 0 || a > durationA * cover || b > durationB * cover) return;
    if (options.hidden > 0 && (a < durationA * options.hidden || b < durationB * options.hidden)) return;
    let left = this.aImport.lane, right = this.bImport.lane;
    let yLeft = approach(-durationA, 0, -a), yRight = approach(-durationB, 0, -b);
    if (left > right) {
      const x = left, y = yLeft; left = right; yLeft = yRight; right = x; yRight = y;
    }
    if (skin.sprites.simLine.exists) skin.sprites.simLine.draw({
      x1: left * yLeft, y1: yLeft + simLine.h,
      x2: left * yLeft, y2: yLeft - simLine.h,
      x3: right * yRight, y3: yRight - simLine.h,
      x4: right * yRight, y4: yRight + simLine.h,
    }, [this.z], 1);
  }
  render() {
    const y = approach(this.visualTime.min, this.visualTime.max, time.scaled);

    // LivePairNoteLineView.SetProgress preserves the serialized Y size;
    // only its centre and X size follow view progress.
    const layout = new Rect({
      l: this.left * y,
      r: this.right * y,
      b: y + simLine.h,
      t: y - simLine.h,
    });

    if (!skin.sprites.simLine.exists) return;

    skin.sprites.simLine.draw(layout, [this.z], 1);
  }
}

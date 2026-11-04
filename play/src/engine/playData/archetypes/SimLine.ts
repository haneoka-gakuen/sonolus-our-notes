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

  spawnTime = this.entityMemory(Number);

  left = this.entityMemory(Number);
  right = this.entityMemory(Number);
  z = this.entityMemory(Number);

  y = this.entityMemory(Number);

  preprocess() {
    if (!options.simLineEnabled) return;

    this.targetTime = bpmChanges.at(this.aImport.beat).time;

    this.visualTime.copyFrom(Range.l.mul(note.duration).add(timeScaleChanges.at(this.targetTime).scaledTime));

    this.spawnTime = this.customScroll ? Math.min(this.aImport.scrollSpawn, this.bImport.scrollSpawn) : this.visualTime.min;
  }

  spawnOrder(): number {
    if (!options.simLineEnabled) return 999999;

    return 1000 + this.spawnTime;
  }

  shouldSpawn() {
    if (!options.simLineEnabled) return false;

    return time.scaled >= this.spawnTime;
  }

  initialize() {
    if (options.hidden > 0) this.hiddenTime = this.visualTime.max - note.duration * options.hidden;

    this.left = Math.min(this.aImport.lane, this.bImport.lane);
    this.right = Math.max(this.aImport.lane, this.bImport.lane);

    this.z = getZ(layer.simLine, this.targetTime, this.left);
  }

  updateParallel() {
    if (this.customScroll) {
      if (time.now > Math.max(this.aImport.originalTimeMs, this.bImport.originalTimeMs) / 1000 || this.aInfo.state === EntityState.Despawned || this.bInfo.state === EntityState.Despawned) this.despawn = true;
      if (!this.despawn) this.renderScroll();
      return;
    }
    if (
      time.scaled > this.visualTime.max ||
      this.aInfo.state === EntityState.Despawned ||
      this.bInfo.state === EntityState.Despawned
    )
      this.despawn = true;
    if (this.despawn) return;

    if (options.hidden > 0 && time.scaled > this.hiddenTime) return;
    if (note.isCovered(this.visualTime.max)) return;

    this.render();
  }

  get aImport() {
    return archetypes.NormalTapNote.import.get(this.import.aRef);
  }

  get aInfo() {
    return entityInfos.get(this.import.aRef);
  }

  get bImport() {
    return archetypes.NormalTapNote.import.get(this.import.bRef);
  }

  get bInfo() {
    return entityInfos.get(this.import.bRef);
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
    this.y = approach(this.visualTime.min, this.visualTime.max, time.scaled);

    // SetProgress scales the pair-line X size and interpolates its centre,
    // but never scales SpriteRenderer.size.y. Keep the converted 0.025
    // Unity-unit height fixed even near the horizon.
    const layout = new Rect({
      l: this.left * this.y,
      r: this.right * this.y,
      b: this.y + simLine.h,
      t: this.y - simLine.h,
    });

    if (!skin.sprites.simLine.exists) return;

    skin.sprites.simLine.draw(layout, [this.z], 1);
  }
}

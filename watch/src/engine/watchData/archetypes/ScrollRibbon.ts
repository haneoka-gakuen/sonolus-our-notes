import { scrollRibbonSchema } from "../../../../../shared/src/engine/data/scrollRibbon.js";
import { forcedScrollDuration } from "../../../../../shared/src/engine/data/scroll.js";
import { getNativeSlideSpriteId } from "../../../../../shared/src/engine/data/nativeSlideSkin.js";
import { approach } from "../../../../../shared/src/engine/data/note.js";
import { options } from "../../configuration/options.js";
import { currentScrollTime } from "../scroll.js";
import { note } from "../note.js";
import { getZ, layer, skin } from "../skin.js";
import { archetypes } from "./index.js";

export class ScrollRibbon extends Archetype {
  import = this.defineImport(scrollRibbonSchema);
  z = this.entityMemory(Number);
  viewDuration = this.entityMemory(Number);
  minimumDepth = this.entityMemory(Number);
  maximumDepth = this.entityMemory(Number);
  preprocess() {
    if (options.mirror) {
      const leftA = this.import.aLeft, leftB = this.import.bLeft;
      this.import.aLeft = -this.import.aRight; this.import.aRight = -leftA;
      this.import.bLeft = -this.import.bRight; this.import.bRight = -leftB;
    }
    this.z = getZ(layer.note.connector, this.import.lineEnd, this.import.aLeft);
    this.viewDuration = this.import.forceNoteSpeed > 0 ? forcedScrollDuration(this.import.forceNoteSpeed) : note.duration;
    this.minimumDepth = this.viewDuration * (options.hidden > 0 ? options.hidden : -.16);
    this.maximumDepth = this.viewDuration * (options.laneCover > 0 ? note.coverDuration / note.duration : 1.1);
  }
  updateParallel() {
    if (time.now >= this.import.bTime) return;
    const duration = this.viewDuration;
    const currentA = Math.lerp(currentScrollTime(this.import.aClockL), currentScrollTime(this.import.aClockR), this.import.aRatio);
    const currentB = Math.lerp(currentScrollTime(this.import.bClockL), currentScrollTime(this.import.bClockR), this.import.bRatio);
    let a = this.import.aValue - currentA, b = this.import.bValue - currentB;
    let lA = this.import.aLeft, rA = this.import.aRight, lB = this.import.bLeft, rB = this.import.bRight;
    let realA = this.import.aTime, realB = this.import.bTime;
    if (time.now > realA) {
      const progress = Math.unlerpClamped(realA, realB, time.now);
      lA = Math.lerp(lA, lB, progress); rA = Math.lerp(rA, rB, progress); a = 0; realA = time.now;
    }
    const minimum = this.minimumDepth, maximum = this.maximumDepth;
    if (a === b || Math.max(a, b) < minimum || Math.min(a, b) > maximum) return;
    const begin = Math.clamp(a, minimum, maximum), end = Math.clamp(b, minimum, maximum);
    const ratioA = (begin - a) / (b - a), ratioB = (end - a) / (b - a);
    const leftA = Math.lerp(lA, lB, ratioA), rightA = Math.lerp(rA, rB, ratioA);
    const leftB = Math.lerp(lA, lB, ratioB), rightB = Math.lerp(rA, rB, ratioB);
    const yA = approach(-duration, 0, -begin), yB = approach(-duration, 0, -end);
    const forward = begin < end;
    const layout = {
      x1: forward ? leftA * yA : leftB * yB, y1: forward ? yA : yB,
      x2: forward ? leftB * yB : leftA * yA, y2: forward ? yB : yA,
      x3: forward ? rightB * yB : rightA * yA, y3: forward ? yB : yA,
      x4: forward ? rightA * yA : rightB * yB, y4: forward ? yA : yB,
    };
    let alpha = options.connectorAlpha;
    const progress = Math.unlerpClamped(this.import.lineStart, this.import.lineEnd,
      Math.lerp(realA, realB, (ratioA + ratioB) / 2));
    let id = getNativeSlideSpriteId(skin.sprites, progress, this.visual);
    if (this.import.guide) {
      id = this.import.critical ? skin.sprites.criticalSlideConnectorNormal.id : skin.sprites.normalSlideConnectorNormal.id;
      const t = Math.clamp((time.now - this.import.lineEnd + .1) / .1, 0, 1);
      const t2 = t * t, t3 = t2 * t;
      alpha *= Math.clamp(2 * t3 - 3 * t2 + 1 + (t3 - 2 * t2 + t) * -.9501662254333496 + (t3 - t2) * -.8831168413162231, 0, 1);
    }
    if (skin.sprites.exists(id)) skin.sprites.draw(id, layout, [this.z], alpha);
  }
  spawnTime(): number { return this.import.spawn; }
  despawnTime(): number { return this.import.bTime; }
  get visual(): number {
    if (this.import.guide) return 0;
    if (!replay.isReplay) return time.now >= this.import.lineStart ? 2 : 0;
    const start = streams.getPreviousKey(this.import.start, time.now);
    if (start < time.now && time.now < streams.getValue(this.import.start, start)) return 2;
    return time.now >= this.import.lineStart + archetypes.NormalSlideStartNote.windows.good.max + input.offset ? 1 : 0;
  }
}

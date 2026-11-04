import { laneCoverVisibleFraction } from "../../../../../../shared/src/engine/data/laneCover.js";
import { forcedScrollDuration } from "../../../../../../shared/src/engine/data/scroll.js";
import { currentScrollTime } from "../../scroll.js";
import { note } from "../../note.js";
import { EngineArchetypeDataName } from "@sonolus/core";
import { options } from "../../../configuration/options.js";
import { chartExtent } from "../../chartExtent.js";

export abstract class Note extends Archetype {
  hasInput = true;

  abstract leniency: number;

  import = this.defineImport({
    scrollViewDuration: { name: "scrollViewDuration", type: Number },
    scrollCoverDuration: { name: "scrollCoverDuration", type: Number },
    scrollRef: { name: "scrollRef", type: Number },
    scrollTarget: { name: "scrollTarget", type: Number },
    scrollSpawn: { name: "scrollSpawn", type: Number },
    forceNoteSpeed: { name: "forceNoteSpeed", type: Number },
    beat: { name: EngineArchetypeDataName.Beat, type: Number },
    lane: { name: "lane", type: Number },
    size: { name: "size", type: Number },
    operateType: { name: "operateType", type: Number },
    judgementType: { name: "judgementType", type: Number },
    originalDirection: { name: "originalDirection", type: Number },
    originalTick: { name: "originalTick", type: Number },
    originalTimeMs: { name: "originalTimeMs", type: Number },
    originalPos: { name: "originalPos", type: Number },
    originalSize: { name: "originalSize", type: Number },
    originalCritical: { name: "originalCritical", type: Number },
    originalVisible: { name: "originalVisible", type: Number },
    originalLineId: { name: "originalLineId", type: Number },
    originalLineIndex: { name: "originalLineIndex", type: Number },
    originalEaseL: { name: "originalEaseL", type: Number },
    originalEaseR: { name: "originalEaseR", type: Number },
  });

  sharedMemory = this.defineSharedMemory({
    lastActiveTime: Number,
    exportStartTime: Number,
    heldSoundCandidateTime: Number,
  });

  get scrollNow(): number { return this.import.scrollRef > 0 ? currentScrollTime(this.import.scrollRef) : time.scaled; }
  get scrollTarget(): number { return this.import.scrollTarget; }
  get scrollDuration(): number { return this.import.scrollViewDuration; }
  get scrollAlpha(): number { return this.import.scrollRef > 0 ? Math.clamp(1 + (this.scrollTarget - this.scrollNow) / (this.scrollDuration * .16), 0, 1) : 1; }
  get scrollCovered(): boolean { return options.laneCover > 0 && this.scrollTarget - this.scrollNow > this.import.scrollCoverDuration; }

  targetTime = this.entityMemory(Number);

  spawnTime = this.entityMemory(Number);

  hitbox = this.entityMemory(Rect);
  fullHitbox = this.entityMemory(Rect);

  preprocess() {
    this.sharedMemory.lastActiveTime = -1000;
    this.sharedMemory.exportStartTime = -1000;
    this.sharedMemory.heldSoundCandidateTime = -1000;

    this.targetTime = bpmChanges.at(this.import.beat).time;
    this.import.scrollTarget = this.import.scrollRef > 0 ? this.import.scrollTarget : timeScaleChanges.at(this.targetTime).scaledTime;
    this.import.scrollViewDuration = this.import.forceNoteSpeed > 0 ? forcedScrollDuration(this.import.forceNoteSpeed) : note.duration;
    this.import.scrollCoverDuration = this.scrollDuration * laneCoverVisibleFraction(options.laneCover);
    chartExtent.lastBeat = Math.max(chartExtent.lastBeat, this.import.beat);

    if (options.mirror) this.import.lane *= -1;
  }

  spawnOrder() {
    return 1000 + this.spawnTime;
  }

  shouldSpawn() {
    return time.scaled >= this.spawnTime;
  }

  updateSequentialOrder = 2;
}

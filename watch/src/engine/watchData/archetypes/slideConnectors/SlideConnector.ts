import {
  getNativeSlideSpriteId,
  NATIVE_SLIDE_GRADIENT_CELLS,
} from "../../../../../../shared/src/engine/data/nativeSlideSkin.js";
import { EaseType, ease } from "../../../../../../shared/src/engine/data/EaseType.js";
import { approach } from "../../../../../../shared/src/engine/data/note.js";
import { options } from "../../../configuration/options.js";
import { note } from "../../note.js";
import { drawClippedRibbon, getZ, layer, skin } from "../../skin.js";
import { SlideStartNote } from "../notes/flatNotes/slideStartNotes/SlideStartNote.js";

export enum VisualType {
  Waiting = 0,
  NotActivated = 1,
  Activated = 2,
}

export abstract class SlideConnector extends Archetype {
  nativeLine = false;
  abstract sprites: {
    missed: SkinSprite;
    normal: SkinSprite;
    pressed: SkinSprite;
  };

  abstract slideStartNote: SlideStartNote;

  import = this.defineImport({
    suppressDraw: { name: "suppressDraw", type: Number },
    startRef: { name: "start", type: Number },
    endRef: { name: "end", type: Number },
    headRef: { name: "head", type: Number },
    tailRef: { name: "tail", type: Number },
    ease: { name: "ease", type: DataType<EaseType> },
    easeL: { name: "easeL", type: DataType<EaseType> },
    easeR: { name: "easeR", type: DataType<EaseType> },
  });

  initialized = this.entityMemory(Boolean);

  start = this.entityMemory({
    time: Number,
    scaledTime: Number,
  });
  end = this.entityMemory({
    time: Number,
    scaledTime: Number,
  });
  head = this.entityMemory({
    time: Number,
    lane: Number,
    scaledTime: Number,

    l: Number,
    r: Number,
  });
  tail = this.entityMemory({
    time: Number,
    lane: Number,
    scaledTime: Number,

    l: Number,
    r: Number,
  });

  visualTime = this.entityMemory({
    min: Number,
  });
  hiddenTime = this.entityMemory(Number);

  z = this.entityMemory(Number);

  visual = this.entityMemory(DataType<VisualType>);

  preprocess() {
    this.import.suppressDraw = this.headImport.scrollRef > 0 || this.tailImport.scrollRef > 0 ? 1 : 0;
    this.end.time = bpmChanges.at(this.endImport.beat).time;

    this.head.time = bpmChanges.at(this.headImport.beat).time;
    this.head.scaledTime = timeScaleChanges.at(this.head.time).scaledTime;

    this.tail.time = bpmChanges.at(this.tailImport.beat).time;
    this.tail.scaledTime = timeScaleChanges.at(this.tail.time).scaledTime;

    this.visualTime.min = this.head.scaledTime - note.duration;
  }

  spawnTime() {
    return this.visualTime.min;
  }

  despawnTime() {
    return this.tail.scaledTime;
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    this.globalInitialize();
  }

  updateParallel() {
    this.updateVisualType();

    this.renderConnector();
  }

  get startImport() {
    return this.slideStartNote.import.get(this.import.startRef);
  }

  get endImport() {
    return this.slideStartNote.import.get(this.import.endRef);
  }

  get headImport() {
    return this.slideStartNote.import.get(this.import.headRef);
  }

  get tailImport() {
    return this.slideStartNote.import.get(this.import.tailRef);
  }

  globalInitialize() {
    this.start.time = bpmChanges.at(this.startImport.beat).time;
    this.start.scaledTime = timeScaleChanges.at(this.start.time).scaledTime;

    this.end.scaledTime = timeScaleChanges.at(this.end.time).scaledTime;

    this.head.lane = this.headImport.lane;
    this.head.l = this.head.lane - this.headImport.size;
    this.head.r = this.head.lane + this.headImport.size;

    this.tail.lane = this.tailImport.lane;
    this.tail.l = this.tail.lane - this.tailImport.size;
    this.tail.r = this.tail.lane + this.tailImport.size;

    if (options.hidden > 0) this.hiddenTime = this.tail.scaledTime - note.duration * options.hidden;

    this.z = getZ(layer.note.connector, this.start.time, this.startImport.lane);
  }

  updateVisualType() {
    if (!replay.isReplay) {
      this.visual = time.now >= this.start.time ? VisualType.Activated : VisualType.Waiting;
      return;
    }

    const startTime = streams.getPreviousKey(this.import.startRef, time.now);
    if (startTime < time.now) {
      const endTime = streams.getValue(this.import.startRef, startTime);
      if (time.now < endTime) {
        this.visual = VisualType.Activated;
        return;
      }
    }

    this.visual =
      time.now >= this.start.time + this.slideStartNote.windows.good.max + input.offset
        ? VisualType.NotActivated
        : VisualType.Waiting;
  }

  renderConnector() {
    if (this.import.suppressDraw) return;
    if (options.hidden > 0 && time.scaled > this.hiddenTime) return;

    const hiddenDuration = options.hidden > 0 ? note.duration * options.hidden : 0;

    const visibleTime = {
      min: Math.max(this.head.scaledTime, time.scaled + hiddenDuration),
      max: Math.min(this.tail.scaledTime, time.scaled + (options.laneCover > 0 ? note.coverDuration : note.duration)),
    };
    if (visibleTime.max <= visibleTime.min) return;

    if (!this.sprites.missed.exists || !this.sprites.normal.exists || !this.sprites.pressed.exists) return;

    const segmentCount = this.getSegmentCount(visibleTime.min, visibleTime.max);

    let scaledMin = visibleTime.min;
    const firstEdge = this.getEdgeBounds(scaledMin);
    let leftMin = firstEdge.l;
    let rightMin = firstEdge.r;
    let yMin = approach(scaledMin - note.duration, scaledMin, time.scaled);

    for (let i = 0; i < segmentCount; i++) {
      const scaledMax = Math.lerp(visibleTime.min, visibleTime.max, (i + 1) / segmentCount);
      const edgeMax = this.getEdgeBounds(scaledMax);
      const yMax = approach(scaledMax - note.duration, scaledMax, time.scaled);

      const layout = {
        x1: leftMin * yMin,
        x2: edgeMax.l * yMax,
        x3: edgeMax.r * yMax,
        x4: rightMin * yMin,
        y1: yMin,
        y2: yMax,
        y3: yMax,
        y4: yMin,
      };

      const a = this.getAlpha(this.start.scaledTime, this.end.scaledTime, scaledMin) * options.connectorAlpha;

      if (this.nativeLine) {
        const progress = Math.unlerpClamped(this.start.scaledTime, this.end.scaledTime, (scaledMin + scaledMax) / 2);
        const id = getNativeSlideSpriteId(skin.sprites.lineNormal0.id, progress, this.visual);
        if (skin.sprites.exists(id)) drawClippedRibbon(id, layout, [this.z], a);
      } else if (this.visual === VisualType.Activated) {
        drawClippedRibbon(this.sprites.pressed.id, layout, [this.z], a);
      } else if (this.visual === VisualType.NotActivated) {
        drawClippedRibbon(this.sprites.missed.id, layout, [this.z], a);
      } else {
        drawClippedRibbon(this.sprites.normal.id, layout, [this.z], a);
      }
      scaledMin = scaledMax;
      leftMin = edgeMax.l;
      rightMin = edgeMax.r;
      yMin = yMax;
    }
  }

  getSegmentCount(visibleMin: number, visibleMax: number) {
    const visibleSpan =
      Math.unlerpClamped(this.head.scaledTime, this.tail.scaledTime, visibleMax) -
      Math.unlerpClamped(this.head.scaledTime, this.tail.scaledTime, visibleMin);
    const edgeTravel = Math.abs(this.tail.l - this.head.l) + Math.abs(this.tail.r - this.head.r);
    const curveCost = (this.import.easeL === EaseType.Linear ? 0 : 4) + (this.import.easeR === EaseType.Linear ? 0 : 4);

    return Math.clamp(
      Math.ceil(
        Math.max(
          this.nativeLine ? visibleSpan * NATIVE_SLIDE_GRADIENT_CELLS : 2,
          2 + visibleSpan * (edgeTravel * 2 + curveCost),
        ),
      ),
      2,
      24,
    );
  }

  getAlpha(_a: number, _b: number, _x: number) {
    return 1;
  }

  getScale(scaledTime: number) {
    return this.ease(Math.unlerpClamped(this.head.scaledTime, this.tail.scaledTime, scaledTime));
  }

  getScaleL(scaledTime: number) {
    return this.easeL(Math.unlerpClamped(this.head.scaledTime, this.tail.scaledTime, scaledTime));
  }

  getScaleR(scaledTime: number) {
    return this.easeR(Math.unlerpClamped(this.head.scaledTime, this.tail.scaledTime, scaledTime));
  }

  getEdgeBounds(scaledTime: number) {
    let l = this.head.l, r = this.head.r;
    if (this.head.l !== this.tail.l || this.head.r !== this.tail.r) {
      const progress = Math.unlerpClamped(this.head.scaledTime, this.tail.scaledTime, scaledTime);
      const left = this.easeL(progress);
      const right = this.import.easeL === this.import.easeR ? left : this.easeR(progress);
      l = this.getL(left); r = this.getR(right);
    }
    return { l, r };
  }

  ease(s: number) {
    return ease(this.import.ease, s);
  }

  easeL(s: number) {
    return ease(this.import.easeL, s);
  }

  easeR(s: number) {
    return ease(this.import.easeR, s);
  }

  getLane(scale: number) {
    return Math.lerp(this.head.lane, this.tail.lane, scale);
  }

  getL(scale: number) {
    return Math.lerp(this.head.l, this.tail.l, scale);
  }

  getR(scale: number) {
    return Math.lerp(this.head.r, this.tail.r, scale);
  }
}

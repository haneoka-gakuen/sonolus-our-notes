import {
  validSimpleLoopRom,
  hasSimpleLoopSourceEffects,
  updateSimpleLoopSource,
  moveSimpleLoopSource,
  releaseSimpleLoopSource,
} from "../../../../../../../shared/src/engine/data/simpleLoopSource.js";
import { scaledScreen } from "../../../scaledScreen.js";
import { nativeEffectSpawnPlane } from "../../../../../../../shared/src/engine/data/nativeEffects.js";
import { stableHoldEffectWidthBucket } from "../../../../../../../shared/src/engine/data/stableHoldEffectWidthBucket.js";
import { options } from "../../../../configuration/options.js";
import { note } from "../../../note.js";
import { linearEffectLayout, particle } from "../../../particle.js";
import { SlideConnector, VisualType } from "../SlideConnector.js";
import { LOOP_FX_PARTS, moveLoopFx, spawnLoopFx } from "../../../hitFx.js";
import { heldSoundActivity } from "../../../sound.js";

export abstract class ActiveSlideConnector extends SlideConnector {
  override nativeLine = true;
  abstract effects: {
    circular: ParticleEffect;
    linear: ParticleEffect;
  };

  effectInstanceIds = this.entityMemory({
    circularScheduled: Boolean,
    linear: ParticleEffectInstanceId,
  });

  liveBounds = this.entityMemory({ l: Number, r: Number });

  heldAudioLinks = this.defineSharedMemory({ next: Number, start: Number, end: Number });

  // Resource selection and engine options are fixed for this entity's run.
  // Dynamic lane/width and the width-bucket restart remain per-frame.
  resources = this.entityMemory({
    circularEnabled: Boolean,
    linearEnabled: Boolean,
    loopWidthBucket: Number,
    sourceProgram: Boolean,
  });

  initialize() {
    super.initialize();

    this.resources.circularEnabled = options.noteEffectEnabled;
    this.resources.linearEnabled = options.noteEffectEnabled && this.effects.linear.exists;
    this.resources.loopWidthBucket = -1;
    this.loopLayoutIsFixed = this.head.l === this.tail.l && this.head.r === this.tail.r;
    this.resources.sourceProgram =
      particle.effects.sourceSimpleLoop.exists && validSimpleLoopRom() && hasSimpleLoopSourceEffects(particle.effects);
  }

  updateSequential() {
    super.updateSequential();
    if (time.now < this.head.time || time.now >= this.tail.time) return;
    if (time.scaled >= this.visualTime.min) {
      this.startSharedMemory.heldSoundCandidateTime = time.now;
      if (this.startSharedMemory.lastActiveTime === time.now) heldSoundActivity.active = true;
    }
    if (!this.resources.sourceProgram) return;
    this.updateVisualType();
    if (!this.resources.circularEnabled || this.visual !== VisualType.Activated) {
      releaseSimpleLoopSource(this.import.startRef, time.now, false);
      return;
    }
    const { l, r } = this.getEdgeBounds(time.scaled);
    if (
      !updateSimpleLoopSource(this.import.startRef, time.now, (l + r) / 2, (r - l) / 2, particle.effects, this.end.time)
    )
      this.resources.sourceProgram = false;
  }

  updateParallel() {
    if (time.now >= this.tail.time) {
      this.despawn = true;
      return;
    }

    if (time.scaled < this.visualTime.min) return;

    this.updateVisualType();

    this.renderConnector();

    if (time.now < this.head.time) return;
    const bounds = this.getEdgeBounds(time.scaled);
    this.liveBounds.l = bounds.l;
    this.liveBounds.r = bounds.r;

    if (this.visual === VisualType.Activated) {
      if (this.shouldPlayCircularEffect) {
        if (!this.effectInstanceIds.circularScheduled) this.spawnCircularEffect();

        this.updateCircularEffect();
      }

      if (this.shouldPlayLinearEffect) {
        if (!this.effectInstanceIds.linear) this.spawnLinearEffect();

        this.updateLinearEffect();
      }
    } else {
      if (this.shouldPlayCircularEffect && this.effectInstanceIds.circularScheduled) this.destroyCircularEffect();

      if (this.shouldPlayLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
    }
  }

  terminate() {
    if (this.shouldPlayCircularEffect && this.effectInstanceIds.circularScheduled) this.destroyCircularEffect();

    if (this.shouldPlayLinearEffect && this.effectInstanceIds.linear) this.destroyLinearEffect();
  }

  get shouldPlayCircularEffect() {
    return this.resources.circularEnabled;
  }

  get shouldPlayLinearEffect() {
    return this.resources.linearEnabled;
  }

  // effect001 hold loop: one looping instance per part, re-projected every frame.
  loopFx = this.entityMemory(Tuple(LOOP_FX_PARTS, ParticleEffectInstanceId));
  loopLayoutIsFixed = this.entityMemory(Boolean);

  spawnCircularEffect() {
    const { l, r } = this.liveBounds;
    this.resources.loopWidthBucket = stableHoldEffectWidthBucket((r - l) / 2);
    for (let order = 0; order < LOOP_FX_PARTS; order++) {
      const plane = nativeEffectSpawnPlane(order);
      if (plane === 0 && this.resources.sourceProgram) continue;
      this.loopFx.set(plane, spawnLoopFx(plane, (l + r) / 2, (r - l) / 2));
    }
    // Scheduling stays latched even when the selected pack omits plane 0.
    this.effectInstanceIds.circularScheduled = true;
  }

  updateCircularEffect() {
    const { l, r } = this.liveBounds;
    if (stableHoldEffectWidthBucket((r - l) / 2) !== this.resources.loopWidthBucket) {
      this.destroyCircularEffect();
      this.spawnCircularEffect();
    }
    if (!this.loopLayoutIsFixed)
      for (let i = 0; i < LOOP_FX_PARTS; i++) moveLoopFx(this.loopFx.get(i), i, (l + r) / 2, (r - l) / 2);
    if (this.resources.sourceProgram)
      moveSimpleLoopSource(this.import.startRef, time.now, (l + r) / 2, options.noteEffectSize, scaledScreen.wToH);
  }

  destroyCircularEffect() {
    for (let i = 0; i < LOOP_FX_PARTS; i++) {
      const instance = this.loopFx.get(i);
      if (instance) particle.effects.destroy(instance);
    }
    this.effectInstanceIds.circularScheduled = false;
  }

  spawnLinearEffect() {
    this.effectInstanceIds.linear = this.effects.linear.spawn(new Quad(), 1, true);
  }

  updateLinearEffect() {
    const { l, r } = this.liveBounds;
    const lane = (l + r) / 2;
    const size = (r - l) / 2;

    particle.effects.move(
      this.effectInstanceIds.linear,
      linearEffectLayout({
        lane,
        size,
        shear: 0,
      }),
    );
  }

  destroyLinearEffect() {
    particle.effects.destroy(this.effectInstanceIds.linear);
    this.effectInstanceIds.linear = 0;
  }

  getAlpha() {
    return 1;
  }
}

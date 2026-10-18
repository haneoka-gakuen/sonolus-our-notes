import { scheduleConnectWall } from "../../../connectWalls.js";
import {
  NativeLaneEffectType,
  nativeLaneFeedbackFirst,
  nativeLaneFeedbackLast,
} from "../../../../../../../shared/src/engine/data/nativeLaneFeedback.js";
import {
  getNativeNoteCapId,
  getNativeNoteMainIds,
} from "../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js";
import { nativeNoteEffectDuration } from "../../../../../../../shared/src/engine/data/nativeEffects.js";
import {
  getNativeNoteDirection,
  getNativeNoteKind,
  getNativeNoteMarkRect,
  getNativeNoteParts,
  getNativeNoteRects,
} from "../../../../../../../shared/src/engine/data/nativeNoteGeometry.js";
import { lane } from "../../../../../../../shared/src/engine/data/lane.js";
import { approach } from "../../../../../../../shared/src/engine/data/note.js";
import { nativeNoteLayout } from "../../../../../../../shared/src/engine/data/nativeNoteLayout.js";
import { toBucketWindows, Windows } from "../../../../../../../shared/src/engine/data/windows.js";
import { options } from "../../../../configuration/options.js";
import { sfxDistance } from "../../../effect.js";
import { scheduleNativeLaneFeedback } from "../../../laneFeedback.js";
import { note } from "../../../note.js";
import {
  nativeParticleProfile,
  hasAggregateConnectWalls,
  linearEffectLayout,
  particle,
  sizedEffectId,
  spawnNativeEffect,
  spawnNativeSlideEffect,
} from "../../../particle.js";
import { getZ, layer, skin } from "../../../skin.js";
import { Note } from "../Note.js";

export abstract class FlatNote extends Note {
  abstract sprites: {
    left: SkinSprite;
    middle: SkinSprite;
    right: SkinSprite;
    fallback: SkinSprite;
  };

  abstract clips: {
    perfect: EffectClip;
    great?: EffectClip;
    good?: EffectClip;
    fallback?: EffectClip;
  };

  abstract effects: {
    circular: ParticleEffect;
    circularFallback?: ParticleEffect;
    linear: ParticleEffect;
    linearFallback?: ParticleEffect;
  };

  abstract windows: Windows;

  abstract bucket: Bucket;

  layer = layer.note.body;

  sharedMemory = this.defineSharedMemory({
    despawnTime: Number,
    laneEffectType: Number,
    laneFirst: Number,
    laneLast: Number,
    laneTime: Number,
    laneNext: Number,
    wallTime: Number,
    wallLane: Number,
    wallSize: Number,
    wallFallback: Number,
    wallDuration: Number,
    wallNext: Number,
  });

  visualTime = this.entityMemory(Range);
  hiddenTime = this.entityMemory(Number);

  initialized = this.entityMemory(Boolean);

  spriteLayouts = this.entityMemory({
    left: Rect,
    mainLeft: Rect,
    middle: Rect,
    mainRight: Rect,
    right: Rect,
  });
  bodyIds = this.entityMemory({
    left: SkinSpriteId,
    mainLeft: SkinSpriteId,
    mainRight: SkinSpriteId,
    right: SkinSpriteId,
  });
  z = this.entityMemory(Number);

  y = this.entityMemory(Number);

  preprocess() {
    super.preprocess();

    this.bucket.set(toBucketWindows(this.windows));
    this.archetypeLife.miss = -100;

    this.visualTime.copyFrom(Range.l.mul(note.duration).add(timeScaleChanges.at(this.targetTime).scaledTime));

    this.sharedMemory.despawnTime = timeScaleChanges.at(this.hitTime).scaledTime;
    if (options.laneEffectEnabled && this.nativeJudgment >= 3) this.playLaneEffects();
    if (
      options.noteEffectEnabled &&
      hasAggregateConnectWalls() &&
      this.nativeJudgment >= 5 &&
      this.nativeNoteEffectId === particle.effects.normalTraceNoteCircular.id
    )
      scheduleConnectWall(
        this.info.index,
        this.hitTime,
        this.import.lane,
        this.import.size,
        (sizedEffectId(this.nativeNoteEffectId, this.import.size) as unknown as number) + 1,
        this.noteEffectDuration,
      );

    if (options.sfxEnabled) {
      if (replay.isReplay) {
        this.scheduleReplaySFX();
      } else {
        this.scheduleSFX();
      }
    }

    if (!replay.isReplay) {
      this.result.bucket.index = this.bucket.index;
    } else if (this.import.judgment) {
      this.result.bucket.index = this.bucket.index;
      this.result.bucket.value = this.import.accuracy * 1000;
    }
  }

  spawnTime() {
    return this.visualTime.min;
  }

  despawnTime() {
    return this.sharedMemory.despawnTime;
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    this.globalInitialize();
  }

  updateParallel() {
    if (options.hidden > 0 && time.scaled > this.hiddenTime) return;
    if (note.isCovered(this.visualTime.max)) return;

    this.render();
  }

  terminate() {
    if (time.skip) return;

    this.despawnTerminate();
  }

  get useFallbackSprites() {
    return !this.sprites.left.exists || !this.sprites.middle.exists || !this.sprites.right.exists;
  }

  get useFallbackClip() {
    return (
      !this.clips.perfect.exists ||
      ("great" in this.clips && !this.clips.great.exists) ||
      ("good" in this.clips && !this.clips.good.exists)
    );
  }

  get circularEffectId() {
    return "circularFallback" in this.effects && !this.effects.circular.exists
      ? this.effects.circularFallback.id
      : this.effects.circular.id;
  }

  get linearEffectId() {
    return "linearFallback" in this.effects && !this.effects.linear.exists
      ? this.effects.linearFallback.id
      : this.effects.linear.id;
  }

  get nativeJudgment() {
    if (!replay.isReplay) return 5;

    // New replays preserve the native 1..6 value exported by play so Bad
    // (2) remains visually distinct from Miss (1). Legacy replays have no
    // custom field and fall back to Sonolus's standard judgment.
    if (this.import.originalJudgment >= 1 && this.import.originalJudgment <= 6) return this.import.originalJudgment;

    if (this.import.judgment === Judgment.Perfect) return 5;
    if (this.import.judgment === Judgment.Great) return 4;
    if (this.import.judgment === Judgment.Good) return 3;
    return 1;
  }

  get noteEffectDuration() {
    return nativeNoteEffectDuration(nativeParticleProfile(), this.import.operateType, this.nativeJudgment);
  }

  get nativeNoteEffectId() {
    const judgment = this.nativeJudgment;
    if (
      this.import.operateType === 40 ||
      this.import.operateType === 41 ||
      this.import.operateType === 42 ||
      this.import.operateType === 102
    ) {
      const direction = options.mirror
        ? this.import.originalDirection === 1
          ? 2
          : this.import.originalDirection === 2
            ? 1
            : 0
        : this.import.originalDirection;
      if (direction === 1) {
        if (judgment === 4) return particle.effects.flickLeftGreat.id;
        if (judgment === 3) return particle.effects.flickLeftGood.id;
        if (judgment === 2) return particle.effects.flickLeftBad.id;
        return particle.effects.flickLeftWall.id;
      }
      if (direction === 2) {
        if (judgment === 4) return particle.effects.flickRightGreat.id;
        if (judgment === 3) return particle.effects.flickRightGood.id;
        if (judgment === 2) return particle.effects.flickRightBad.id;
        return particle.effects.flickRightWall.id;
      }
      if (judgment === 4) return particle.effects.flickNoteGreat.id;
      if (judgment === 3) return particle.effects.flickNoteGood.id;
      if (judgment === 2) return particle.effects.flickNoteBad.id;
      return particle.effects.flickNoteCircular.id;
    }

    if (this.import.operateType === 20 || this.import.operateType === 22) {
      if (judgment === 4) return particle.effects.slideNoteGreat.id;
      if (judgment === 3) return particle.effects.slideNoteGood.id;
      if (judgment === 2) return particle.effects.slideNoteBad.id;
      return particle.effects.slideNoteCircular.id;
    }

    if (
      this.import.operateType === 21 ||
      this.import.operateType === 60 ||
      this.import.operateType === 61 ||
      this.import.operateType === 62 ||
      this.import.operateType === 63 ||
      this.import.operateType === 104 ||
      this.import.operateType === 105
    ) {
      if (judgment === 4) return particle.effects.normalTraceNoteGreat.id;
      if (judgment === 3) return particle.effects.normalTraceNoteGood.id;
      if (judgment === 2) return particle.effects.normalTraceNoteBad.id;
      return particle.effects.normalTraceNoteCircular.id;
    }

    if (judgment === 4) return particle.effects.normalNoteGreat.id;
    if (judgment === 3) return particle.effects.normalNoteGood.id;
    if (judgment === 2) return particle.effects.normalNoteBad.id;
    return particle.effects.normalNoteCircular.id;
  }

  get hitTime() {
    return this.targetTime + (replay.isReplay ? this.import.accuracy : 0);
  }

  globalInitialize() {
    if (options.hidden > 0) this.hiddenTime = this.visualTime.max - note.duration * options.hidden;

    const rects = this.nativeRects;
    const kind = this.nativeKind;
    const parts = getNativeNoteParts(this.import.lane, this.import.size, false);
    this.bodyIds.left = getNativeNoteCapId(skin.sprites, kind, parts.leftTilt, parts.leftRight);
    this.bodyIds.right = getNativeNoteCapId(skin.sprites, kind, parts.rightTilt, parts.rightRight);
    const main = getNativeNoteMainIds(skin.sprites, kind);
    this.bodyIds.mainLeft = main.left;
    this.bodyIds.mainRight = main.right;
    new Rect(rects.left).copyTo(this.spriteLayouts.left);
    new Rect(rects.mainLeft).copyTo(this.spriteLayouts.mainLeft);
    new Rect(rects.mainRight).copyTo(this.spriteLayouts.mainRight);
    new Rect(rects.middle).copyTo(this.spriteLayouts.middle);
    new Rect(rects.right).copyTo(this.spriteLayouts.right);

    this.z = getZ(this.layer, this.targetTime, this.import.lane);
  }

  scheduleSFX() {
    // Watch/autoplay has no runtime input accuracy. Use the operation's
    // Perfect cue instead of treating every scheduled hit as native Just.
    if ("fallback" in this.clips && this.useFallbackClip) {
      this.clips.fallback.schedule(this.hitTime, sfxDistance);
    } else {
      this.clips.perfect.schedule(this.hitTime, sfxDistance);
    }
  }

  scheduleReplaySFX() {
    if (!this.import.judgment) return;

    if ("fallback" in this.clips && this.useFallbackClip) {
      this.clips.fallback.schedule(this.hitTime, sfxDistance);
    } else if ("great" in this.clips && "good" in this.clips) {
      switch (this.import.judgment) {
        case Judgment.Perfect:
          this.clips.perfect.schedule(this.hitTime, sfxDistance);
          break;
        case Judgment.Great:
          this.clips.great.schedule(this.hitTime, sfxDistance);
          break;
        case Judgment.Good:
          this.clips.good.schedule(this.hitTime, sfxDistance);
          break;
      }
    } else {
      this.clips.perfect.schedule(this.hitTime, sfxDistance);
    }
  }

  render() {
    this.y = approach(this.visualTime.min, this.visualTime.max, time.scaled);

    this.renderBody();
    this.renderDecoration();
  }

  renderBody() {
    this.drawBodyPart(this.bodyIds.left, this.spriteLayouts.left);
    this.drawBodyPart(this.bodyIds.mainLeft, this.spriteLayouts.mainLeft);
    this.drawBodyPart(getNativeNoteMainIds(skin.sprites, this.nativeKind).middle, this.spriteLayouts.middle);
    this.drawBodyPart(this.bodyIds.mainRight, this.spriteLayouts.mainRight);
    this.drawBodyPart(this.bodyIds.right, this.spriteLayouts.right);
  }

  drawBodyPart(id: SkinSpriteId, layout: RectLike) {
    if (skin.sprites.exists(id)) skin.sprites.draw(id, nativeNoteLayout(layout).mul(this.y), [this.z], 1);
  }

  get nativeKind() {
    return getNativeNoteKind(
      this.import.operateType,
      getNativeNoteDirection(this.import.originalDirection, options.mirror),
    );
  }

  get nativeRects() {
    return getNativeNoteRects(
      this.import.lane,
      this.import.size,
      this.nativeKind,
      skin.sprites.nativeArrowAnimationSkin002.exists,
      skin.sprites.nativeArrowAnimationSkin003.exists,
    );
  }

  get nativeMarkRect() {
    return getNativeNoteMarkRect(
      this.import.lane,
      getNativeNoteKind(this.import.operateType, getNativeNoteDirection(this.import.originalDirection, options.mirror)),
      skin.sprites.nativeArrowAnimationSkin002.exists,
      skin.sprites.nativeArrowAnimationSkin003.exists,
    );
  }

  renderDecoration() {
    const layout = nativeNoteLayout(this.nativeMarkRect).mul(this.y);
    const z = getZ(layer.note.body + 0.5, this.targetTime, this.import.lane);
    const direction = options.mirror
      ? this.import.originalDirection === 1
        ? 2
        : this.import.originalDirection === 2
          ? 1
          : 0
      : this.import.originalDirection;

    if (this.import.operateType === 1 || this.import.operateType === 101) {
      skin.sprites.tapDecoration.draw(layout, [z], 1);
    } else if (this.import.operateType === 20) {
      skin.sprites.slideDecoration.draw(layout, [z], 1);
    } else if (
      this.import.operateType === 40 ||
      this.import.operateType === 41 ||
      this.import.operateType === 42 ||
      this.import.operateType === 102
    ) {
      if (direction === 1) {
        skin.sprites.flickLeftDecoration.draw(layout, [z], 1);
      } else if (direction === 2) {
        skin.sprites.flickRightDecoration.draw(layout, [z], 1);
      } else {
        skin.sprites.flickDecoration.draw(layout, [z], 1);
      }
    }
  }

  despawnTerminate() {
    if (replay.isReplay && this.nativeJudgment === 1) return;

    // LiveGameNoteEffectBase.Play maps Miss to animator state 0, so no
    // authored effect animation is selected.
    if (options.noteEffectEnabled && this.nativeJudgment !== 1) this.playNoteEffects();
  }

  playNoteEffects() {
    // One native effect carries the wall mesh, sprites, particles and bloom.
    this.playCircularNoteEffect();
  }

  playLinearNoteEffect() {
    particle.effects.spawn(
      this.linearEffectId,
      linearEffectLayout({
        lane: this.import.lane,
        size: this.import.size,
        shear: 0,
      }),
      this.noteEffectDuration,
      false,
    );
  }

  playCircularNoteEffect() {
    if (this.effects.circular.id === particle.effects.slideNoteCircular.id) {
      spawnNativeSlideEffect(
        sizedEffectId(this.nativeNoteEffectId, this.import.size),
        this.import.lane,
        this.import.size,
        this.noteEffectDuration,
      );
    } else {
      spawnNativeEffect(
        sizedEffectId(this.nativeNoteEffectId, this.import.size),
        this.import.lane,
        this.import.size,
        this.noteEffectDuration,
        this.hitTime,
        true,
      );
    }
  }

  playLaneEffects() {
    const direction = options.mirror
      ? this.import.originalDirection === 1
        ? 2
        : this.import.originalDirection === 2
          ? 1
          : 0
      : this.import.originalDirection;

    // Round in the original 24-slot coordinate system before mapping to the stage.
    const laneStart = nativeLaneFeedbackFirst(this.import.lane, this.import.size);
    const laneEnd = nativeLaneFeedbackLast(this.import.lane, this.import.size);

    let type = -1;
    if (this.import.operateType === 1 || this.import.operateType === 101) type = NativeLaneEffectType.Normal;
    else if (
      this.import.operateType === 40 ||
      this.import.operateType === 41 ||
      this.import.operateType === 42 ||
      this.import.operateType === 102
    )
      type =
        direction === 1
          ? NativeLaneEffectType.FlickLeft
          : direction === 2
            ? NativeLaneEffectType.FlickRight
            : NativeLaneEffectType.Flick;
    else if (this.import.operateType === 20 || this.import.operateType === 22) type = NativeLaneEffectType.Slide;
    if (type < 0) return;
    scheduleNativeLaneFeedback(this.info.index, type, laneStart, laneEnd, this.hitTime);
  }
}

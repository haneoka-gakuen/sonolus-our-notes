import { getNativeNoteCapId, getNativeNoteMainIds } from '../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js';
import { nativeNoteEffectDuration } from "../../../../../../../shared/src/engine/data/nativeEffects.js";
import { getNativeNoteDirection, getNativeNoteKind, getNativeNoteMarkRect, getNativeNoteParts, getNativeNoteRects } from "../../../../../../../shared/src/engine/data/nativeNoteGeometry.js";
import { approach } from "../../../../../../../shared/src/engine/data/note.js";
import { nativeLaneEffectLifetime } from "../../../../../../../shared/src/engine/data/lane.js";
import { nativeNoteLayout } from '../../../../../../../shared/src/engine/data/nativeNoteLayout.js';
import { toBucketWindows, Windows } from "../../../../../../../shared/src/engine/data/windows.js";
import { options } from "../../../../configuration/options.js";
import { effect, sfxDistance } from "../../../effect.js";
import { getHitbox, getNativeJudgmentLeniency, lane } from "../../../lane.js";
import { note } from "../../../note.js";
import { groundEffectLayout, linearEffectLayout, particle, sizedEffectId, spawnNativeEffect } from "../../../particle.js";
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

  originalExport = this.defineExport({
    judgment: { name: "ourNotesJudgment", type: Number },
    accuracyMs: { name: "ourNotesAccuracyMs", type: Number },
  });

  layer = layer.note.body;

  visualTime = this.entityMemory(Range);
  hiddenTime = this.entityMemory(Number);

  inputTime = this.entityMemory(Range);

  spriteLayouts = this.entityMemory({
    left: Rect,
    mainLeft: Rect,
    middle: Rect,
    mainRight: Rect,
    right: Rect,
  });
  bodyIds = this.entityMemory({ left: SkinSpriteId, mainLeft: SkinSpriteId, mainRight: SkinSpriteId, right: SkinSpriteId });
  z = this.entityMemory(Number);

  y = this.entityMemory(Number);
  // Sonolus has no Bad result enum, but the native effect state machine does.
  // Keep the original 1..6 judgment separately so Bad (2) does not collapse
  // into the same no-effect path as Miss (1).
  nativeJudgment = this.entityMemory(Number);

  preprocess() {
    super.preprocess();

    this.bucket.set(toBucketWindows(this.windows));
    this.archetypeLife.miss = -100;

    this.visualTime.copyFrom(Range.l.mul(note.duration).add(timeScaleChanges.at(this.targetTime).scaledTime));

    this.inputTime.copyFrom(this.windows.input.add(this.targetTime).add(input.offset));

    this.spawnTime = Math.min(this.visualTime.min, timeScaleChanges.at(this.inputTime.min).scaledTime);

    if (this.shouldScheduleSFX) this.scheduleSFX();
  }

  initialize() {
    this.originalExport("judgment", 1);
    this.originalExport("accuracyMs", this.windows.input.max * 1000);
    this.nativeJudgment = 1;

    if (options.hidden > 0) this.hiddenTime = this.visualTime.max - note.duration * options.hidden;

    const l = this.import.lane - this.import.size;
    const r = this.import.lane + this.import.size;

    getHitbox({ l, r, leniency: 0 }).copyTo(this.hitbox);
    getHitbox({
      l,
      r,
      leniency: getNativeJudgmentLeniency({
        operateType: this.import.operateType,
        originalCritical: this.import.originalCritical,
        originalSize: this.import.originalSize,
      }),
    }).copyTo(this.fullHitbox);

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
    this.result.accuracy = this.windows.input.max;
  }

  updateParallel() {
    if (time.now > this.inputTime.max) this.despawn = true;
    if (this.despawn) return;

    if (time.scaled < this.visualTime.min) return;
    if (options.hidden > 0 && time.scaled > this.hiddenTime) return;

    this.render();
  }

  get shouldScheduleSFX() {
    return options.sfxEnabled && options.autoSFX;
  }

  get shouldPlaySFX() {
    return options.sfxEnabled && !options.autoSFX;
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

  get noteEffectDuration() {
    return nativeNoteEffectDuration(options.noteEffectProfile, this.import.operateType, this.nativeJudgment);
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

  scheduleSFX() {
    // Sonolus auto SFX is scheduled before an input result exists. Ordinary
    // play has no Just/Gekisou activation, so schedule the native Perfect cue.
    if ("fallback" in this.clips && this.useFallbackClip) {
      this.clips.fallback.schedule(this.targetTime, sfxDistance);
    } else {
      this.clips.perfect.schedule(this.targetTime, sfxDistance);
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
    return getNativeNoteKind(this.import.operateType, getNativeNoteDirection(this.import.originalDirection, options.mirror));
  }

  get nativeRects() {
    return getNativeNoteRects(this.import.lane, this.import.size, this.nativeKind,
      skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists);
  }

  get nativeMarkRect() {
    return getNativeNoteMarkRect(this.import.lane,
      getNativeNoteKind(this.import.operateType, getNativeNoteDirection(this.import.originalDirection, options.mirror)),
      skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists)
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

  playHitEffects(hitTime: number) {
    // HapticFeedback.judgement: Bad..Just vibrate (native judgement >= 2).
    this.result.haptic = options.hapticsEnabled && this.nativeJudgment >= 2 ? HapticType.Medium : HapticType.None;
    if (this.shouldPlaySFX && this.nativeJudgment >= 3) this.playSFX();
    // LiveGameNoteEffectBase.Play maps Miss to animator state 0, so no
    // authored effect animation is selected.
    if (options.noteEffectEnabled && this.nativeJudgment !== 1) this.playNoteEffects();
    // LiveLaneEffectView.UpdateFrame only lights lanes for Good..Just
    // (native judgements 3..6). Bad and Miss leave the lane dark.
    if (options.laneEffectEnabled && this.nativeJudgment >= 3) this.playLaneEffects();
  }

  judge(hitTime: number) {
    const diff = hitTime - this.targetTime;

    this.originalExport("accuracyMs", diff * 1000);

    if (this.windows.perfect.contains(diff)) {
      this.nativeJudgment = 5;
      this.originalExport("judgment", 5);
      return Judgment.Perfect;
    }
    if (this.windows.great.contains(diff)) {
      this.nativeJudgment = 4;
      this.originalExport("judgment", 4);
      return Judgment.Great;
    }
    if (this.windows.good.contains(diff)) {
      this.nativeJudgment = 3;
      this.originalExport("judgment", 3);
      return Judgment.Good;
    }
    if (this.windows.bad.contains(diff)) {
      this.nativeJudgment = 2;
      this.originalExport("judgment", 2);
      return Judgment.Miss;
    }

    // Our Notes Bad has no Sonolus result enum. Map it to Miss instead of
    // inflating it to Good; the original judgementType remains in LevelData.
    this.nativeJudgment = 1;
    this.originalExport("judgment", 1);
    return Judgment.Miss;
  }

  playSFX() {
    // IsEnableSeJudgement gates note SE on judgements 3..6 (Good..Just).
    // Bad and Miss play nothing; a Just plays the dedicated two-layer Just
    // cue instead of the Perfect waveform.
    if (this.nativeJudgment <= 2) return;
    if (this.nativeJudgment === 6 && effect.clips.just.exists) {
      effect.clips.just.play(sfxDistance);
      return;
    }
    if ("fallback" in this.clips && this.useFallbackClip) {
      this.clips.fallback.play(sfxDistance);
    } else if ("great" in this.clips && "good" in this.clips) {
      switch (this.result.judgment) {
        case Judgment.Perfect:
          this.clips.perfect.play(sfxDistance);
          break;
        case Judgment.Great:
          this.clips.great.play(sfxDistance);
          break;
        case Judgment.Good:
          this.clips.good.play(sfxDistance);
          break;
      }
    } else {
      this.clips.perfect.play(sfxDistance);
    }
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
    // Authored per width bucket; the spawn rect stretches the remainder.
    spawnNativeEffect(
      sizedEffectId(this.nativeNoteEffectId, this.import.size),
      this.import.lane,
      this.import.size,
      this.noteEffectDuration,
    );
  }

  playLaneEffects() {
    const direction = options.mirror
      ? this.import.originalDirection === 1
        ? 2
        : this.import.originalDirection === 2
          ? 1
          : 0
      : this.import.originalDirection;

    // LiveLaneEffectView lights every physical lane of the note separately
    // (one width-1 fill per lane), not one quad stretched across the span.
    // The note rect is lane +/- size (size is the half-width); lanes index the
    // physical slots, each spanning [lane, lane + 1].
    // Native lane ranges use System.Math.Round(float), whose default midpoint
    // rule is ToEven. JavaScript Math.round differs for .5 ties and negatives.
    const nativeRoundToEven = (value: number) => {
      const floor = Math.floor(value);
      const fraction = value - floor;
      if (fraction < 0.5) return floor;
      if (fraction > 0.5) return floor + 1;
      return floor % 2 === 0 ? floor : floor + 1;
    };
    const laneStart = nativeRoundToEven(this.import.lane - this.import.size);
    const laneEnd = laneStart + Math.max(1, nativeRoundToEven(this.import.size * 2)) - 1;

    if (this.import.operateType === 1 || this.import.operateType === 101) {
      for (let lane = laneStart; lane <= laneEnd; lane += 1)
        particle.effects.laneNormal.spawn(
          groundEffectLayout({ lane: lane + 0.5, size: 0.5 }),
          nativeLaneEffectLifetime,
          false,
        );
    } else if (
      this.import.operateType === 40 ||
      this.import.operateType === 41 ||
      this.import.operateType === 42 ||
      this.import.operateType === 102
    ) {
      for (let lane = laneStart; lane <= laneEnd; lane += 1) {
        if (direction === 1) {
          particle.effects.laneFlickLeft.spawn(
            groundEffectLayout({ lane: lane + 0.5, size: 0.5 }),
            nativeLaneEffectLifetime,
            false,
          );
        } else if (direction === 2) {
          particle.effects.laneFlickRight.spawn(
            groundEffectLayout({ lane: lane + 0.5, size: 0.5 }),
            nativeLaneEffectLifetime,
            false,
          );
        } else {
          particle.effects.laneFlick.spawn(
            groundEffectLayout({ lane: lane + 0.5, size: 0.5 }),
            nativeLaneEffectLifetime,
            false,
          );
        }
      }
    } else if (this.import.operateType === 20 || this.import.operateType === 22) {
      for (let lane = laneStart; lane <= laneEnd; lane += 1)
        particle.effects.laneSlide.spawn(
          groundEffectLayout({ lane: lane + 0.5, size: 0.5 }),
          nativeLaneEffectLifetime,
          false,
        );
    }
  }

}

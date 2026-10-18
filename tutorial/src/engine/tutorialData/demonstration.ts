import { FlickDirection } from "../../../../shared/src/engine/data/FlickDirection.js";
import {
  getArrowLayout,
  getArrowSpriteId,
  getNativeArrowAnimationLayout,
} from "../../../../shared/src/engine/data/arrowSprites.js";
import {
  getNativeArrowAnimation,
  getNativeArrowAnimationSkin,
  NativeArrowAnimationSkin,
} from "../../../../shared/src/engine/data/nativeArrowAnimation.js";
import {
  getNativeNoteKind,
  getNativeNoteParts,
  getNativeNoteRects,
} from "../../../../shared/src/engine/data/nativeNoteGeometry.js";
import {
  getNativeNoteCapId,
  getNativeNoteMainIds,
} from "../../../../shared/src/engine/data/nativeNoteSprites.generated.js";
import { nativeNoteLayout } from "../../../../shared/src/engine/data/nativeNoteLayout.js";
import { getNativeSlideSpriteId } from "../../../../shared/src/engine/data/nativeSlideSkin.js";
import { approach } from "../../../../shared/src/engine/data/note.js";
import { drawContact, instruction } from "./instruction.js";
import { tutorialNoteSize, type TutorialLesson } from "./lessons.js";
import {
  destroyHoldEffect,
  moveHoldEffect,
  particle,
  playLaneEffect,
  playNoteEffect,
  spawnHoldEffect,
} from "./particle.js";
import { segment } from "./segment.js";
import { layer, skin } from "./skin.js";
import { effect, playTutorialSound, startHeldSound, stopHeldSound } from "./sound.js";

const state = tutorialMemory({ hit: Boolean, holding: Boolean, ended: Boolean });
const held = tutorialMemory({
  p0: ParticleEffectInstanceId,
  p1: ParticleEffectInstanceId,
  p2: ParticleEffectInstanceId,
  p3: ParticleEffectInstanceId,
});
const arrows = {
  up: [
    skin.sprites.flickArrowUp1,
    skin.sprites.flickArrowUp2,
    skin.sprites.flickArrowUp3,
    skin.sprites.flickArrowUp4,
    skin.sprites.flickArrowUp5,
    skin.sprites.flickArrowUp6,
    skin.sprites.flickArrowUp7,
    skin.sprites.flickArrowUp8,
  ],
  left: [
    skin.sprites.flickArrowLeft1,
    skin.sprites.flickArrowLeft2,
    skin.sprites.flickArrowLeft3,
    skin.sprites.flickArrowLeft4,
    skin.sprites.flickArrowLeft5,
    skin.sprites.flickArrowLeft6,
    skin.sprites.flickArrowLeft7,
    skin.sprites.flickArrowLeft8,
  ],
  right: [
    skin.sprites.flickArrowRight1,
    skin.sprites.flickArrowRight2,
    skin.sprites.flickArrowRight3,
    skin.sprites.flickArrowRight4,
    skin.sprites.flickArrowRight5,
    skin.sprites.flickArrowRight6,
    skin.sprites.flickArrowRight7,
    skin.sprites.flickArrowRight8,
  ],
};

function drawPart(id: SkinSpriteId, rect: RectLike, y: number, z: number) {
  if (skin.sprites.exists(id)) skin.sprites.draw(id, nativeNoteLayout(rect).mul(y), [z], 1);
}

function drawNote(operateType: number, direction: number, lane: number, y: number) {
  const kind = getNativeNoteKind(operateType, direction);
  const rects = getNativeNoteRects(
    lane,
    tutorialNoteSize,
    kind,
    skin.sprites.nativeArrowAnimationSkin002.exists,
    skin.sprites.nativeArrowAnimationSkin003.exists,
  );
  const parts = getNativeNoteParts(lane, tutorialNoteSize, false);
  const main = getNativeNoteMainIds(skin.sprites, kind);
  drawPart(getNativeNoteCapId(skin.sprites, kind, parts.leftTilt, parts.leftRight), rects.left, y, layer.note.body);
  drawPart(main.left, rects.mainLeft, y, layer.note.body);
  drawPart(main.middle, rects.middle, y, layer.note.body);
  drawPart(main.right, rects.mainRight, y, layer.note.body);
  drawPart(getNativeNoteCapId(skin.sprites, kind, parts.rightTilt, parts.rightRight), rects.right, y, layer.note.body);
  const decoration =
    kind === 0
      ? skin.sprites.tapDecoration.id
      : kind === 1
        ? skin.sprites.slideDecoration.id
        : kind === 4
          ? skin.sprites.flickLeftDecoration.id
          : kind === 5
            ? skin.sprites.flickRightDecoration.id
            : kind === 3
              ? skin.sprites.flickDecoration.id
              : kind === 6
                ? skin.sprites.normalTraceNoteDiamond.id
                : 0;
  if (decoration) drawPart(decoration, rects.mark, y, layer.note.body + 0.5);
  if (direction) drawArrow(direction, lane, y);
}

function drawArrow(direction: number, lane: number, y: number) {
  const nativeSkin = getNativeArrowAnimationSkin(
    skin.sprites.nativeArrowAnimationSkin001.exists,
    skin.sprites.nativeArrowAnimationSkin002.exists,
    skin.sprites.nativeArrowAnimationSkin003.exists,
  );
  const flickDirection = direction === 1 ? FlickDirection.Left : FlickDirection.Right;
  const id = getArrowSpriteId(arrows, tutorialNoteSize, flickDirection, nativeSkin);
  if (!skin.sprites.exists(id)) return;
  const base = getArrowLayout(tutorialNoteSize, flickDirection, lane, 1, nativeSkin);
  const animation = getNativeArrowAnimation(nativeSkin, flickDirection, segment.time);
  if (nativeSkin === NativeArrowAnimationSkin.None) skin.sprites.draw(id, base.mul(y), [layer.note.arrow], 1);
  else
    skin.sprites.draw(
      id,
      getNativeArrowAnimationLayout(
        base,
        flickDirection,
        lane,
        1,
        animation.x,
        animation.y,
        animation.scaleX,
        animation.scaleY,
      ).mul(y),
      [layer.note.arrow],
      animation.alpha,
    );
}

function drawRibbon(lesson: TutorialLesson, first: number, clock: number, active: boolean) {
  for (let cell = 0; cell < 16; cell++) {
    const min = Math.max(first, cell / 16);
    const max = (cell + 1) / 16;
    if (max <= min) continue;
    const b = approach(0, 2, clock - min * 2);
    const t = approach(0, 2, clock - max * 2);
    const nearLane = Math.lerp(lesson.startLane, lesson.endLane, min);
    const farLane = Math.lerp(lesson.startLane, lesson.endLane, max);
    const id = getNativeSlideSpriteId(skin.sprites, (min + max) / 2, active ? 2 : 0);
    if (skin.sprites.exists(id))
      skin.sprites.draw(
        id,
        new Quad({
          x1: (nearLane - tutorialNoteSize) * b,
          y1: b,
          x2: (farLane - tutorialNoteSize) * t,
          y2: t,
          x3: (farLane + tutorialNoteSize) * t,
          y3: t,
          x4: (nearLane + tutorialNoteSize) * b,
          y4: b,
        }),
        [layer.note.connector],
        1,
      );
  }
}

function hit(operateType: number, direction: number, lane: number) {
  const flick = direction !== 0;
  const slide = operateType === 20 || operateType === 22;
  const trace = operateType === 60;
  if (flick) {
    if (effect.clips.flickSide.exists) playTutorialSound(effect.clips.flickSide);
    else playTutorialSound(effect.clips.flickPerfect);
  } else if (trace && effect.clips.normalTrace.exists) {
    playTutorialSound(effect.clips.normalTrace);
  } else {
    playTutorialSound(effect.clips.normalPerfect);
  }
  if (flick) playNoteEffect(particle.effects.flickNote, 0, lane, direction);
  else if (slide) playNoteEffect(particle.effects.slideNote, 0, lane, direction);
  else if (trace) playNoteEffect(particle.effects.connectNote, 0, lane, direction);
  else playNoteEffect(particle.effects.normalNote, 0, lane, direction);
  if (flick) playLaneEffect(particle.effects.laneFlick, lane);
  else if (slide || trace) playLaneEffect(particle.effects.laneSlide, lane);
  else playLaneEffect(particle.effects.laneNormal, lane);
}

export function enterDemonstration(lesson: TutorialLesson, phase: number) {
  if (phase === 0) {
    if (lesson.held) {
      if (lesson.startLane === lesson.endLane) instruction.texts.hold.show();
      else instruction.texts.slide.show();
    } else if (lesson.direction) instruction.texts.flick.show();
    else if (lesson.operateType === 60) instruction.texts.hold.show();
    else if (lesson.easy) instruction.texts.easy.show();
    else instruction.texts.normal.show();
  } else if (phase === 2) {
    state.hit = false;
    state.holding = false;
    state.ended = false;
    if (lesson.held) {
      if (lesson.startLane === lesson.endLane) instruction.texts.hold.show();
      else instruction.texts.slide.show();
    } else if (lesson.direction) instruction.texts.flick.show();
    else if (lesson.operateType === 60) instruction.texts.hold.show();
    else instruction.texts.tap.show();
  }
}

export function exitDemonstration() {
  instruction.texts.clear();
  destroyHoldEffect(held);
  if (state.holding) {
    stopHeldSound();
    state.holding = false;
  }
}

export function updateDemonstration0(lesson: TutorialLesson) {
  drawNote(lesson.held ? 20 : lesson.operateType, lesson.held ? 0 : lesson.direction, lesson.startLane, 1);
}

export function updateDemonstration1(lesson: TutorialLesson) {
  const y = approach(0, 2, segment.time);
  if (lesson.held) {
    drawRibbon(lesson, 0, segment.time, false);
    drawNote(lesson.operateType, lesson.direction, lesson.endLane, approach(0, 2, segment.time - 2));
  }
  drawNote(lesson.held ? 20 : lesson.operateType, lesson.held ? 0 : lesson.direction, lesson.startLane, y);
  if ((lesson.direction && !lesson.held) || lesson.operateType === 60) drawContact(lesson.startLane, 1);
}

export function updateDemonstration2(lesson: TutorialLesson) {
  if (lesson.held) {
    const progress = Math.unlerpClamped(0.35, 3.3, segment.time);
    const lane = Math.lerp(lesson.startLane, lesson.endLane, progress);
    drawRibbon(lesson, progress, 2 + progress * 2, true);
    if (!state.ended) {
      if (progress < 1) drawNote(20, 0, lane, 1);
    }
    if (!state.hit && segment.time >= 0.35) {
      hit(20, 0, lesson.startLane);
      const ids = spawnHoldEffect(lesson.startLane, time.now + (lesson.direction ? 3.7 : 3.3) - segment.time);
      held.p0 = ids.p0;
      held.p1 = ids.p1;
      held.p2 = ids.p2;
      held.p3 = ids.p3;
      startHeldSound();
      state.hit = true;
      state.holding = true;
    }
    if (state.holding) moveHoldEffect(held, lane);
    const flickProgress = lesson.direction ? Math.unlerpClamped(3.3, 3.7, segment.time) : 0;
    drawContact(lane + flickProgress * 2, 1);
    if (!state.ended && segment.time >= (lesson.direction ? 3.7 : 3.3)) {
      hit(lesson.operateType, lesson.direction, lesson.endLane);
      stopHeldSound();
      destroyHoldEffect(held);
      state.holding = false;
      state.ended = true;
    }
  } else {
    const flickProgress = lesson.direction ? Math.unlerpClamped(0.6, 1, segment.time) : 0;
    const lane = lesson.startLane + (lesson.direction === 1 ? -2 : 2) * flickProgress;
    if (!state.hit) drawNote(lesson.operateType, lesson.direction, lesson.startLane, 1);
    const alpha =
      lesson.direction || lesson.operateType === 60
        ? 1
        : Math.unlerpClamped(0.2, 0.55, segment.time) * Math.unlerpClamped(1.3, 0.85, segment.time);
    drawContact(lane, alpha);
    if (!state.hit && segment.time >= (lesson.direction ? 1 : 0.6)) {
      hit(lesson.operateType, lesson.direction, lesson.startLane);
      state.hit = true;
    }
  }
}

export function updateDemonstration2EndNote(lesson: TutorialLesson) {
  if (state.ended) return;
  const progress = Math.unlerpClamped(0.35, 3.3, segment.time);
  drawNote(lesson.operateType, lesson.direction, lesson.endLane, approach(0, 2, progress * 2));
}

export function updateDemonstration3(lesson: TutorialLesson) {
  const lane = lesson.held
    ? lesson.endLane + (lesson.direction ? 2 : 0)
    : lesson.startLane + (lesson.direction === 1 ? -2 : lesson.direction === 2 ? 2 : 0);
  drawContact(lane, Math.unlerpClamped(0.6, 0, segment.time));
}

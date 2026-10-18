import { initialization } from "./components/initialization.js";
import { stage } from "./components/stage.js";
import {
  enterDemonstration,
  exitDemonstration,
  updateDemonstration0,
  updateDemonstration1,
  updateDemonstration2,
  updateDemonstration2EndNote,
  updateDemonstration3,
} from "./demonstration.js";
import { lessons, tutorialPhaseCount, type TutorialLesson } from "./lessons.js";
import { segment } from "./segment.js";
import { updateHoldSource } from "./particle.js";

const components = [initialization, stage] as const;
const segmentCount = lessons.length * tutorialPhaseCount;

let current = tutorialMemory(Number);
let next = tutorialMemory(Number);
let startTime = tutorialMemory(Number);
let endTime = tutorialMemory(Number);

const preprocess = () => {
  current = -1;
};

const preprocessComponent = (index: number) => {
  index -= 1;

  const component = components[index];
  if (!("preprocess" in component)) return;

  component.preprocess();
};

const navigate = () => {
  if (navigation.direction > 0) {
    next = Math.mod(
      current + navigation.direction * (current % tutorialPhaseCount ? 1 : tutorialPhaseCount),
      segmentCount,
    );
  } else {
    next = Math.mod(Math.floor(current / tutorialPhaseCount) * tutorialPhaseCount - tutorialPhaseCount, segmentCount);
  }
};

const finishSegment = () => {
  if (current !== next) return;
  if (time.now < endTime) return;

  next = Math.mod(current + 1, segmentCount);
};

const exitCurrentSegment = () => {
  if (current === next || current < 0) return;

  exitDemonstration();
};

const enterLesson = (index: number, lesson: TutorialLesson) => {
  if (current === next) return;
  if (Math.floor(next / tutorialPhaseCount) !== index) return;

  enterDemonstration(lesson, next % tutorialPhaseCount);
};

const moveNext = () => {
  if (current === next) return;

  current = next;

  startTime = time.now;
  endTime = startTime;

  switch (current % tutorialPhaseCount) {
    case 0:
      endTime += 1;
      break;
    case 2:
      endTime += 4;
      break;
    default:
      endTime += 2;
      break;
  }
};

const updateSegmentTime = () => {
  segment.time = time.now - startTime;
};

const updateLesson0 = (index: number, lesson: TutorialLesson) => {
  if (Math.floor(current / tutorialPhaseCount) !== index || current % tutorialPhaseCount !== 0) return;
  updateDemonstration0(lesson);
};

const updateLesson1 = (index: number, lesson: TutorialLesson) => {
  if (Math.floor(current / tutorialPhaseCount) !== index || current % tutorialPhaseCount !== 1) return;
  updateDemonstration1(lesson);
};

const updateLesson2 = (index: number, lesson: TutorialLesson) => {
  if (Math.floor(current / tutorialPhaseCount) !== index || current % tutorialPhaseCount !== 2) return;
  updateDemonstration2(lesson);
};

const updateLesson3 = (index: number, lesson: TutorialLesson) => {
  if (Math.floor(current / tutorialPhaseCount) !== index || current % tutorialPhaseCount !== 3) return;
  updateDemonstration3(lesson);
};

const updateHeldSource = (index: number, lesson: TutorialLesson) => {
  if (Math.floor(current / tutorialPhaseCount) !== index || current % tutorialPhaseCount !== 2) return;
  updateHoldSource(Math.lerp(lesson.startLane, lesson.endLane, Math.unlerpClamped(0.35, 3.3, segment.time)));
};

const updateHeldSources = [
  () => updateHeldSource(5, lessons[5]),
  () => updateHeldSource(6, lessons[6]),
  () => updateHeldSource(7, lessons[7]),
] as const;

const updateHeldEndNote = (index: number, lesson: TutorialLesson) => {
  if (Math.floor(current / tutorialPhaseCount) !== index || current % tutorialPhaseCount !== 2) return;
  updateDemonstration2EndNote(lesson);
};

const updateHeldEndNotes = [
  () => updateHeldEndNote(5, lessons[5]),
  () => updateHeldEndNote(6, lessons[6]),
  () => updateHeldEndNote(7, lessons[7]),
] as const;
// Each callback captures only global bindings and a literal lesson index.
// The compiler can inline one lesson without expanding every other lesson.
const enterLessons = [
  () => enterLesson(0, lessons[0]),
  () => enterLesson(1, lessons[1]),
  () => enterLesson(2, lessons[2]),
  () => enterLesson(3, lessons[3]),
  () => enterLesson(4, lessons[4]),
  () => enterLesson(5, lessons[5]),
  () => enterLesson(6, lessons[6]),
  () => enterLesson(7, lessons[7]),
] as const;

const updateLessons = [
  () => updateLesson0(0, lessons[0]),
  () => updateLesson1(0, lessons[0]),
  () => updateLesson2(0, lessons[0]),
  () => updateLesson3(0, lessons[0]),
  () => updateLesson0(1, lessons[1]),
  () => updateLesson1(1, lessons[1]),
  () => updateLesson2(1, lessons[1]),
  () => updateLesson3(1, lessons[1]),
  () => updateLesson0(2, lessons[2]),
  () => updateLesson1(2, lessons[2]),
  () => updateLesson2(2, lessons[2]),
  () => updateLesson3(2, lessons[2]),
  () => updateLesson0(3, lessons[3]),
  () => updateLesson1(3, lessons[3]),
  () => updateLesson2(3, lessons[3]),
  () => updateLesson3(3, lessons[3]),
  () => updateLesson0(4, lessons[4]),
  () => updateLesson1(4, lessons[4]),
  () => updateLesson2(4, lessons[4]),
  () => updateLesson3(4, lessons[4]),
  () => updateLesson0(5, lessons[5]),
  () => updateLesson1(5, lessons[5]),
  () => updateLesson2(5, lessons[5]),
  () => updateLesson3(5, lessons[5]),
  () => updateLesson0(6, lessons[6]),
  () => updateLesson1(6, lessons[6]),
  () => updateLesson2(6, lessons[6]),
  () => updateLesson3(6, lessons[6]),
  () => updateLesson0(7, lessons[7]),
  () => updateLesson1(7, lessons[7]),
  () => updateLesson2(7, lessons[7]),
  () => updateLesson3(7, lessons[7]),
] as const;

const updateComponent = (index: number) => {
  // finish, exit, move and clock precede the two sets of lesson callbacks.
  index -= 4 + enterLessons.length + updateLessons.length + updateHeldEndNotes.length + updateHeldSources.length;

  const component = components[index];
  if (!("update" in component)) return;

  component.update();
};

const forEach = (items: readonly unknown[], callback: (index: number) => void) => items.map(() => callback);

export const tutorial = {
  preprocess: [preprocess, ...forEach(components, preprocessComponent)],

  navigate: [navigate],

  update: [
    finishSegment,
    exitCurrentSegment,
    ...enterLessons,
    moveNext,
    updateSegmentTime,
    ...updateHeldEndNotes,
    ...updateLessons,
    ...updateHeldSources,
    ...forEach(components, updateComponent),
  ],
};

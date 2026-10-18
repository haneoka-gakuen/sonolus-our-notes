export const lessons = [
  { operateType: 1, direction: 0, startLane: 0, endLane: 0, held: false, easy: false },
  { operateType: 1, direction: 0, startLane: 0, endLane: 0, held: false, easy: true },
  { operateType: 40, direction: 1, startLane: 0, endLane: 0, held: false, easy: false },
  { operateType: 40, direction: 2, startLane: 0, endLane: 0, held: false, easy: false },
  { operateType: 60, direction: 0, startLane: 0, endLane: 0, held: false, easy: false },
  { operateType: 22, direction: 0, startLane: 0, endLane: 0, held: true, easy: false },
  { operateType: 22, direction: 0, startLane: -3, endLane: 3, held: true, easy: false },
  { operateType: 42, direction: 2, startLane: -3, endLane: 3, held: true, easy: false },
] as const;

export type TutorialLesson = (typeof lessons)[number];
export const tutorialNoteSize = 2;
export const tutorialPhaseCount = 4;

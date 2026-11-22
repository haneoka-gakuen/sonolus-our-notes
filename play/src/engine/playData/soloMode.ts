import { nativeAssist } from "../../../../shared/src/engine/data/assist.js";
import {
  gekisouComboFactor,
  isLightScoreNote,
  noteScoreRatio,
  ordinaryComboFactor,
  soloModeReplay,
  sourceFloat,
  sourceMultiply,
} from "../../../../shared/src/engine/data/soloMode.js";
import { options } from "../configuration/options.js";
import { getAssistState, recordAssistJudgment } from "./assist.js";
import { archetypes } from "./archetypes/index.js";
import { consumeLuckDraw, recordLuckNote } from "./gekisouLuck.js";

export const soloModeConfig = levelData({
  bandPower: Number,
  multiplier: Number,
  weightedNotes: Number,
  noteCount: Number,
  ranges: Tuple(3, { mission: Number, start: Number, end: Number }),
});

export const soloResultMemory = {
  ranges: Tuple(3, { combo: Number, bestCombo: Number, just: Number }),
  combo: Number,
  beforeTimestamp: Number,
  previousNoteMs: Number,
  bestCombo: Number,
  life: Number,
  score: Number,
  judged: Number,
  brokeCombo: Boolean,
  finished: Boolean,
  grade: Number,
};

export const getSoloResult = () => archetypes.Initialization.sharedMemory.get(0).solo;
export const getLuckState = (index: number) => archetypes.Stage.sharedMemory.get(1).luck.get(index);

export const usesSoloMode = () => options.assistMode || options.gekisouMode;

export function gekisouRangeAt(timeMs: number) {
  if (!options.gekisouMode) return -1;
  for (let i = 0; i < 3; i++) {
    const range = soloModeConfig.ranges.get(i);
    if (range.mission > 0 && range.start <= timeMs && timeMs <= range.end) return i;
  }
  return -1;
}

export function isGekisouJust(noteMs: number, eventMs: number) {
  const index = gekisouRangeAt(noteMs);
  return index >= 0 && gekisouRangeAt(eventMs) === index && soloModeConfig.ranges.get(index).mission === 3;
}

function recordSoloNote(operateType: number, noteMs: number, judgment: number, observedAt: number) {
  const soloMode = getSoloResult();
  if (soloMode.previousNoteMs !== noteMs) {
    soloMode.beforeTimestamp = soloMode.combo;
    soloMode.previousNoteMs = noteMs;
  }
  const kind = gekisouRangeAt(noteMs);
  let missionBonus = 1;
  let luckBonus = 1;
  if (kind >= 0) {
    const range = soloMode.ranges.get(kind);
    const priorMissionCombo = range.combo;
    if (judgment >= 3) range.combo++;
    else range.combo = 0;
    range.bestCombo = Math.max(range.bestCombo, range.combo);
    if (judgment === 6) range.just++;
    const mission = soloModeConfig.ranges.get(kind).mission;
    if (mission === 1) {
      missionBonus = gekisouComboFactor(priorMissionCombo);
      streams.set(soloModeReplay.mission - kind * 2, observedAt, range.combo);
    }
    if (mission === 2) {
      const luck = getLuckState(kind);
      if (luck.rushCombo > 0) luckBonus = 1.1;
      recordLuckNote(luck, operateType, judgment);
    }
    if (mission === 3) streams.set(soloModeReplay.mission - kind * 2 + 1, observedAt, range.just);
  }
  if (judgment >= 3) soloMode.combo++;
  else {
    soloMode.combo = 0;
    soloMode.brokeCombo = true;
    soloMode.life = Math.max(0, soloMode.life - (judgment === 2 ? 50 : 100));
  }
  soloMode.bestCombo = Math.max(soloMode.bestCombo, soloMode.combo);
  soloMode.judged++;

  if (soloModeConfig.weightedNotes > 0 && judgment >= 3) {
    const weight = isLightScoreNote(operateType) ? 0.1 : 1;
    let value = soloModeConfig.multiplier;
    value = sourceMultiply(value, weight);
    value = sourceMultiply(value, noteScoreRatio(judgment));
    value = sourceMultiply(value, sourceMultiply(ordinaryComboFactor(soloMode.beforeTimestamp), missionBonus));
    value = sourceMultiply(value, luckBonus);
    const base = Math.floor(sourceFloat(value / sourceFloat(soloModeConfig.weightedNotes)));
    const lifeFactor = soloMode.life > 0 ? 1 : 0.3;
    const assistFactor = options.assistMode ? sourceFloat(nativeAssist.scorePercent / 100) : 1;
    soloMode.score += Math.floor(sourceMultiply(sourceMultiply(base, lifeFactor), assistFactor));
  }
  streams.set(soloModeReplay.score, observedAt, soloMode.score);
  streams.set(soloModeReplay.combo, observedAt, soloMode.bestCombo);
  if (options.assistMode) streams.set(soloModeReplay.assistLevel, observedAt, getAssistState().levelBeforeFrame);
}

/** The previous frame's judged notes carry their own queue links and original timestamps. */
export function settleSoloJudgments() {
  const stage = archetypes.Stage.sharedMemory.get(1);
  let next = stage.modeFirst;
  if (next === 0) return;
  stage.modeFirst = 0;
  stage.modeLast = 0;
  while (next > 0) {
    const event = archetypes.NormalTapNote.sharedMemory.get(next - 1);
    const note = archetypes.NormalTapNote.import.get(next - 1);
    recordAssistJudgment(note.operateType, Math.floor(event.modeJudgement / 8), event.modeEventAt);
    recordSoloNote(note.operateType, note.originalTimeMs, event.modeJudgement % 8, event.modeEventAt);
    next = event.modeNext;
  }
}

export function updateSoloLuck(nowMs: number) {
  const index = gekisouRangeAt(nowMs);
  if (index < 0 || soloModeConfig.ranges.get(index).mission !== 2) return;
  const state = getLuckState(index);
  if (state.lots === 0) return;
  consumeLuckDraw(state);
  streams.set(soloModeReplay.mission - index * 2, time.now, state.points);
}

/** The result stream keeps the original assist grade separate from Sonolus' stock grade. */
export function finishSoloMode() {
  const result = getSoloResult();
  if (result.finished || soloModeConfig.noteCount <= 0 || result.judged < soloModeConfig.noteCount) return;
  result.finished = true;
  result.grade = options.assistMode ? (result.brokeCombo ? 1 : 2) : 3;
  streams.set(soloModeReplay.result, time.now, result.grade);
}

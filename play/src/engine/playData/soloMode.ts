import { soloModeReplay } from "../../../../shared/src/engine/data/soloMode.js";
import { options } from "../configuration/options.js";
import { getAssistState, recordAssistJudgment } from "./assist.js";
import { archetypes } from "./archetypes/index.js";
import { consumeLuckDraw, recordLuckNote } from "../../../../shared/src/engine/data/gekisouLuck.js";

export const soloModeConfig = levelData({
  ranges: Tuple(3, { mission: Number, start: Number, end: Number }),
});

export const gekisouProgressMemory = Tuple(3, { combo: Number, just: Number });

export const getGekisouProgress = (index: number) => archetypes.Initialization.sharedMemory.get(0).gekisou.get(index);
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

function recordGekisouNote(operateType: number, noteMs: number, judgment: number, observedAt: number) {
  const index = gekisouRangeAt(noteMs);
  if (index < 0) return;
  const mission = soloModeConfig.ranges.get(index).mission;
  const progress = getGekisouProgress(index);
  if (mission === 1) {
    progress.combo = judgment >= 3 ? progress.combo + 1 : 0;
    streams.set(soloModeReplay.mission - index * 2, observedAt, progress.combo);
  } else if (mission === 2) {
    const luck = getLuckState(index);
    const oldGauge = luck.gauge;
    recordLuckNote(luck, operateType, judgment, Math.random());
    if (luck.gauge !== oldGauge)
      streams.set(soloModeReplay.luckGauge - index, observedAt, luck.gauge + (luck.rushCombo > 0 ? 256 : 0));
  } else if (mission === 3) {
    if (judgment === 6) progress.just++;
    streams.set(soloModeReplay.mission - index * 2 + 1, observedAt, progress.just);
  }
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
    recordGekisouNote(note.operateType, note.originalTimeMs, event.modeJudgement % 8, event.modeEventAt);
    if (options.assistMode)
      streams.set(soloModeReplay.assistLevel, event.modeEventAt, getAssistState().levelBeforeFrame);
    next = event.modeNext;
  }
}

export function updateSoloLuck(nowMs: number) {
  for (let index = 0; index < 3; index++) {
    const range = soloModeConfig.ranges.get(index);
    if (range.mission !== 2 || range.end <= range.start || nowMs < range.start || nowMs > range.end + 251) continue;
    const state = getLuckState(index);
    if (state.lots === 0) continue;
    consumeLuckDraw(state, time.now, state.nextDraw === 0 ? Math.random() : 0, Math.random());
    streams.set(soloModeReplay.luckDraw - index, time.now, state.lastDraw);
    streams.set(soloModeReplay.luckGauge - index, time.now, state.gauge + (state.rushCombo > 0 ? 256 : 0));
    streams.set(soloModeReplay.mission - index * 2, time.now, state.points);
    break;
  }
}

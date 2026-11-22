import {
  assistCountsTowardLevelDown,
  assistPoints,
  nativeAssist,
} from "../../../../shared/src/engine/data/assist.js";
import { options } from "../configuration/options.js";
import { archetypes } from "./archetypes/index.js";

export const assistMemory = {
  level: Number,
  points: Number,
  perfects: Number,
  levelBeforeFrame: Number,
  resultFrame: Number,
  framePoints: Number,
};

export const getAssistState = () => archetypes.Initialization.sharedMemory.get(0).assist;

export const assistLevel = () => {
  if (!options.assistMode) return 0;
  const assistState = getAssistState();
  return assistState.resultFrame === time.now ? assistState.levelBeforeFrame : assistState.level;
};

/** LiveAssistLevelAdjuster.Update commits the next level after the frame's results. */
export function recordAssistJudgment(operateType: number, judgment: number, observedAt: number) {
  if (!options.assistMode) return;
  const assistState = getAssistState();
  if (assistState.resultFrame !== observedAt) {
    assistState.resultFrame = observedAt;
    assistState.levelBeforeFrame = assistState.level;
    assistState.framePoints = assistState.points;
  }
  if (judgment >= 5) {
    if (!assistCountsTowardLevelDown(operateType)) return;
    assistState.perfects++;
    if (assistState.perfects >= nativeAssist.perfectsToLevelDown) {
      assistState.perfects = 0;
      assistState.level = Math.max(0, assistState.level - 1);
    }
  } else {
    assistState.perfects = 0;
    assistState.framePoints += assistPoints(judgment);
  }
}

export function finishAssistFrame() {
  if (!options.assistMode) return;
  const assistState = getAssistState();
  if (assistState.resultFrame === time.now) return;
  const points = Math.max(0, assistState.framePoints);
  assistState.level = Math.min(nativeAssist.maxLevel, assistState.level + Math.floor(points / nativeAssist.gaugeMax));
  assistState.points =
    assistState.levelBeforeFrame === assistState.level ? points % nativeAssist.gaugeMax : 0;
  assistState.framePoints = assistState.points;
  assistState.levelBeforeFrame = assistState.level;
}

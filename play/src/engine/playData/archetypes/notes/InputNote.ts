import type { Windows } from "../../../../../../shared/src/engine/data/windows.js";
import { assistAreaExtra, assistInputWindow, assistWindows, nativeAssist } from "../../../../../../shared/src/engine/data/assist.js";
import { assistLevel } from "../../assist.js";
import { options } from "../../../configuration/options.js";
import { getHitbox, getNativeJudgmentLeniency } from "../../lane.js";
import { usesSoloMode } from "../../soloMode.js";
import { archetypes } from "../index.js";
import {
  canReceiveInput,
  getInputAccuracy,
  hasInputTargetArrived,
  hasInputWindowEnded,
  isWithinInputWindow,
  usesSourceTiming,
} from "../../inputClock.js";

import { Note } from "./Note.js";

export abstract class InputNote extends Note {
  abstract windows: Windows;
  abstract inputTime: Range;

  modeJudged = this.entityMemory(Boolean);

  updateSequential() {
    if (usesSoloMode() && this.hasInput && !this.modeJudged && this.hasInputWindowEnded) {
      this.recordModeJudgment(1, 1);
    }
  }

  recordModeJudgment(judgment: number, rawJudgment: number) {
    if (this.modeJudged) return;
    this.modeJudged = true;
    this.sharedMemory.modeNext = 0;
    this.sharedMemory.modeJudgement = rawJudgment * 8 + judgment;
    this.sharedMemory.modeEventAt = time.now;

    const stage = archetypes.Stage.sharedMemory.get(1);
    const index = this.info.index + 1;
    if (stage.modeLast === 0) stage.modeFirst = index;
    else archetypes.NormalTapNote.sharedMemory.get(stage.modeLast - 1).modeNext = index;
    stage.modeLast = index;
  }

  get activeWindows() {
    return assistWindows(this.import.judgementType, assistLevel(), this.windows);
  }

  get activeInputWindow() {
    return assistInputWindow(this.import.judgementType, assistLevel(), this.windows.input);
  }

  get activeFullHitbox() {
    const level = assistLevel();
    const rect = new Rect(this.fullHitbox);
    if (level > 0) {
      const operateType = this.import.operateType;
      const size = this.import.size;
      getHitbox({
        l: this.import.lane - size,
        r: this.import.lane + size,
        leniency:
          getNativeJudgmentLeniency({
            operateType,
            originalCritical: this.import.originalCritical,
            originalSize: operateType === 120 ? size * 4 : this.import.originalSize,
          }) + assistAreaExtra(operateType, level),
      }).copyTo(rect);
    }
    return rect;
  }

  get widestInputWindow() {
    const level = options.assistMode ? nativeAssist.maxLevel : 0;
    return assistInputWindow(this.import.judgementType, level, this.windows.input);
  }

  get inputTargetTime() {
    return usesSourceTiming() ? this.import.originalTimeMs / 1000 : this.targetTime;
  }

  get canReceiveInput() {
    return canReceiveInput(this.inputTime, this.import.originalTimeMs, this.activeInputWindow);
  }

  get isWithinInputWindow() {
    return isWithinInputWindow(this.inputTime, this.import.originalTimeMs, this.activeInputWindow);
  }

  get hasInputWindowEnded() {
    return hasInputWindowEnded(this.inputTime, this.import.originalTimeMs, this.activeInputWindow);
  }

  get hasInputTargetArrived() {
    return hasInputTargetArrived(this.targetTime, this.import.originalTimeMs);
  }

  inputAccuracy(hitTime: number, atTarget: boolean) {
    return getInputAccuracy(hitTime, this.targetTime, this.import.originalTimeMs, atTarget);
  }
}

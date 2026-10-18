import type { Windows } from "../../../../../../shared/src/engine/data/windows.js";
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

  get inputTargetTime() {
    return usesSourceTiming() ? this.import.originalTimeMs / 1000 : this.targetTime;
  }

  get canReceiveInput() {
    return canReceiveInput(this.inputTime, this.import.originalTimeMs, this.windows.input);
  }

  get isWithinInputWindow() {
    return isWithinInputWindow(this.inputTime, this.import.originalTimeMs, this.windows.input);
  }

  get hasInputWindowEnded() {
    return hasInputWindowEnded(this.inputTime, this.import.originalTimeMs, this.windows.input);
  }

  get hasInputTargetArrived() {
    return hasInputTargetArrived(this.targetTime, this.import.originalTimeMs);
  }

  inputAccuracy(hitTime: number, atTarget: boolean) {
    return getInputAccuracy(hitTime, this.targetTime, this.import.originalTimeMs, atTarget);
  }
}

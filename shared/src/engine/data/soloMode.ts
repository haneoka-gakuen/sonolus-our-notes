export const soloModeImports = {
  power: { name: "ourNotesBandPower", type: Number },
  difficulty: { name: "ourNotesPlayLevel", type: Number },
  weightedNotes: { name: "ourNotesConvertedNoteCount", type: Number },
  noteCount: { name: "ourNotesJudgedNoteCount", type: Number },
  mission1: { name: "ourNotesMission1", type: Number },
  start1: { name: "ourNotesMissionStart1", type: Number },
  end1: { name: "ourNotesMissionEnd1", type: Number },
  mission2: { name: "ourNotesMission2", type: Number },
  start2: { name: "ourNotesMissionStart2", type: Number },
  end2: { name: "ourNotesMissionEnd2", type: Number },
  mission3: { name: "ourNotesMission3", type: Number },
  start3: { name: "ourNotesMissionStart3", type: Number },
  end3: { name: "ourNotesMissionEnd3", type: Number },
};

export const soloModeReplay = {
  score: -10010,
  assistLevel: -10011,
  combo: -10012,
  result: -10013,
  mission: -10100,
};

export const canJudgeJust = (type: number) =>
  type === 1 || type === 2 || type === 5 || type === 10 || type === 12 || type === 15;

// MasterLiveNoteParameter. Attached trace and slide ticks carry 10% weight.
export const isLightScoreNote = (operateType: number) =>
  operateType === 21 ||
  (operateType >= 60 && operateType <= 63) ||
  operateType === 104 ||
  operateType === 105 ||
  operateType === 120;

// MasterLiveComboScoreBonus, with separate ordinary and GEKISO combo ladders.
export const ordinaryComboFactor = (combo: number) => {
  const steps = Math.min(50, Math.floor(combo / 10));
  return 1 + Math.min(steps, 10) * 0.01 + Math.max(0, steps - 10) * 0.005;
};
export const gekisouComboFactor = (combo: number) => {
  const steps = Math.min(40, Math.floor(combo / 10));
  return 1 + Math.min(steps, 20) * 0.01 + Math.max(0, steps - 20) * 0.005;
};

export const noteScoreRatio = (judgment: number) =>
  judgment === 6 ? 2.3 : judgment === 5 ? 1 : judgment === 4 ? 0.8 : judgment === 3 ? 0.5 : 0;

/** The source calculator uses Float32 before both FloorToInt operations. */
export function sourceFloat(value: number) {
  if (value === 0) return 0;
  const unit = Math.pow(2, Math.floor(Math.log(Math.abs(value)) / Math.LN2) - 23);
  const multiple = value / unit;
  const low = Math.floor(multiple);
  const fraction = multiple - low;
  const up = fraction > 0.5 || (fraction === 0.5 && low % 2 !== 0);
  return (low + (up ? 1 : 0)) * unit;
}

export const sourceMultiply = (left: number, right: number) => sourceFloat(sourceFloat(left) * sourceFloat(right));

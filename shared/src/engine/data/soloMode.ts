export const soloModeImports = {
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
  assistLevel: -10011,
  mission: -10100,
  luckGauge: -10110,
  luckDraw: -10120,
};

export const canJudgeJust = (type: number) =>
  type === 1 || type === 2 || type === 5 || type === 10 || type === 12 || type === 15;

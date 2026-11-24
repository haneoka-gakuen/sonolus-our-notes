export const luckMemory = {
  gauge: Number,
  lots: Number,
  rushCombo: Number,
  nextDraw: Number,
  points: Number,
  lastDraw: Number,
  lastDrawAt: Number,
};

export interface LuckState {
  gauge: number;
  lots: number;
  rushCombo: number;
  nextDraw: number;
  points: number;
  lastDraw: number;
  lastDrawAt: number;
}

export const luckGaugeLimit = (rushCombo: number) => rushCombo > 0 ? 70 : 140;

function luckCharge(operateType: number, judgment: number, roll: number) {
  if (
    judgment <= 1 ||
    operateType === 0 ||
    operateType === 80 ||
    operateType === 82 ||
    (operateType >= 100 && operateType <= 105) ||
    operateType === 121 ||
    operateType === 122
  )
    return 0;
  if (operateType === 21 || (operateType >= 60 && operateType <= 63) || operateType === 120) {
    return 2;
  }
  if (judgment === 3) return 3;
  if (judgment === 4) {
    return roll < 0.3 ? 6 : roll < 0.8 ? 5 : 7;
  }
  if (judgment >= 5) {
    return roll < 0.2 ? 9 : roll < 0.5 ? 8 : 7;
  }
  return 0;
}

function nextDraw(rushCombo: number, roll: number) {
  if (rushCombo === 0) return roll < 0.1 ? 0 : roll < 0.36 ? 1 : roll < 0.56 ? 2 : 3;
  const ordinary = rushCombo === 1 ? 0.1 : rushCombo === 2 ? 0.3 : rushCombo === 3 ? 0.5 : 0.7;
  return roll < ordinary ? 2 : 3;
}

/** MasterLiveGekisouLuckBasePoint and MasterLiveGekisouLuckBonusLot, with no deck skill buffs. */
export function recordLuckNote(state: LuckState, operateType: number, judgment: number, roll: number) {
  const oldMax = luckGaugeLimit(state.rushCombo);
  state.gauge += luckCharge(operateType, judgment, roll);
  if (state.gauge >= oldMax) {
    const earned = Math.floor(state.gauge / oldMax);
    state.lots += earned;
    state.gauge -= earned * oldMax;
  }
}

export function consumeLuckDraw(state: LuckState, now: number, initialRoll: number, followingRoll: number) {
  if (state.lots < 1) return;
  const draw = state.nextDraw === 0 ? nextDraw(0, initialRoll) : state.nextDraw - 1;
  state.lots--;
  state.lastDraw = draw + 1;
  state.lastDrawAt = now;
  state.points += draw === 1 ? 5 : draw >= 2 ? 10 : 0;
  const oldMax = luckGaugeLimit(state.rushCombo);
  state.rushCombo = draw === 3 ? state.rushCombo + 1 : 0;
  const newMax = luckGaugeLimit(state.rushCombo);
  if (oldMax !== newMax && state.gauge > newMax) {
    const earned = Math.floor(state.gauge / newMax);
    state.lots += earned;
    state.gauge -= earned * newMax;
  }
  state.nextDraw = nextDraw(state.rushCombo, followingRoll) + 1;
}

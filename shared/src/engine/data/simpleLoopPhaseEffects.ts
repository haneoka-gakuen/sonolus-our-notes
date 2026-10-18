export const SIMPLE_LOOP_PHASE_EFFECTS = {
  sourceSimpleLoopPhase01: "Our Notes Source SimpleLoop Point Phase 01",
  sourceSimpleLoopPhase02: "Our Notes Source SimpleLoop Point Phase 02",
  sourceSimpleLoopPhase03: "Our Notes Source SimpleLoop Point Phase 03",
  sourceSimpleLoopPhase04: "Our Notes Source SimpleLoop Point Phase 04",
  sourceSimpleLoopPhase05: "Our Notes Source SimpleLoop Point Phase 05",
  sourceSimpleLoopPhase06: "Our Notes Source SimpleLoop Point Phase 06",
  sourceSimpleLoopPhase07: "Our Notes Source SimpleLoop Point Phase 07",
  sourceSimpleLoopPhase08: "Our Notes Source SimpleLoop Point Phase 08",
  sourceSimpleLoopPhase09: "Our Notes Source SimpleLoop Point Phase 09",
  sourceSimpleLoopPhase10: "Our Notes Source SimpleLoop Point Phase 10",
  sourceSimpleLoopPhase11: "Our Notes Source SimpleLoop Point Phase 11",
  sourceSimpleLoopPhase12: "Our Notes Source SimpleLoop Point Phase 12",
  sourceSimpleLoopPhase13: "Our Notes Source SimpleLoop Point Phase 13",
  sourceSimpleLoopPhase14: "Our Notes Source SimpleLoop Point Phase 14",
  sourceSimpleLoopPhase15: "Our Notes Source SimpleLoop Point Phase 15",
} as const;

type PhaseEffect = { id: number; exists: boolean };
export type SimpleLoopPhaseEffects = { sourceSimpleLoop: PhaseEffect } & {
  [K in keyof typeof SIMPLE_LOOP_PHASE_EFFECTS]: PhaseEffect;
};

export const sourceLoopPhaseEffectsExist = (effects: SimpleLoopPhaseEffects) =>
  effects.sourceSimpleLoopPhase01.exists &&
  effects.sourceSimpleLoopPhase02.exists &&
  effects.sourceSimpleLoopPhase03.exists &&
  effects.sourceSimpleLoopPhase04.exists &&
  effects.sourceSimpleLoopPhase05.exists &&
  effects.sourceSimpleLoopPhase06.exists &&
  effects.sourceSimpleLoopPhase07.exists &&
  effects.sourceSimpleLoopPhase08.exists &&
  effects.sourceSimpleLoopPhase09.exists &&
  effects.sourceSimpleLoopPhase10.exists &&
  effects.sourceSimpleLoopPhase11.exists &&
  effects.sourceSimpleLoopPhase12.exists &&
  effects.sourceSimpleLoopPhase13.exists &&
  effects.sourceSimpleLoopPhase14.exists &&
  effects.sourceSimpleLoopPhase15.exists;

export const sourceLoopPhaseEffectId = (index: number, effects: SimpleLoopPhaseEffects) => {
  switch (index) {
    case 1:
      return effects.sourceSimpleLoopPhase01.id;
    case 2:
      return effects.sourceSimpleLoopPhase02.id;
    case 3:
      return effects.sourceSimpleLoopPhase03.id;
    case 4:
      return effects.sourceSimpleLoopPhase04.id;
    case 5:
      return effects.sourceSimpleLoopPhase05.id;
    case 6:
      return effects.sourceSimpleLoopPhase06.id;
    case 7:
      return effects.sourceSimpleLoopPhase07.id;
    case 8:
      return effects.sourceSimpleLoopPhase08.id;
    case 9:
      return effects.sourceSimpleLoopPhase09.id;
    case 10:
      return effects.sourceSimpleLoopPhase10.id;
    case 11:
      return effects.sourceSimpleLoopPhase11.id;
    case 12:
      return effects.sourceSimpleLoopPhase12.id;
    case 13:
      return effects.sourceSimpleLoopPhase13.id;
    case 14:
      return effects.sourceSimpleLoopPhase14.id;
    case 15:
      return effects.sourceSimpleLoopPhase15.id;
    default:
      return effects.sourceSimpleLoop.id;
  }
};

export const soloModeHudAtlas = { x: 1850, y: 4028, w: 142, h: 67 };

export const soloModeHudFrames = {
  digit0: [1, 1, 12, 17, "0"],
  digit1: [15, 1, 12, 17, "1"],
  digit2: [29, 1, 12, 17, "2"],
  digit3: [43, 1, 12, 17, "3"],
  digit4: [57, 1, 12, 17, "4"],
  digit5: [71, 1, 12, 17, "5"],
  digit6: [85, 1, 12, 17, "6"],
  digit7: [99, 1, 12, 17, "7"],
  digit8: [113, 1, 12, 17, "8"],
  digit9: [127, 1, 12, 17, "9"],
  modeGekisou: [1, 21, 36, 12, "GEKISO"],
  modeCombo: [39, 21, 34, 12, "COMBO"],
  modeJust: [75, 21, 27, 12, "JUST"],
  modeLuck: [104, 21, 35, 12, "LUCK"],
  modeAssist: [1, 36, 43, 12, "ASSIST"],
  modeScore: [46, 36, 38, 12, "SCORE"],
  modeMaxCombo: [86, 36, 54, 12, "MAX COMBO"],
  modeAssistFullCombo: [1, 51, 132, 14, "ASSIST FULL COMBO"],
} as const;

export const soloHudSpriteNames = Object.fromEntries(
  Object.keys(soloModeHudFrames).map(key => [key, `Our Notes Solo ${key}`]),
) as Record<keyof typeof soloModeHudFrames, string>;

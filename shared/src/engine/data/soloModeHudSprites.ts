import { GEKISOU_MISSION_HUD_ROM } from "./gekisouStageRomAbi.js";

type FrameIndices<Count extends number, Frames extends number[] = []> =
  Frames["length"] extends Count ? Frames[number] : FrameIndices<Count, [...Frames, Frames["length"]]>;
type SymbolFrame = FrameIndices<typeof GEKISOU_MISSION_HUD_ROM.symbolFrames>;

const symbolSprites = <Prefix extends string>(prefix: Prefix, name: string) =>
  Object.fromEntries(Array.from({ length: GEKISOU_MISSION_HUD_ROM.symbolFrames }, (_, index) =>
    [`${prefix}${index}`, `Our Notes GEKISO ${name} ${index}`],
  )) as Record<`${Prefix}${SymbolFrame}`, string>;

const fixedSprites = {
  digit0: "Our Notes GEKISO Digit 0",
  digit1: "Our Notes GEKISO Digit 1",
  digit2: "Our Notes GEKISO Digit 2",
  digit3: "Our Notes GEKISO Digit 3",
  digit4: "Our Notes GEKISO Digit 4",
  digit5: "Our Notes GEKISO Digit 5",
  digit6: "Our Notes GEKISO Digit 6",
  digit7: "Our Notes GEKISO Digit 7",
  digit8: "Our Notes GEKISO Digit 8",
  digit9: "Our Notes GEKISO Digit 9",
  countdown1: "Our Notes GEKISO Countdown 1",
  countdown2: "Our Notes GEKISO Countdown 2",
  countdown3: "Our Notes GEKISO Countdown 3",
  modeCombo: "Our Notes GEKISO Challenge Combo",
  modeLuck: "Our Notes GEKISO Challenge Luck",
  modeJust: "Our Notes GEKISO Challenge Just",
  ready: "Our Notes GEKISO Ready",
  divider: "Our Notes GEKISO Divider",
  countCombo: "Our Notes GEKISO Count Combo",
  countLuck: "Our Notes GEKISO Count Luck",
  countJust: "Our Notes GEKISO Count Just",
  luckGaugeBase: "Our Notes GEKISO Luck Gauge Base",
  luckGauge: "Our Notes GEKISO Luck Gauge",
  luckGaugeLeft: "Our Notes GEKISO Luck Gauge Left",
  luckGaugeRight: "Our Notes GEKISO Luck Gauge Right",
  luckRushGauge: "Our Notes GEKISO Luck Rush Gauge",
  noLuck: "Our Notes GEKISO No Luck",
  luck: "Our Notes GEKISO Lucky",
  superLuck: "Our Notes GEKISO Super Lucky",
  luckRush: "Our Notes GEKISO Luck Rush",
  luckBase: "Our Notes GEKISO Lucky Backlight",
  superLuckBase: "Our Notes GEKISO Super Lucky Backlight",
  luckRushStar: "Our Notes GEKISO Luck Rush Star",
  modeAssist: "Our Notes Assist Title",
} as const;

const luckSymbols = symbolSprites("luckSymbol", "Luck Symbol");
const rushSymbols = symbolSprites("rushSymbol", "Rush Symbol");
const assistSprites = {
  assistTitleLeft: "Our Notes Assist Title Left",
  assistTitleRight: "Our Notes Assist Title Right",
  assistLevel0: "Our Notes Assist Level 0",
  assistLevel1: "Our Notes Assist Level 1",
  assistLevel2: "Our Notes Assist Level 2",
  assistLevel3: "Our Notes Assist Level 3",
  assistLevel4: "Our Notes Assist Level 4",
  assistLevel5: "Our Notes Assist Level 5",
} as const;
export const soloHudSpriteNames = {
  ...fixedSprites,
  ...luckSymbols,
  ...rushSymbols,
  ...assistSprites,
} as typeof fixedSprites & typeof luckSymbols & typeof rushSymbols & typeof assistSprites;

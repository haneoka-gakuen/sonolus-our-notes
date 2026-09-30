// LiveSpritePartsNoteViewBase.OnSetViewWidth draws the note caps beyond the
// note rect by the authored per-tilt overhangs (left/right, 24-lane units).
// Only the straight (tilt 0) part is consumed here; the values below are the
// bundled skins' authored tilt-0 rows. The active skin is identified by the
// one "Our Notes Native Flick Arrow Animation Skin NNN" marker its pack
// carries, so the engine reads the marker table instead of guessing.

export type NativeNoteKindKey =
  "tap" | "slide-start" | "slide-node" | "slide-end" | "flick" | "flick-left" | "flick-right" | "trace";

type Overhang = readonly [left: number, right: number];

export const NATIVE_NOTE_CAP_OVERHANGS: Readonly<
  Record<"skin001" | "skin002" | "skin003", Readonly<Record<NativeNoteKindKey, Overhang>>>
> = {
  skin001: {
    tap: [0, 0],
    "slide-start": [0, 0],
    "slide-node": [0, 0],
    "slide-end": [0.18000000715255737, 0.18000000715255737],
    flick: [0, 0],
    "flick-left": [0, 0],
    "flick-right": [0, 0],
    trace: [0, 0],
  },
  skin002: {
    tap: [0.15000000596046448, 0],
    "slide-start": [0.15000000596046448, 0],
    "slide-node": [0.12999999523162842, 0],
    "slide-end": [0.15000000596046448, 0],
    flick: [0.1599999964237213, 0],
    "flick-left": [0.1599999964237213, 0],
    "flick-right": [0.1599999964237213, 0],
    trace: [0.09000000357627869, 0],
  },
  skin003: {
    tap: [0.12999999523162842, 0],
    "slide-start": [0.12999999523162842, 0],
    "slide-node": [-0.09000000357627869, 0],
    "slide-end": [0.12999999523162842, 0],
    flick: [0.12999999523162842, 0],
    "flick-left": [0.12999999523162842, 0],
    "flick-right": [0.12999999523162842, 0],
    trace: [0.12999999523162842, 0],
  },
};

/** Chart 24-lane units -> the engine's 12-unit stage space. */
export const CHART_LANE_TO_STAGE = 0.5;

/** Static property keys keep the authored table usable by the Sonolus compiler. */
export const nativeNoteCapLeftOverhang = (operateType: number, skin002: boolean, skin003: boolean) => {
  if (skin002) {
    if (operateType === 1 || operateType === 101) return NATIVE_NOTE_CAP_OVERHANGS.skin002.tap[0] * CHART_LANE_TO_STAGE;
    if (operateType === 20) return NATIVE_NOTE_CAP_OVERHANGS.skin002["slide-start"][0] * CHART_LANE_TO_STAGE;
    if (operateType === 21 || operateType === 120)
      return NATIVE_NOTE_CAP_OVERHANGS.skin002["slide-node"][0] * CHART_LANE_TO_STAGE;
    if (operateType === 22) return NATIVE_NOTE_CAP_OVERHANGS.skin002["slide-end"][0] * CHART_LANE_TO_STAGE;
    if (operateType === 40 || operateType === 41 || operateType === 42 || operateType === 102)
      return NATIVE_NOTE_CAP_OVERHANGS.skin002.flick[0] * CHART_LANE_TO_STAGE;
    if (
      operateType === 60 ||
      operateType === 61 ||
      operateType === 62 ||
      operateType === 63 ||
      operateType === 104 ||
      operateType === 105
    )
      return NATIVE_NOTE_CAP_OVERHANGS.skin002.trace[0] * CHART_LANE_TO_STAGE;
    return 0;
  }
  if (skin003) {
    if (operateType === 1 || operateType === 101) return NATIVE_NOTE_CAP_OVERHANGS.skin003.tap[0] * CHART_LANE_TO_STAGE;
    if (operateType === 20) return NATIVE_NOTE_CAP_OVERHANGS.skin003["slide-start"][0] * CHART_LANE_TO_STAGE;
    if (operateType === 21 || operateType === 120)
      return NATIVE_NOTE_CAP_OVERHANGS.skin003["slide-node"][0] * CHART_LANE_TO_STAGE;
    if (operateType === 22) return NATIVE_NOTE_CAP_OVERHANGS.skin003["slide-end"][0] * CHART_LANE_TO_STAGE;
    if (operateType === 40 || operateType === 41 || operateType === 42 || operateType === 102)
      return NATIVE_NOTE_CAP_OVERHANGS.skin003.flick[0] * CHART_LANE_TO_STAGE;
    if (
      operateType === 60 ||
      operateType === 61 ||
      operateType === 62 ||
      operateType === 63 ||
      operateType === 104 ||
      operateType === 105
    )
      return NATIVE_NOTE_CAP_OVERHANGS.skin003.trace[0] * CHART_LANE_TO_STAGE;
    return 0;
  }
  return operateType === 22 ? NATIVE_NOTE_CAP_OVERHANGS.skin001["slide-end"][0] * CHART_LANE_TO_STAGE : 0;
};

export const nativeNoteCapRightOverhang = (operateType: number, skin002: boolean, skin003: boolean) =>
  !skin002 && !skin003 && operateType === 22
    ? NATIVE_NOTE_CAP_OVERHANGS.skin001["slide-end"][1] * CHART_LANE_TO_STAGE
    : 0;

import type { LevelData, LevelDataEntity } from "@sonolus/core";

type NoteOptions = { direction?: number; slide?: string; judgementType?: number };

function note(
  archetype: string,
  name: string,
  beat: number,
  lane: number,
  size: number,
  operateType: number,
  { direction, slide, judgementType = 1 }: NoteOptions = {},
): LevelDataEntity {
  return {
    archetype,
    name,
    data: [
      { name: "#BEAT", value: beat },
      { name: "lane", value: lane },
      { name: "size", value: size },
      { name: "operateType", value: operateType },
      { name: "judgementType", value: judgementType },
      { name: "originalTimeMs", value: beat * 500 },
      { name: "originalTick", value: beat * 480 },
      { name: "originalSize", value: size * 4 },
      ...(direction === undefined ? [] : [{ name: "direction", value: direction }]),
      ...(slide === undefined ? [] : [{ name: "slide", ref: slide }]),
    ],
  };
}

function connector(name: string, start: string, end: string, head: string, tail: string): LevelDataEntity {
  return {
    archetype: "NormalActiveSlideConnector",
    name,
    data: [
      { name: "start", ref: start },
      { name: "end", ref: end },
      { name: "head", ref: head },
      { name: "tail", ref: tail },
    ],
  };
}

/** A short original chart with single notes, both side flicks and a moving hold. */
export const exampleLevel: LevelData = {
  bgmOffset: 0,
  entities: [
    {
      archetype: "Initialization",
      data: [
        { name: "ourNotesTimingProfile", value: 1 },
        { name: "ourNotesPlayLevel", value: 5 },
        { name: "ourNotesJudgedNoteCount", value: 10 },
        { name: "ourNotesConvertedNoteCount", value: 10 },
        { name: "ourNotesMission1", value: 1 },
        { name: "ourNotesMissionStart1", value: 1900 },
        { name: "ourNotesMissionEnd1", value: 3100 },
        { name: "ourNotesMission2", value: 2 },
        { name: "ourNotesMissionStart2", value: 3900 },
        { name: "ourNotesMissionEnd2", value: 6100 },
        { name: "ourNotesMission3", value: 3 },
        { name: "ourNotesMissionStart3", value: 6900 },
        { name: "ourNotesMissionEnd3", value: 9600 },
      ],
    },
    { archetype: "Stage", data: [] },
    { archetype: "#BPM_CHANGE", data: [{ name: "#BEAT", value: 0 }, { name: "#BPM", value: 120 }] },
    { archetype: "#TIMESCALE_CHANGE", data: [{ name: "#BEAT", value: 0 }, { name: "#TIMESCALE", value: 1 }] },
    note("NormalTapNote", "tap-left", 4, -2, 1, 1),
    note("NormalTapNote", "tap-right", 5, 2, 1.5, 1),
    note("NormalFlickNote", "flick-left", 6, -2, 1.5, 40, { direction: -1, judgementType: 5 }),
    note("NormalFlickNote", "flick-right", 8, 2, 1.5, 40, { direction: 1, judgementType: 5 }),
    note("NormalFlickNote", "flick-up", 10, 0, 2, 40, { direction: 0, judgementType: 5 }),
    note("NormalSlideStartNote", "hold-start", 12, -2, 1, 20, { judgementType: 10 }),
    note("NormalSlideTickNote", "hold-turn", 14, 0, 1.5, 21, { judgementType: 21 }),
    note("NormalSlideEndFlickNote", "hold-end", 16, 2, 1.5, 42, { direction: 1, slide: "hold-right", judgementType: 12 }),
    connector("hold-left", "hold-start", "hold-end", "hold-start", "hold-turn"),
    connector("hold-right", "hold-start", "hold-end", "hold-turn", "hold-end"),
    note("NormalTapNote", "tap-final-left", 19, -2, 1, 1),
    note("NormalTapNote", "tap-final-right", 19, 2, 1, 1),
    { archetype: "SimLine", data: [{ name: "a", ref: "tap-final-left" }, { name: "b", ref: "tap-final-right" }] },
  ],
};

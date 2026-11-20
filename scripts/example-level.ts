import type { LevelData, LevelDataEntity } from "@sonolus/core";

type NoteOptions = { direction?: number; slide?: string };

function note(
  archetype: string,
  name: string,
  beat: number,
  lane: number,
  size: number,
  operateType: number,
  { direction, slide }: NoteOptions = {},
): LevelDataEntity {
  return {
    archetype,
    name,
    data: [
      { name: "#BEAT", value: beat },
      { name: "lane", value: lane },
      { name: "size", value: size },
      { name: "operateType", value: operateType },
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
    { archetype: "Initialization", data: [] },
    { archetype: "Stage", data: [] },
    { archetype: "#BPM_CHANGE", data: [{ name: "#BEAT", value: 0 }, { name: "#BPM", value: 120 }] },
    { archetype: "#TIMESCALE_CHANGE", data: [{ name: "#BEAT", value: 0 }, { name: "#TIMESCALE", value: 1 }] },
    note("NormalTapNote", "tap-left", 4, -2, 1, 1),
    note("NormalTapNote", "tap-right", 5, 2, 1.5, 1),
    note("NormalFlickNote", "flick-left", 6, -2, 1.5, 40, { direction: -1 }),
    note("NormalFlickNote", "flick-right", 8, 2, 1.5, 40, { direction: 1 }),
    note("NormalFlickNote", "flick-up", 10, 0, 2, 40, { direction: 0 }),
    note("NormalSlideStartNote", "hold-start", 12, -2, 1, 20),
    note("NormalSlideTickNote", "hold-turn", 14, 0, 1.5, 21),
    note("NormalSlideEndFlickNote", "hold-end", 16, 2, 1.5, 42, { direction: 1, slide: "hold-right" }),
    connector("hold-left", "hold-start", "hold-end", "hold-start", "hold-turn"),
    connector("hold-right", "hold-start", "hold-end", "hold-turn", "hold-end"),
    note("NormalTapNote", "tap-final-left", 19, -2, 1, 1),
    note("NormalTapNote", "tap-final-right", 19, 2, 1, 1),
    { archetype: "SimLine", data: [{ name: "a", ref: "tap-final-left" }, { name: "b", ref: "tap-final-right" }] },
  ],
};

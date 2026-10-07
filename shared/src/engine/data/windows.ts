export type Windows = {
    perfect: Range
    great: Range
    good: Range
    bad: Range
    miss: Range
    input: Range
}

const ms = (before: number, after = before) => new Range(-before / 1000, after / 1000)

export const toBucketWindows = (windows: Windows) => ({
    perfect: new Range(Math.round(windows.perfect.min * 1000), Math.round(windows.perfect.max * 1000)),
    great: new Range(Math.round(windows.great.min * 1000), Math.round(windows.great.max * 1000)),
    good: new Range(Math.round(windows.good.min * 1000), Math.round(windows.good.max * 1000)),
})

// MasterLiveJudgementTiming, assist level 0. Sonolus exposes only
// Perfect/Great/Good/Miss, but keeping Bad and the complete input range here
// lets the play archetypes reproduce the original timing boundaries and map
// the unsupported Bad result explicitly. The input range is the union of the
// actual rows, not a shortcut derived from the Miss row. Native Just rows are
// ±2 ms where present; ordinary Sonolus play intentionally does not activate
// that Gekisou-only result.
const normal = {
    perfect: ms(50),
    great: ms(83),
    good: ms(100),
    bad: ms(125),
    miss: ms(130),
    input: ms(130),
}

const flick = {
    perfect: ms(83, 67),
    great: ms(0, 83),
    good: ms(0, 117),
    bad: ms(0, 125),
    miss: ms(0, 130),
    input: ms(83, 130),
}

const slideEnd = {
    perfect: ms(84, 66),
    great: ms(0, 166),
    good: ms(0, 191),
    bad: ms(0, 208),
    miss: ms(0, 150),
    input: ms(84, 208),
}

// SlideBegin (type 10) uses the same symmetric rows as Normal (type 1):
// Perfect 50, Great 83, Good 100, Bad 125, Miss 130 on BOTH sides.
const slideBegin = {
    perfect: ms(50),
    great: ms(83),
    good: ms(100),
    bad: ms(125),
    miss: ms(130),
    input: ms(130),
}

// EasyNormal (type 2) and SlideBeginEasy (type 15) - the `crit` Normal and
// SlideBegin notes (NoteJudgementTypeMap.ConvertJudgementType(op, isCritical))
// have only Perfect and Miss rows. Keep public intermediate buckets inside the
// native Perfect row so they cannot manufacture a Great/Good/Bad result that
// the native table does not contain.
const easy = {
    perfect: ms(67),
    great: ms(67),
    good: ms(67),
    bad: ms(67),
    miss: ms(58, 130),
    input: ms(67, 130),
}

// Types 21/22 likewise have only Perfect and Miss rows, with Miss starting
// at zero on the early side.
const trace = {
    perfect: ms(67),
    great: ms(67),
    good: ms(67),
    bad: ms(67),
    miss: ms(0, 130),
    input: ms(67, 130),
}

export const windows = {
    // NoteJudgementTypeMap.ConvertJudgementType: Normal -> 1, critical
    // Normal -> EasyNormal (2); SlideBegin -> 10, critical SlideBegin -> 15.
    tapNote: { normal, critical: easy },
    flickNote: { normal: flick, critical: flick },
    traceNote: { normal: trace, critical: trace },
    traceFlickNote: { normal: flick, critical: flick },
    slideTraceNote: { normal: trace, critical: trace },
    slideStartNote: { normal: slideBegin, critical: easy },
    slideEndNote: { normal: slideEnd, critical: slideEnd },
    slideEndTraceNote: { normal: trace, critical: trace },
    slideEndFlickNote: { normal: flick, critical: flick },
    slideEndLockoutDuration: 0.25,
}

// LiveSpritePartsNoteViewBase.OnSetViewWidth draws the note caps beyond the
// note rect by the authored per-tilt overhangs (left/right, 24-lane units).
// Only the straight (tilt 0) part is consumed here; the values below are the
// bundled skins' authored tilt-0 rows. The active skin is identified by the
// one "Our Notes Native Flick Arrow Animation Skin skinNNN" marker its pack
// carries, so the engine reads the marker table instead of guessing.

export type NativeNoteKindKey =
    | 'tap'
    | 'slide-start'
    | 'slide-node'
    | 'slide-end'
    | 'flick'
    | 'flick-left'
    | 'flick-right'
    | 'trace'

type Overhang = readonly [left: number, right: number]

export const NATIVE_NOTE_CAP_OVERHANGS: Readonly<
    Record<'skin001' | 'skin002' | 'skin003', Readonly<Record<NativeNoteKindKey, Overhang>>>
> = {
    skin001: {
        tap: [0, 0],
        'slide-start': [0, 0],
        'slide-node': [0, 0],
        'slide-end': [0.18000000715255737, 0.18000000715255737],
        flick: [0, 0],
        'flick-left': [0, 0],
        'flick-right': [0, 0],
        trace: [0, 0],
    },
    skin002: {
        tap: [0.15000000596046448, 0],
        'slide-start': [0.15000000596046448, 0],
        'slide-node': [0.12999999523162842, 0],
        'slide-end': [0.15000000596046448, 0],
        flick: [0.1599999964237213, 0],
        'flick-left': [0.1599999964237213, 0],
        'flick-right': [0.1599999964237213, 0],
        trace: [0.09000000357627869, 0],
    },
    skin003: {
        tap: [0.12999999523162842, 0],
        'slide-start': [0.12999999523162842, 0],
        'slide-node': [-0.09000000357627869, 0],
        'slide-end': [0.12999999523162842, 0],
        flick: [0.12999999523162842, 0],
        'flick-left': [0.12999999523162842, 0],
        'flick-right': [0.12999999523162842, 0],
        trace: [0.12999999523162842, 0],
    },
}

/** Chart 24-lane units -> the engine's 12-unit stage space. */
export const CHART_LANE_TO_STAGE = 0.5

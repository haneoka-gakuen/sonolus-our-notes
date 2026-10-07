/**
 * effect001 hit effects. Every part's projection through LiveGameCamera is baked into its particle transform
 * (see nativeHitFxNames.generated.ts): a projected corner is linear in the note's world centre x and width, so the
 * engine spawns all parts on one quad carrying those two values.
 */
import { nativeStage } from './lane.js'

/** World units per lane (the lane is 19.12 wide, 12 lanes). */
export const fxLaneUnit = nativeStage.laneWidth / 12

/** Spawn quad shared by every part: x1 = note centre, y1 = note width (world units). */
export const fxSpawnQuad = (lane: number, size: number) => ({
    x1: lane * fxLaneUnit,
    y1: 2 * size * fxLaneUnit,
    x2: 0,
    y2: 0,
    x3: 0,
    y3: 0,
    x4: 0,
    y4: 0,
})

export const fxWorldWidth = (size: number) => 2 * size * fxLaneUnit

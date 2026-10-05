import { getNativeJudgmentY, getNativeVanishingPointY, lane, nativeStage } from './lane.js'

/** Extend the existing lane edges below judgment to the viewport bottom. */
export const nativeLaneLineLayout = (
    x: number,
    nearHalfWidth: number,
    farHalfWidth: number,
    lockStageAspectRatio: boolean,
) => {
    const height = lockStageAspectRatio && screen.aspectRatio < nativeStage.targetAspectRatio
        ? screen.w / nativeStage.targetAspectRatio
        : screen.h
    const horizon = getNativeVanishingPointY(height)
    const judgment = getNativeJudgmentY(height)
    const bottom = Math.max(1, (screen.b - horizon) / (judgment - horizon))
    const extension = (bottom - 1) / (1 - lane.t)
    const nearLeft = x - nearHalfWidth
    const nearRight = x + nearHalfWidth
    const farLeft = (x - farHalfWidth) * lane.t
    const farRight = (x + farHalfWidth) * lane.t
    return new Quad({
        x1: nearLeft + (nearLeft - farLeft) * extension,
        x2: farLeft,
        x3: farRight,
        x4: nearRight + (nearRight - farRight) * extension,
        y1: bottom,
        y2: lane.t,
        y3: lane.t,
        y4: bottom,
    })
}

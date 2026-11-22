import { getNativeJudgmentY, getNativeVanishingPointY, lane, nativeStage, projectLaneZ } from './lane.js'

const outsideHalfWidth = nativeStage.outsideLineWidth / 2
const outsideCenter = nativeStage.laneWidth / 2 + outsideHalfWidth
const outsideLength = Math.hypot(nativeStage.cameraHeight, outsideCenter)
const outsideDx = (outsideHalfWidth * nativeStage.cameraHeight) / outsideLength
const outsideDy = (outsideHalfWidth * outsideCenter) / outsideLength

const projectOutsideEdge = (x: number, y: number, z: number) => {
    const scale = projectLaneZ(z - y * nativeStage.cameraPitchSin / nativeStage.cameraPitchCos)
    return {
        x: (x * 12 * scale) / nativeStage.laneWidth,
        y: (1 - y / nativeStage.cameraHeight) * scale,
    }
}

/** The outer LineRenderer faces the camera and spans the entire authored segment. */
export const nativeOutsideLineLayout = (side: -1 | 1) => {
    const x = side * outsideCenter
    const dy = side * outsideDy
    const nearLeft = projectOutsideEdge(x - outsideDx, -dy, 0)
    const farLeft = projectOutsideEdge(x - outsideDx, -dy, nativeStage.laneLength)
    const farRight = projectOutsideEdge(x + outsideDx, dy, nativeStage.laneLength)
    const nearRight = projectOutsideEdge(x + outsideDx, dy, 0)
    return new Quad({
        x1: nearLeft.x, y1: nearLeft.y,
        x2: farLeft.x, y2: farLeft.y,
        x3: farRight.x, y3: farRight.y,
        x4: nearRight.x, y4: nearRight.y,
    })
}

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

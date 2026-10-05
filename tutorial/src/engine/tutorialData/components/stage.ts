import { nativeLaneLineLayout } from '../../../../../shared/src/engine/data/nativeLaneLines.js'
import {
    laneBase,
    nativeJudgmentLineHalfHeight,
    nativeStage,
    projectLaneZ,
} from '../../../../../shared/src/engine/data/lane.js'
import { perspectiveLayout } from '../../../../../shared/src/engine/data/utils.js'
import { layer, skin } from '../skin.js'

const sprites = {
    stage: skin.sprites.sekaiStage,
    judgmentLine: skin.sprites.nativeJudgmentLine,
}

export const stage = {
    update() {
        // Tutorial uses the same authored lane_base as play/watch. Rendering
        // six unrelated PJS lane rectangles here changes the stage silhouette.
        if (!sprites.stage.exists) return

        this.drawSekaiStage()
        this.drawGuidelines()
        this.drawJudgmentLine()
    },

    drawSekaiStage() {
        sprites.stage.draw(
            new Rect(laneBase.layout),
            [layer.stage],
            // Tutorial data cannot access runtime engine options. Match the
            // fresh-user LaneOpacity default used by play and watch.
            laneBase.materialOpacity * 0.8,
        )
    },

    drawJudgmentLine() {
        if (!sprites.judgmentLine.exists) return

        const halfWidth = (nativeStage.judgmentLineWidth / nativeStage.laneWidth) * 6
        sprites.judgmentLine.draw(
            new Rect({
                l: -halfWidth,
                r: halfWidth,
                b: 1 + nativeJudgmentLineHalfHeight,
                t: 1 - nativeJudgmentLineHalfHeight,
            }),
            [layer.judgmentLine],
            1,
        )
    },

    drawGuidelines() {
        // Tutorial uses the fresh-user six-lane/.4 opacity preset. Match
        // Play's ground geometry and source textures, without reading input options.
        if (!skin.sprites.guideline.exists) return
        const opacity = 0.4
        for (let index = 1; index < 24; index++) {
            const main = index % 4 === 0
            const space = !main && index % 2 === 0
            if (!main && !space) continue
            const x = index / 2 - 6
            if (space) {
                if (!skin.sprites.guidelineSpace.exists) continue
                const halfWidth = (0.15 / nativeStage.laneWidth) * 6
                const halfLength = 1.3 / 2
                skin.sprites.guidelineSpace.draw(
                    perspectiveLayout({
                        l: x - halfWidth,
                        r: x + halfWidth,
                        b: projectLaneZ(nativeStage.judgmentZ - halfLength),
                        t: projectLaneZ(nativeStage.judgmentZ + halfLength),
                    }),
                    [layer.judgmentLine],
                    opacity * 0.5019608,
                )
            } else {
                const nearHalfWidth = (0.15 / 2 / nativeStage.laneWidth) * 12
                const farHalfWidth = (0.3 / 2 / nativeStage.laneWidth) * 12
                skin.sprites.guideline.draw(nativeLaneLineLayout(x, nearHalfWidth, farHalfWidth, true), [layer.judgmentLine], opacity)
            }
        }
        if (!skin.sprites.outsideLine.exists) return
        const halfWidth = (nativeStage.outsideLineWidth / 2 / nativeStage.laneWidth) * 12
        const outsideX = 6 + halfWidth
        for (const x of [-outsideX, outsideX]) {
            skin.sprites.outsideLine.draw(nativeLaneLineLayout(x, halfWidth, halfWidth, true), [layer.judgmentLine], opacity)
        }
    },
}

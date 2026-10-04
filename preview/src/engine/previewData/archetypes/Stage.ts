import { options } from '../../configuration/options.js'
import { laneBase, nativeStage } from '../../../../../shared/src/engine/data/lane.js'
import { chart } from '../chart.js'
import { panel } from '../panel.js'
import { print } from '../print.js'
import { layer, line, skin } from '../skin.js'

export class Stage extends Archetype {
    preprocessOrder = 2
    preprocess() {
        canvas.set({
            scroll: Scroll.LeftToRight,
            size: (panel.count * panel.w * screen.h) / 40,
        })
    }

    render() {
        this.renderPanels()

        this.renderBeats()

        this.printTimes()
        this.printMeasures()
    }

    renderPanels() {
        for (let i = 0; i < panel.count; i++) {
            const x = i * panel.w

            const b = 0
            const t = panel.h

            // Keep the chart coordinates orthographic. The backdrop uses the
            // actual native lane material; borders and dividers stay straight.
            if (skin.sprites.previewStage.exists) skin.sprites.previewStage.draw(
                new Rect({
                    l: x - 6,
                    r: x + 6,
                    b,
                    t,
                }),
                [layer.stage],
                laneBase.materialOpacity * options.laneOpacity,
            )

            const dividerHalfWidth = (0.15 / 2 / nativeStage.laneWidth) * 12
            for (let j = 1; j < 6; j++) {
                const divider = x - 6 + j * 2
                if (!skin.sprites.previewDivider.exists) continue
                skin.sprites.previewDivider.draw(
                    new Rect({
                        l: divider - dividerHalfWidth,
                        r: divider + dividerHalfWidth,
                        b,
                        t,
                    }),
                    [layer.stage + 1],
                    options.guidelineOpacity,
                )
            }

            if (!skin.sprites.previewBorder.exists) continue
            const borderWidth = (nativeStage.outsideLineWidth / nativeStage.laneWidth) * 12
            skin.sprites.previewBorder.draw(
                new Rect({
                    l: x - 6 - borderWidth,
                    r: x - 6,
                    b,
                    t,
                }),
                [layer.stage + 2],
                options.guidelineOpacity,
            )
            skin.sprites.previewBorder.draw(
                new Rect({
                    l: x + 6,
                    r: x + 6 + borderWidth,
                    b,
                    t,
                }),
                [layer.stage + 2],
                options.guidelineOpacity,
            )
        }
    }

    renderBeats() {
        if (!options.previewBeat) return

        for (let i = 0; i <= Math.floor(chart.beats); i++) {
            line(skin.sprites.beatLine, i, i % 4 === 0 ? 0.25 : 0.125)
        }
    }

    printTimes() {
        if (!options.previewTime) return

        for (let i = 1; i <= Math.floor(chart.duration); i++) {
            print(i, i, PrintFormat.Time, 0, PrintColor.Neutral, 'left')
        }
    }

    printMeasures() {
        if (!options.previewMeasure) return

        for (let i = 4; i <= Math.floor(chart.beats); i += 4) {
            print(
                i / 4 + 1,
                bpmChanges.at(i).time,
                PrintFormat.MeasureCount,
                0,
                PrintColor.Neutral,
                'right',
            )
        }
    }
}

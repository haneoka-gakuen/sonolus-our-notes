import { getNativeSlideSpriteId } from '../../../../../shared/src/engine/data/nativeSlideSkin.js'
import { approach, note } from '../../../../../shared/src/engine/data/note.js'
import { perspectiveLayout } from '../../../../../shared/src/engine/data/utils.js'
import { segment } from '../segment.js'
import { layer, skin } from '../skin.js'

const sprites = {
    normal: skin.sprites.normalActiveSlideConnectorNormal,
    active: skin.sprites.normalActiveSlideConnectorActive,
}

enum Mode {
    None,
    OverlayIn,
    OverlayOut,
    FallIn,
    FallOut,
    Frozen,
    Active,
}

let mode = tutorialMemory(DataType<Mode>)

export const connector = {
    update() {
        if (!mode) return
        if (!sprites.normal.exists || !sprites.active.exists) return

        if (mode === Mode.OverlayIn || mode === Mode.OverlayOut) {
            const a = Math.unlerpClamped(1, 0.75, segment.time)

            const l = -3
            const r = 3

            const t = 0.5 - (mode === Mode.OverlayIn ? note.h * 9 : 0)
            const b = 0.5 + (mode === Mode.OverlayOut ? note.h * 9 : 0)

            const layout = new Rect({ l, r, t, b })

            if (mode === Mode.OverlayIn) {
                sprites.normal.draw(layout, [layer.note.connector], a)
            } else {
                sprites.active.draw(layout, [layer.note.connector], a)
            }
        } else {
            const first = mode === Mode.FallOut ? Math.clamp(segment.time / 2, 0, 1) : 0
            const last = mode === Mode.FallIn ? Math.clamp(segment.time / 2, 0, 1) : 1
            const clock = mode === Mode.FallIn ? segment.time : mode === Mode.FallOut ? 2 + segment.time : 2
            for (let cell = 0; cell < 16; cell++) {
                const min = Math.max(first, cell / 16)
                const max = Math.min(last, (cell + 1) / 16)
                if (max <= min) continue
                const b = approach(0, 2, clock - min * 2)
                const t = approach(0, 2, clock - max * 2)
                const state = mode === Mode.FallOut || mode === Mode.Active ? 2 : 0
                const id = getNativeSlideSpriteId(skin.sprites, (min + max) / 2, state)
                if (skin.sprites.exists(id)) skin.sprites.draw(id, perspectiveLayout({ l: -2, r: 2, b, t }), [layer.note.connector], 1)
            }
        }
    },

    showOverlayIn() {
        mode = Mode.OverlayIn
    },

    showOverlayOut() {
        mode = Mode.OverlayOut
    },

    showFallIn() {
        mode = Mode.FallIn
    },

    showFallOut() {
        mode = Mode.FallOut
    },

    showFrozen() {
        mode = Mode.Frozen
    },

    showActive() {
        mode = Mode.Active
    },

    clear() {
        mode = Mode.None
    },
}

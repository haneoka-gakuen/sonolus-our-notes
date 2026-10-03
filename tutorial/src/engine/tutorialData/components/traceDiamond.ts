import { approach } from '../../../../../shared/src/engine/data/note.js'
import { getNativeNoteMarkRect } from '../../../../../shared/src/engine/data/nativeNoteGeometry.js'
import { segment } from '../segment.js'
import { layer, skin } from '../skin.js'

const sprites = {
    normal: skin.sprites.normalTraceNoteDiamond,
    flick: skin.sprites.traceFlickNoteDiamond,
}

enum Mode {
    None,
    Overlay,
    Fall,
    Frozen,
}

let mode = tutorialMemory(DataType<Mode>)

let id = tutorialMemory(DataType<0 | SkinSpriteId>)

export const traceDiamond = {
    update() {
        if (!mode) return
        if (!id) return

        const rect = getNativeNoteMarkRect(0, 6,
            skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists)
        if (mode === Mode.Overlay) {
            skin.sprites.draw(id, new Rect(rect).toQuad().translate(0, -1).scale(1.5, 3).translate(0, 0.5),
                [layer.note.tick], Math.unlerpClamped(1, 0.75, segment.time))
        } else skin.sprites.draw(id, new Rect(rect).mul(mode === Mode.Fall ? approach(0, 2, segment.time) : 1), [layer.note.tick], 1)
    },

    showOverlay(type: keyof typeof sprites) {
        mode = Mode.Overlay
        this.setType(type)
    },

    showFall(type: keyof typeof sprites) {
        mode = Mode.Fall
        this.setType(type)
    },

    showFrozen(type: keyof typeof sprites) {
        mode = Mode.Frozen
        this.setType(type)
    },

    clear() {
        mode = Mode.None
    },

    setType(type: keyof typeof sprites) {
        if (type === 'normal') id = sprites.normal.exists ? sprites.normal.id : 0
        else id = sprites.flick.exists ? sprites.flick.id : 0
    },
}

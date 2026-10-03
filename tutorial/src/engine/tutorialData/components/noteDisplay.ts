import { getNativeTutorialNoteRects } from '../../../../../shared/src/engine/data/nativeTutorialGeometry.generated.js'
import { getNativeNoteCapId, getNativeNoteMainIds } from '../../../../../shared/src/engine/data/nativeNoteSprites.generated.js'
import { approach } from '../../../../../shared/src/engine/data/note.js'
import { getNativeNoteKind } from '../../../../../shared/src/engine/data/nativeNoteGeometry.js'
import { nativeNoteLayout } from '../../../../../shared/src/engine/data/nativeNoteLayout.js'
import { segment } from '../segment.js'
import { layer, skin } from '../skin.js'

const noteSprites = {
    normal: {
        left: skin.sprites.normalNoteLeft,
        middle: skin.sprites.normalNoteMiddle,
        right: skin.sprites.normalNoteRight,
    },
    trace: {
        left: skin.sprites.normalTraceNoteLeft,
        middle: skin.sprites.normalTraceNoteMiddle,
        right: skin.sprites.normalTraceNoteRight,
    },
    traceFlick: {
        left: skin.sprites.traceFlickNoteLeft,
        middle: skin.sprites.traceFlickNoteMiddle,
        right: skin.sprites.traceFlickNoteRight,
    },
    slide: {
        left: skin.sprites.slideNoteLeft,
        middle: skin.sprites.slideNoteMiddle,
        right: skin.sprites.slideNoteRight,
    },
    slideEnd: {
        left: skin.sprites.slideEndNoteLeft,
        middle: skin.sprites.slideEndNoteMiddle,
        right: skin.sprites.slideEndNoteRight,
    },
    flick: {
        left: skin.sprites.flickNoteLeft,
        middle: skin.sprites.flickNoteMiddle,
        right: skin.sprites.flickNoteRight,
    },
    flickEnd: {
        left: skin.sprites.flickNoteLeft,
        middle: skin.sprites.flickNoteMiddle,
        right: skin.sprites.flickNoteRight,
    },
}

enum Mode {
    None,
    Overlay,
    Fall,
    Frozen,
}

let mode = tutorialMemory(DataType<Mode>)
let available = tutorialMemory(Boolean)
let decorationId = tutorialMemory(DataType<0 | SkinSpriteId>)

const bodyIds = tutorialMemory({ left: SkinSpriteId, mainLeft: SkinSpriteId, middle: SkinSpriteId, mainRight: SkinSpriteId, right: SkinSpriteId })
const bodyRects = tutorialMemory({ left: Rect, mainLeft: Rect, middle: Rect, mainRight: Rect, right: Rect, mark: Rect })

export const noteDisplay = {
    update() {
        if (!mode || !available) return
        this.draw(bodyIds.left, bodyRects.left, layer.note.body)
        this.draw(bodyIds.mainLeft, bodyRects.mainLeft, layer.note.body)
        this.draw(bodyIds.middle, bodyRects.middle, layer.note.body)
        this.draw(bodyIds.mainRight, bodyRects.mainRight, layer.note.body)
        this.draw(bodyIds.right, bodyRects.right, layer.note.body)
        if (decorationId && skin.sprites.exists(decorationId)) this.draw(decorationId, bodyRects.mark, layer.note.body + 0.5)
    },

    draw(id: SkinSpriteId, rect: RectLike, z: number) {
        if (!skin.sprites.exists(id)) return
        if (mode === Mode.Overlay) {
            skin.sprites.draw(id, new Rect(rect).toQuad().translate(0, -1).scale(1.5, 3).translate(0, 0.5),
                [z], Math.unlerpClamped(1, 0.75, segment.time))
        } else skin.sprites.draw(id, nativeNoteLayout(rect).mul(mode === Mode.Fall ? approach(0, 2, segment.time) : 1), [z], 1)
    },

    showOverlay(type: keyof typeof noteSprites) {
        mode = Mode.Overlay
        this.setType(type)
    },

    showFall(type: keyof typeof noteSprites) {
        mode = Mode.Fall
        this.setType(type)
    },

    showFrozen(type: keyof typeof noteSprites) {
        mode = Mode.Frozen
        this.setType(type)
    },

    clear() {
        mode = Mode.None
    },

    setType(type: keyof typeof noteSprites) {
        available = false
        const operateType = type === 'normal' ? 1 : type === 'slide' ? 20 : type === 'slideEnd' ? 22 : type === 'trace' || type === 'traceFlick' ? 60 : 40
        const kind = getNativeNoteKind(operateType, 0)
        const rects = getNativeTutorialNoteRects(kind,
            skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists)
        const main = getNativeNoteMainIds(skin.sprites, kind)
        bodyIds.left = getNativeNoteCapId(skin.sprites, kind, 2, true)
        bodyIds.right = getNativeNoteCapId(skin.sprites, kind, 2, true)
        bodyIds.mainLeft = main.left
        bodyIds.middle = main.middle
        bodyIds.mainRight = main.right
        new Rect(rects.left).copyTo(bodyRects.left)
        new Rect(rects.mainLeft).copyTo(bodyRects.mainLeft)
        new Rect(rects.middle).copyTo(bodyRects.middle)
        new Rect(rects.mainRight).copyTo(bodyRects.mainRight)
        new Rect(rects.right).copyTo(bodyRects.right)
        new Rect(rects.mark).copyTo(bodyRects.mark)
        decorationId = type === 'normal' ? skin.sprites.tapDecoration.id
            : type === 'slide' ? skin.sprites.slideDecoration.id
            : type === 'flick' || type === 'flickEnd' ? skin.sprites.flickDecoration.id : 0

        if (type === 'normal') available = noteSprites.normal.left.exists && noteSprites.normal.middle.exists && noteSprites.normal.right.exists
        else if (type === 'trace') available = noteSprites.trace.left.exists && noteSprites.trace.middle.exists && noteSprites.trace.right.exists
        else if (type === 'traceFlick') available = noteSprites.traceFlick.left.exists && noteSprites.traceFlick.middle.exists && noteSprites.traceFlick.right.exists
        else if (type === 'slide') available = noteSprites.slide.left.exists && noteSprites.slide.middle.exists && noteSprites.slide.right.exists
        else if (type === 'slideEnd') available = noteSprites.slideEnd.left.exists && noteSprites.slideEnd.middle.exists && noteSprites.slideEnd.right.exists
        else if (type === 'flick') available = noteSprites.flick.left.exists && noteSprites.flick.middle.exists && noteSprites.flick.right.exists
        else available = noteSprites.flickEnd.left.exists && noteSprites.flickEnd.middle.exists && noteSprites.flickEnd.right.exists
    },
}

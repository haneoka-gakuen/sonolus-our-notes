import { getNativeTutorialNoteRects } from '../../../../../shared/src/engine/data/nativeTutorialGeometry.generated.js'
import { getNativeNoteCapId, getNativeNoteMainIds } from '../../../../../shared/src/engine/data/nativeNoteSprites.generated.js'
import { nativeNoteLayout } from '../../../../../shared/src/engine/data/nativeNoteLayout.js'
import { layer, skin } from '../skin.js'

const sprites = {
    left: skin.sprites.slideNoteLeft,
    middle: skin.sprites.slideNoteMiddle,
    right: skin.sprites.slideNoteRight,
}

let mode = tutorialMemory(Boolean)

const ids = tutorialMemory({ left: SkinSpriteId, mainLeft: SkinSpriteId, middle: SkinSpriteId, mainRight: SkinSpriteId, right: SkinSpriteId })
const layouts = tutorialMemory({ left: Quad, mainLeft: Quad, middle: Quad, mainRight: Quad, right: Quad })

export const slide = {
    update() {
        if (!mode) return
        if (!sprites.left.exists || !sprites.middle.exists || !sprites.right.exists) return

        this.draw(ids.left, layouts.left)
        this.draw(ids.mainLeft, layouts.mainLeft)
        this.draw(ids.middle, layouts.middle)
        this.draw(ids.mainRight, layouts.mainRight)
        this.draw(ids.right, layouts.right)
    },

    draw(id: SkinSpriteId, layout: Quad) {
        if (skin.sprites.exists(id)) skin.sprites.draw(id, layout, [layer.note.slide], 1)
    },

    show() {
        const rects = getNativeTutorialNoteRects(1,
            skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists)
        const main = getNativeNoteMainIds(skin.sprites, 1)
        ids.left = getNativeNoteCapId(skin.sprites, 1, 2, true)
        ids.right = getNativeNoteCapId(skin.sprites, 1, 2, true)
        ids.mainLeft = main.left
        ids.middle = main.middle
        ids.mainRight = main.right
        nativeNoteLayout(rects.left).copyTo(layouts.left)
        nativeNoteLayout(rects.mainLeft).copyTo(layouts.mainLeft)
        nativeNoteLayout(rects.middle).copyTo(layouts.middle)
        nativeNoteLayout(rects.mainRight).copyTo(layouts.mainRight)
        nativeNoteLayout(rects.right).copyTo(layouts.right)
        mode = true
    },

    clear() {
        mode = false
    },
}

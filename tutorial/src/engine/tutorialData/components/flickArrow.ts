import { FlickDirection } from '../../../../../shared/src/engine/data/FlickDirection.js'
import { getArrowLayout, getArrowSpriteId, getNativeArrowAnimationLayout } from '../../../../../shared/src/engine/data/arrowSprites.js'
import { getNativeArrowAnimation, getNativeArrowAnimationSkin, NativeArrowAnimationSkin } from '../../../../../shared/src/engine/data/nativeArrowAnimation.js'
import { approach } from '../../../../../shared/src/engine/data/note.js'
import { segment } from '../segment.js'
import { layer, skin } from '../skin.js'

const up = [
    skin.sprites.flickArrowUp1,
    skin.sprites.flickArrowUp2,
    skin.sprites.flickArrowUp3,
    skin.sprites.flickArrowUp4,
    skin.sprites.flickArrowUp5,
    skin.sprites.flickArrowUp6,
    skin.sprites.flickArrowUp7,
    skin.sprites.flickArrowUp8,
]
const sprites = { up, left: up, right: up }

enum Mode {
    None,
    Overlay,
    Fall,
    Frozen,
}

let mode = tutorialMemory(DataType<Mode>)

export const flickArrow = {
    update() {
        if (!mode) return
        const nativeSkin = getNativeArrowAnimationSkin(
            skin.sprites.nativeArrowAnimationSkin001.exists,
            skin.sprites.nativeArrowAnimationSkin002.exists,
            skin.sprites.nativeArrowAnimationSkin003.exists,
        )
        // Tutorial note spans four stage units, matching size=2 in play/watch.
        const id = getArrowSpriteId(sprites, 2, FlickDirection.Up, nativeSkin)
        if (!skin.sprites.exists(id)) return

        const base = getArrowLayout(2, FlickDirection.Up, 0, 1, nativeSkin)
        const animation = getNativeArrowAnimation(nativeSkin, FlickDirection.Up, segment.time)
        if (nativeSkin === NativeArrowAnimationSkin.None) this.draw(id, base, 1)
        else this.draw(id, getNativeArrowAnimationLayout(
            base, FlickDirection.Up, 0, 1,
            animation.x, animation.y, animation.scaleX, animation.scaleY,
        ), animation.alpha)
    },

    draw(id: SkinSpriteId, layout: Quad, alpha: number) {
        if (mode === Mode.Overlay) {
            skin.sprites.draw(id, layout.translate(0, -1).scale(1.5, 1.5).translate(0, 0.5),
                [layer.note.arrow], alpha * Math.unlerpClamped(1, 0.75, segment.time))
        } else if (mode === Mode.Fall) {
            skin.sprites.draw(id, layout.mul(approach(0, 2, segment.time)), [layer.note.arrow], alpha)
        } else skin.sprites.draw(id, layout, [layer.note.arrow], alpha)
    },

    showOverlay() {
        mode = Mode.Overlay
    },
    showFall() {
        mode = Mode.Fall
    },
    showFrozen() {
        mode = Mode.Frozen
    },
    clear() {
        mode = Mode.None
    },
}

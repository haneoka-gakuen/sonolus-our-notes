import { getNativeNoteCapId, getNativeNoteMainIds } from '../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js'
import { getNativeNoteDirection, getNativeNoteKind, getNativeNoteMarkRect, getNativeNoteParts, getNativeNoteRects, getNativePreviewNoteRect } from '../../../../../../../shared/src/engine/data/nativeNoteGeometry.js'
import { options } from '../../../../configuration/options.js'
import { scaledScreen } from '../../../scaledScreen.js'
import { panel } from '../../../panel.js'
import { getZ, layer, skin } from '../../../skin.js'
import { Note } from '../Note.js'

export abstract class FlatNote extends Note {
    abstract sprites: {
        left: SkinSprite
        middle: SkinSprite
        right: SkinSprite
        fallback: SkinSprite
    }

    layer = layer.note.body

    render() {
        const time = bpmChanges.at(this.import.beat).time
        const pos = panel.getPos(time)

        const z = getZ(this.layer, time, this.import.lane)

        const rects = this.nativeRects
        this.renderBody(rects, pos, z)
        this.renderDecoration(pos, z + 0.5)

        return { time, pos }
    }

    get nativeRects() {
        const direction = getNativeNoteDirection(this.import.originalDirection, options.mirror)
        return getNativeNoteRects(this.import.lane, this.import.size, getNativeNoteKind(this.import.operateType, direction),
            skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists, true)
    }

    renderBody(rects: ReturnType<typeof getNativeNoteRects>, pos: Vec, z: number) {
        const kind = getNativeNoteKind(this.import.operateType, getNativeNoteDirection(this.import.originalDirection, options.mirror))
        const parts = getNativeNoteParts(this.import.lane, this.import.size, true)
        const main = getNativeNoteMainIds(skin.sprites, kind)
        this.drawBodySprite(getNativeNoteCapId(skin.sprites, kind, parts.leftTilt, parts.leftRight), rects.left, pos, z)
        this.drawBodySprite(main.left, rects.mainLeft, pos, z)
        this.drawBodySprite(main.middle, rects.middle, pos, z)
        this.drawBodySprite(main.right, rects.mainRight, pos, z)
        this.drawBodySprite(getNativeNoteCapId(skin.sprites, kind, parts.rightTilt, parts.rightRight), rects.right, pos, z)
    }

    drawBodySprite(id: SkinSpriteId, rect: RectLike, pos: Vec, z: number) {
        if (skin.sprites.exists(id)) skin.sprites.draw(id, new Rect(getNativePreviewNoteRect(rect, scaledScreen.wToH)).add(pos), [z], 1)
    }

    get nativeMarkRect() {
      return getNativeNoteMarkRect(this.import.lane,
        getNativeNoteKind(this.import.operateType, getNativeNoteDirection(this.import.originalDirection, options.mirror)),
        skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists)
    }

    renderDecoration(pos: Vec, z: number) {
        const layout = new Rect(getNativePreviewNoteRect(this.nativeMarkRect, scaledScreen.wToH)).add(pos)
        if (this.import.operateType === 1 || this.import.operateType === 101) {
            skin.sprites.tapDecoration.draw(layout, [z], 1)
        } else if (this.import.operateType === 20) {
            skin.sprites.slideDecoration.draw(layout, [z], 1)
        } else if (this.import.operateType === 40 || this.import.operateType === 41 || this.import.operateType === 42 || this.import.operateType === 102) {
            // Original direction is also used for body art, before mirroring.
            const direction = options.mirror
                ? this.import.originalDirection === 1 ? 2 : this.import.originalDirection === 2 ? 1 : 0
                : this.import.originalDirection
            if (direction === 1) skin.sprites.flickLeftDecoration.draw(layout, [z], 1)
            else if (direction === 2) skin.sprites.flickRightDecoration.draw(layout, [z], 1)
            else skin.sprites.flickDecoration.draw(layout, [z], 1)
        }
    }

    get useFallbackSprites() {
        return (
            !this.sprites.left.exists || !this.sprites.middle.exists || !this.sprites.right.exists
        )
    }
}

import { getNativePreviewNoteRect } from '../../../../../../../../shared/src/engine/data/nativeNoteGeometry.js'
import { scaledScreen } from '../../../../scaledScreen.js'
import { getZ, layer } from '../../../../skin.js'
import { FlatNote } from '../FlatNote.js'

export abstract class TraceNote extends FlatNote {
    abstract sprites: {
        left: SkinSprite
        middle: SkinSprite
        right: SkinSprite
        diamond: SkinSprite
        fallback: SkinSprite
    }

    layer = layer.note.trace

    render() {
        const { time, pos } = super.render()

        const z = getZ(layer.note.tick, time, this.import.lane)

        if (!this.useFallbackSprites) {
            const rect = getNativePreviewNoteRect(this.nativeMarkRect, scaledScreen.wToH)
            this.sprites.diamond.draw(new Rect(rect).add(pos), [z], 1)
        }

        return { time, pos }
    }

    get useFallbackSprites() {
        return (
            !this.sprites.left.exists ||
            !this.sprites.middle.exists ||
            !this.sprites.right.exists ||
            !this.sprites.diamond.exists
        )
    }
}

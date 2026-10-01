import { FlickDirection } from '../../../../../../../../shared/src/engine/data/FlickDirection.js'
import {
    getPreviewArrowLayout,
    getArrowSpriteId,
} from '../../../../../../../../shared/src/engine/data/arrowSprites.js'
import { getNativeArrowAnimation, getNativeArrowAnimationSkin } from '../../../../../../../../shared/src/engine/data/nativeArrowAnimation.js'
import { options } from '../../../../../configuration/options.js'
import { scaledScreen } from '../../../../scaledScreen.js'
import { getZ, layer, skin } from '../../../../skin.js'
import { FlatNote } from '../FlatNote.js'

export abstract class FlickNote extends FlatNote {
    abstract arrowSprites: {
        up: SkinSprite[]
        left: SkinSprite[]
        right: SkinSprite[]
        fallback: SkinSprite
    }

    flickImport = this.defineImport({
        direction: { name: 'direction', type: DataType<FlickDirection> },
    })

    preprocess() {
        super.preprocess()

        if (options.mirror) this.flickImport.direction *= -1
    }

    render() {
        const { time, pos } = super.render()

        const z = getZ(layer.note.arrow, time, this.import.lane)

        const nativeSkin = getNativeArrowAnimationSkin(
            skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin001.id),
            skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin002.id),
            skin.sprites.exists(skin.sprites.nativeArrowAnimationSkin003.id),
        )

        const arrowSpriteId = getArrowSpriteId(
            this.arrowSprites,
            this.import.size,
            this.flickImport.direction,
            nativeSkin,
        )

        if (skin.sprites.exists(arrowSpriteId)) {
            skin.sprites.draw(
                arrowSpriteId,
                getPreviewArrowLayout(
                    this.import.size,
                    this.flickImport.direction,
                    this.import.lane,
                    0,
                    scaledScreen.wToH,
                    nativeSkin,
                ).add(pos),
                [z],
                getNativeArrowAnimation(nativeSkin, this.flickImport.direction, 0).alpha,
            )
        }

        return { time, pos }
    }

}

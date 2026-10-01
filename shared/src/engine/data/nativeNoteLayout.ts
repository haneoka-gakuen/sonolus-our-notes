import { nativeEffectSkew } from './lane.js'

/** Upright SpriteRenderer plane, distinct from the lane's XZ strip. */
export const nativeNoteLayout = ({ l, r, b, t }: RectLike) => {
    // In the native camera an XY sprite's upper edge approaches the camera.
    // A ground-plane quad contracts that edge and shears authored caps twice.
    const bottomScale = 1 + nativeEffectSkew * (1 - b)
    const topScale = 1 + nativeEffectSkew * (1 - t)
    return new Quad({
        x1: l * bottomScale, y1: b,
        x2: l * topScale, y2: t,
        x3: r * topScale, y3: t,
        x4: r * bottomScale, y4: b,
    })
}

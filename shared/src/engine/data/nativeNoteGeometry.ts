import { getNativeNoteGeometry, getNativeNotePartGeometry } from './nativeNoteGeometry.generated.js'

export const getNativeNoteDirection = (direction: number, mirror: boolean) =>
    mirror ? direction === 1 ? 2 : direction === 2 ? 1 : direction : direction

export const getNativeNoteKind = (operateType: number, direction: number) => {
    if (operateType === 60 || operateType === 61 || operateType === 62 || operateType === 63 || operateType === 104 || operateType === 105) return 6
    if (operateType === 21 || operateType === 120) return 7
    if (operateType === 22) return 2
    if (operateType === 20) return 1
    if (operateType === 40 || operateType === 41 || operateType === 42 || operateType === 102) return direction === 1 ? 4 : direction === 2 ? 5 : 3
    return 0
}

// Native distances use the 24-lane chart; Sonolus uses twelve stage units.
// The prefab's thresholds 0/2/4/6/8/10/12 are inclusive upper bounds.
export const getNativeNoteParts = (lane: number, size: number, flat: boolean) => {
    const left = lane - size
    const right = lane + size
    const crossing = left < 0 && right > 0
    return {
        leftTilt: flat ? 0 : Math.min(6, Math.ceil(Math.abs(left))),
        rightTilt: flat ? 0 : Math.min(6, Math.ceil(Math.abs(right))),
        leftRight: !flat && (crossing || lane < 0),
        rightRight: flat || crossing || lane >= 0,
        leftFlip: !flat && (crossing || lane < 0),
        rightFlip: !flat && !crossing && lane < 0,
    }
}

export const getNativeNoteMarkRect = (lane: number, kind: number, skin002: boolean, skin003: boolean) => {
    const mark = getNativeNoteGeometry(skin002, skin003, kind).mark
    return { l: lane + mark.x - mark.w / 2, r: lane + mark.x + mark.w / 2,
        b: 1 - mark.y + mark.h, t: 1 - mark.y - mark.h }
}

export const getNativeNoteRects = (lane: number, size: number, kind: number, skin002: boolean, skin003: boolean, flat = false) => {
    const g = getNativeNoteGeometry(skin002, skin003, kind)
    const parts = getNativeNoteParts(lane, size, flat)
    const left = getNativeNotePartGeometry(skin002, skin003, kind, parts.leftTilt, parts.leftRight)
    const right = getNativeNotePartGeometry(skin002, skin003, kind, parts.rightTilt, parts.rightRight)
    // Native Sprite.bounds uses the tight textureRect. Our packer restores
    // m_Rect padding, so place that padded image around the tight cap centre.
    const leftCenter = lane - size + left.tightW / 2 - left.overhang + (parts.leftFlip ? -left.x : left.x)
    const rightCenter = lane + size - right.tightW / 2 + right.overhang + (parts.rightFlip ? -right.x : right.x)
    const mainCenter = lane + (left.tightW - right.tightW + right.overhang - left.overhang) / 2
    const mainWidth = Math.max(0.001, size * 2 - left.tightW - right.tightW + left.overhang + right.overhang)
    const borderTotal = g.borderLeft + g.borderRight
    const borderScale = borderTotal > mainWidth ? mainWidth / borderTotal : 1
    const bl = g.borderLeft * borderScale
    const br = g.borderRight * borderScale
    const mainLeft = mainCenter - mainWidth / 2
    const mainRight = mainCenter + mainWidth / 2
    const leftW = (parts.leftFlip ? -1 : 1) * left.w / 2
    const rightW = (parts.rightFlip ? -1 : 1) * right.w / 2
    return {
        left: { l: leftCenter - leftW, r: leftCenter + leftW, b: 1 - left.y + left.h, t: 1 - left.y - left.h },
        mainLeft: { l: mainLeft, r: mainLeft + bl, b: 1 + g.main.h, t: 1 - g.main.h },
        middle: { l: mainLeft + bl, r: mainRight - br, b: 1 + g.main.h, t: 1 - g.main.h },
        mainRight: { l: mainRight - br, r: mainRight, b: 1 + g.main.h, t: 1 - g.main.h },
        right: { l: rightCenter - rightW, r: rightCenter + rightW, b: 1 - right.y + right.h, t: 1 - right.y - right.h },
        mark: { l: lane + g.mark.x - g.mark.w / 2, r: lane + g.mark.x + g.mark.w / 2, b: 1 - g.mark.y + g.mark.h, t: 1 - g.mark.y - g.mark.h },
    }
}

export const getNativePreviewNoteRect = (rect: RectLike, wToH: number) => ({
    l: rect.l, r: rect.r,
    b: (1 - rect.b) * (850 * 12 / 1420) * wToH,
    t: (1 - rect.t) * (850 * 12 / 1420) * wToH,
})

/** Shared XZ lane-fill quad. Upright note sprites use nativeNoteLayout instead. */
export const nativeLaneEffectLayout = ({ lane, size, wToH }: { lane: number; size: number; wToH: number }) => {
    const top = 1 - 2 * wToH
    return {
        x1: lane - size, x2: (lane - size) * top,
        x3: (lane + size) * top, x4: lane + size,
        y1: 1, y2: top, y3: top, y4: 1,
    }
}

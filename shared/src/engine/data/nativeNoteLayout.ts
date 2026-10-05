/** Camera-child screen_root XY plane; authored cap artwork supplies its tilt. */
export const nativeNoteLayout = ({ l, r, b, t }: RectLike) => {
    // screen_root inherits the camera transform at one fixed depth. All
    // vertices share its projection denominator; physical effect-plane
    // shear would distort the already tilted endpoint sprites a second time.
    return new Quad({
        x1: l, y1: b,
        x2: l, y2: t,
        x3: r, y3: t,
        x4: r, y4: b,
    })
}

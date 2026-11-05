import { LANE_CLIP_CELLS, LANE_CLIP_STRIDE } from "./nativeLaneClipContract.js";

/** Clips against x >= leftSlope*y+left and x <= rightSlope*y+right. */
export function drawLaneClipped(
  id: SkinSpriteId, x1Input: number, y1Input: number, x2Input: number, y2Input: number,
  x3Input: number, y3Input: number, x4Input: number, y4Input: number, z: number, alpha: number,
  left: number, right: number, leftSlope: number, rightSlope: number, spriteCount: number,
) {
  let sourceX1 = x1Input, sourceY1 = y1Input, sourceX2 = x2Input, sourceY2 = y2Input, sourceX3 = x3Input, sourceY3 = y3Input, sourceX4 = x4Input, sourceY4 = y4Input;
  let boundLeft = left, boundRight = right, boundLeftSlope = leftSlope, boundRightSlope = rightSlope;
  let dl1 = sourceX1 - boundLeftSlope * sourceY1 - boundLeft, dl2 = sourceX2 - boundLeftSlope * sourceY2 - boundLeft;
  let dl3 = sourceX3 - boundLeftSlope * sourceY3 - boundLeft, dl4 = sourceX4 - boundLeftSlope * sourceY4 - boundLeft;
  let dr1 = boundRightSlope * sourceY1 + boundRight - sourceX1, dr2 = boundRightSlope * sourceY2 + boundRight - sourceX2;
  let dr3 = boundRightSlope * sourceY3 + boundRight - sourceX3, dr4 = boundRightSlope * sourceY4 + boundRight - sourceX4;
  if (Math.min(dl1, dl2, dl3, dl4) >= 0 && Math.min(dr1, dr2, dr3, dr4) >= 0) {
    native.Draw(id, sourceX1, sourceY1, sourceX2, sourceY2, sourceX3, sourceY3, sourceX4, sourceY4, z, alpha, 0, 0, 0);
    return;
  }
  if (Math.max(dl1, dl2, dl3, dl4) <= 0 || Math.max(dr1, dr2, dr3, dr4) <= 0) return;

  let aliasBase = spriteCount + id * (LANE_CLIP_STRIDE - 1);
  let sliced = native.HasSkinSprite(aliasBase);
  let cells = sliced ? LANE_CLIP_CELLS : 1;
  let startL = Math.min(dl1 !== dl4 ? dl1 / (dl1 - dl4) : 1, dl2 !== dl3 ? dl2 / (dl2 - dl3) : 1);
  let startR = Math.min(dr1 !== dr4 ? dr1 / (dr1 - dr4) : 1, dr2 !== dr3 ? dr2 / (dr2 - dr3) : 1);
  let endL = Math.max(dl1 !== dl4 ? dl1 / (dl1 - dl4) : 0, dl2 !== dl3 ? dl2 / (dl2 - dl3) : 0);
  let endR = Math.max(dr1 !== dr4 ? dr1 / (dr1 - dr4) : 0, dr2 !== dr3 ? dr2 / (dr2 - dr3) : 0);
  let first = Math.max(dl1, dl2) < 0 ? startL : Math.max(dr1, dr2) < 0 ? startR : 0;
  let last = Math.max(dl4, dl3) < 0 ? endL : Math.max(dr4, dr3) < 0 ? endR : 1;
  let cell = Math.floor(Math.clamp(first, 0, 1) * cells);
  let endCell = Math.ceil(Math.clamp(last, 0, 1) * cells);
  while (cell < endCell) {
    let count = 1;
    while (count * 2 <= cells && cell % (count * 2) === 0 && cell + count * 2 <= endCell) {
      let a = cell / cells, b = (cell + count * 2) / cells;
      let bx1 = Math.lerp(sourceX1, sourceX4, a), by1 = Math.lerp(sourceY1, sourceY4, a);
      let bx2 = Math.lerp(sourceX2, sourceX3, a), by2 = Math.lerp(sourceY2, sourceY3, a);
      let bx3 = Math.lerp(sourceX2, sourceX3, b), by3 = Math.lerp(sourceY2, sourceY3, b);
      let bx4 = Math.lerp(sourceX1, sourceX4, b), by4 = Math.lerp(sourceY1, sourceY4, b);
      if (Math.min(bx1 - boundLeftSlope * by1 - boundLeft, bx2 - boundLeftSlope * by2 - boundLeft,
        bx3 - boundLeftSlope * by3 - boundLeft, bx4 - boundLeftSlope * by4 - boundLeft,
        boundRightSlope * by1 + boundRight - bx1, boundRightSlope * by2 + boundRight - bx2,
        boundRightSlope * by3 + boundRight - bx3, boundRightSlope * by4 + boundRight - bx4) < 0) break;
      count *= 2;
    }
    let node = cells / count + Math.floor(cell / count);
    let start = cell / cells, span = count / cells;
    let end = start + span;
    let x1 = Math.lerp(sourceX1, sourceX4, start), y1 = Math.lerp(sourceY1, sourceY4, start);
    let x2 = Math.lerp(sourceX2, sourceX3, start), y2 = Math.lerp(sourceY2, sourceY3, start);
    let x3 = Math.lerp(sourceX2, sourceX3, end), y3 = Math.lerp(sourceY2, sourceY3, end);
    let x4 = Math.lerp(sourceX1, sourceX4, end), y4 = Math.lerp(sourceY1, sourceY4, end);
    let l1 = x1 - boundLeftSlope * y1 - boundLeft, l2 = x2 - boundLeftSlope * y2 - boundLeft;
    let l3 = x3 - boundLeftSlope * y3 - boundLeft, l4 = x4 - boundLeftSlope * y4 - boundLeft;
    let r1 = boundRightSlope * y1 + boundRight - x1, r2 = boundRightSlope * y2 + boundRight - x2;
    let r3 = boundRightSlope * y3 + boundRight - x3, r4 = boundRightSlope * y4 + boundRight - x4;
    let inside = Math.min(l1, l2, l3, l4, r1, r2, r3, r4) >= 0;
    let outside = Math.max(l1, l2, l3, l4) <= 0 || Math.max(r1, r2, r3, r4) <= 0;
    if (!outside) {
      let sprite = (sliced && node > 1 ? aliasBase + node - 2 : id) as SkinSpriteId;
      if (inside) native.Draw(sprite, x1, y1, x2, y2, x3, y3, x4, y4, z, alpha, 0, 0, 0);
      else {
        let c1 = l1 !== l2 ? l1 / (l1 - l2) : -1;
        let c2 = l4 !== l3 ? l4 / (l4 - l3) : -1;
        let c3 = r1 !== r2 ? r1 / (r1 - r2) : -1;
        let c4 = r4 !== r3 ? r4 / (r4 - r3) : -1;
        let enterL = Math.min(c1 > 0 ? c1 : 1, c2 > 0 ? c2 : 1);
        let enterR = Math.min(c3 > 0 ? c3 : 1, c4 > 0 ? c4 : 1);
        let begin = Math.max(0, Math.max(l1, l4) < 0 ? enterL : 0, Math.max(r1, r4) < 0 ? enterR : 0);
        while (begin < 1) {
          let finish = Math.min(1, c1 > begin + 1e-8 ? c1 : 1, c2 > begin + 1e-8 ? c2 : 1,
            c3 > begin + 1e-8 ? c3 : 1, c4 > begin + 1e-8 ? c4 : 1);
          let ax = Math.lerp(x1, x2, begin), ay = Math.lerp(y1, y2, begin);
          let bx = Math.lerp(x4, x3, begin), by = Math.lerp(y4, y3, begin);
          let cx = Math.lerp(x1, x2, finish), cy = Math.lerp(y1, y2, finish);
          let dx = Math.lerp(x4, x3, finish), dy = Math.lerp(y4, y3, finish);
          let al = ax - boundLeftSlope * ay - boundLeft, bl = bx - boundLeftSlope * by - boundLeft;
          let cl = cx - boundLeftSlope * cy - boundLeft, dl = dx - boundLeftSlope * dy - boundLeft;
          let ar = boundRightSlope * ay + boundRight - ax, br = boundRightSlope * by + boundRight - bx;
          let cr = boundRightSlope * cy + boundRight - cx, dr = boundRightSlope * dy + boundRight - dx;
          if (Math.max(al, bl, cl, dl) >= 0 && Math.max(ar, br, cr, dr) >= 0) {
            let a0 = Math.clamp(Math.max(al < 0 && al !== bl ? al / (al - bl) : 0, ar < 0 && ar !== br ? ar / (ar - br) : 0), 0, 1);
            let a1 = Math.clamp(Math.min(bl < 0 && al !== bl ? al / (al - bl) : 1, br < 0 && ar !== br ? ar / (ar - br) : 1), a0, 1);
            let b0 = Math.clamp(Math.max(cl < 0 && cl !== dl ? cl / (cl - dl) : 0, cr < 0 && cr !== dr ? cr / (cr - dr) : 0), 0, 1);
            let b1 = Math.clamp(Math.min(dl < 0 && cl !== dl ? cl / (cl - dl) : 1, dr < 0 && cr !== dr ? cr / (cr - dr) : 1), b0, 1);
            let py1 = Math.lerp(ay, by, a0), py2 = Math.lerp(cy, dy, b0);
            let py3 = Math.lerp(cy, dy, b1), py4 = Math.lerp(ay, by, a1);
            let px1 = Math.clamp(Math.lerp(ax, bx, a0), boundLeftSlope * py1 + boundLeft, boundRightSlope * py1 + boundRight);
            let px2 = Math.clamp(Math.lerp(cx, dx, b0), boundLeftSlope * py2 + boundLeft, boundRightSlope * py2 + boundRight);
            let px3 = Math.clamp(Math.lerp(cx, dx, b1), boundLeftSlope * py3 + boundLeft, boundRightSlope * py3 + boundRight);
            let px4 = Math.clamp(Math.lerp(ax, bx, a1), boundLeftSlope * py4 + boundLeft, boundRightSlope * py4 + boundRight);
            if (Math.abs((px3 - px1) * (py4 - py2) - (px4 - px2) * (py3 - py1)) > 1e-12)
              native.Draw(sprite, px1, py1, px2, py2, px3, py3, px4, py4, z, alpha, 0, 0, 0);
          }
          begin = finish;
        }
      }
    }
    cell += count;
  }
}

/** Axis-aligned camera-child note sprites need only horizontal UV clipping. */
export function drawLaneNoteClipped(
  id: SkinSpriteId, x1Input: number, y1Input: number, x2Input: number, y2Input: number,
  x3Input: number, y3Input: number, x4Input: number, y4Input: number, z: number, alpha: number,
  left: number, right: number, spriteCount: number,
) {
  let x1 = x1Input, y1 = y1Input, x2 = x2Input, y2 = y2Input;
  let x3 = x3Input, y3 = y3Input, x4 = x4Input, y4 = y4Input;
  let l = left, r = right;
  if (Math.min(x1, x4) >= l && Math.max(x1, x4) <= r) {
    native.Draw(id, x1, y1, x2, y2, x3, y3, x4, y4, z, alpha, 0, 0, 0);
    return;
  }
  if (Math.max(x1, x4) <= l || Math.min(x1, x4) >= r || x1 === x4) return;
  let u0 = Math.clamp(Math.min((l - x1) / (x4 - x1), (r - x1) / (x4 - x1)), 0, 1);
  let u1 = Math.clamp(Math.max((l - x1) / (x4 - x1), (r - x1) / (x4 - x1)), 0, 1);
  let aliasBase = spriteCount + id * (LANE_CLIP_STRIDE - 1);
  let sliced = native.HasSkinSprite(aliasBase);
  let cells = sliced ? LANE_CLIP_CELLS : 1;
  let cell = Math.floor(u0 * cells), endCell = Math.ceil(u1 * cells);
  while (cell < endCell) {
    let count = 1;
    while (count * 2 <= cells && cell % (count * 2) === 0 && cell / cells >= u0 && (cell + count * 2) / cells <= u1) count *= 2;
    let node = cells / count + Math.floor(cell / count);
    let a = Math.max(u0, cell / cells), b = Math.min(u1, (cell + count) / cells);
    native.Draw((sliced && node > 1 ? aliasBase + node - 2 : id) as SkinSpriteId,
      Math.clamp(Math.lerp(x1, x4, a), l, r), Math.lerp(y1, y4, a),
      Math.clamp(Math.lerp(x2, x3, a), l, r), Math.lerp(y2, y3, a),
      Math.clamp(Math.lerp(x2, x3, b), l, r), Math.lerp(y2, y3, b),
      Math.clamp(Math.lerp(x1, x4, b), l, r), Math.lerp(y1, y4, b), z, alpha, 0, 0, 0);
    cell += count;
  }
}

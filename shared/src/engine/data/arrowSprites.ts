import { FlickDirection } from "./FlickDirection.js";
import { getNativeArrowGeometrySkin, NativeArrowAnimationSkin } from "./nativeArrowAnimation.js";
import {
  getNativeArrowSpriteIndexSkin001Left,
  getNativeArrowSpriteIndexSkin001Right,
  getNativeArrowSpriteIndexSkin001Up,
  getNativeArrowSpriteIndexSkin002Left,
  getNativeArrowSpriteIndexSkin002Right,
  getNativeArrowSpriteIndexSkin002Up,
  getNativeArrowSpriteIndexSkin003Left,
  getNativeArrowSpriteIndexSkin003Right,
  getNativeArrowSpriteIndexSkin003Up,
  getNativeArrowSpriteHeightSkin001Left,
  getNativeArrowSpriteHeightSkin001Right,
  getNativeArrowSpriteHeightSkin001Up,
  getNativeArrowSpriteHeightSkin002Left,
  getNativeArrowSpriteHeightSkin002Right,
  getNativeArrowSpriteHeightSkin002Up,
  getNativeArrowSpriteHeightSkin003Left,
  getNativeArrowSpriteHeightSkin003Right,
  getNativeArrowSpriteHeightSkin003Up,
  getNativeArrowSpriteWidthSkin001Left,
  getNativeArrowSpriteWidthSkin001Right,
  getNativeArrowSpriteWidthSkin001Up,
  getNativeArrowSpriteWidthSkin002Left,
  getNativeArrowSpriteWidthSkin002Right,
  getNativeArrowSpriteWidthSkin002Up,
  getNativeArrowSpriteWidthSkin003Left,
  getNativeArrowSpriteWidthSkin003Right,
  getNativeArrowSpriteWidthSkin003Up,
} from "./nativeArrowSource.generated.js";

type ArrowSprites = {
  up: { id: SkinSpriteId }[];
  left: { id: SkinSpriteId }[];
  right: { id: SkinSpriteId }[];
};

const getArrowIndex = (skin: NativeArrowAnimationSkin, width: number, direction: FlickDirection) => {
  if (skin === NativeArrowAnimationSkin.Skin002) {
    if (direction === FlickDirection.Up) return getNativeArrowSpriteIndexSkin002Up(width);
    if (direction === FlickDirection.Left) return getNativeArrowSpriteIndexSkin002Left(width);
    return getNativeArrowSpriteIndexSkin002Right(width);
  }
  if (skin === NativeArrowAnimationSkin.Skin003) {
    if (direction === FlickDirection.Up) return getNativeArrowSpriteIndexSkin003Up(width);
    if (direction === FlickDirection.Left) return getNativeArrowSpriteIndexSkin003Left(width);
    return getNativeArrowSpriteIndexSkin003Right(width);
  }
  if (direction === FlickDirection.Up) return getNativeArrowSpriteIndexSkin001Up(width);
  if (direction === FlickDirection.Left) return getNativeArrowSpriteIndexSkin001Left(width);
  return getNativeArrowSpriteIndexSkin001Right(width);
};

export const getArrowSpriteIndex = (skin: NativeArrowAnimationSkin, size: number, direction: FlickDirection) =>
  getArrowIndex(getNativeArrowGeometrySkin(skin), size * 4, direction);

export const getArrowSpriteId = (
  arrowSprites: ArrowSprites,
  size: number,
  direction: FlickDirection,
  skin: NativeArrowAnimationSkin,
) => {
  const index = getArrowSpriteIndex(skin, size, direction);
  const getId = (up: SkinSpriteId, left: SkinSpriteId, right: SkinSpriteId) =>
    direction === FlickDirection.Left ? left : direction === FlickDirection.Right ? right : up;

  // sonolus.js requires object/array keys to be compile-time constants.
  switch (index) {
    case 0:
      return getId(arrowSprites.up[0].id, arrowSprites.left[0].id, arrowSprites.right[0].id);
    case 1:
      return getId(arrowSprites.up[1].id, arrowSprites.left[1].id, arrowSprites.right[1].id);
    case 2:
      return getId(arrowSprites.up[2].id, arrowSprites.left[2].id, arrowSprites.right[2].id);
    case 3:
      return getId(arrowSprites.up[3].id, arrowSprites.left[3].id, arrowSprites.right[3].id);
    case 4:
      return getId(arrowSprites.up[4].id, arrowSprites.left[4].id, arrowSprites.right[4].id);
    case 5:
      return getId(arrowSprites.up[5].id, arrowSprites.left[5].id, arrowSprites.right[5].id);
    case 6:
      return getId(arrowSprites.up[6].id, arrowSprites.left[6].id, arrowSprites.right[6].id);
    default:
      return getId(arrowSprites.up[7].id, arrowSprites.left[7].id, arrowSprites.right[7].id);
  }
};

const getArrowWidth = (skin: NativeArrowAnimationSkin, index: number, direction: FlickDirection) => {
  if (skin === NativeArrowAnimationSkin.Skin002) {
    if (direction === FlickDirection.Up) return getNativeArrowSpriteWidthSkin002Up(index);
    if (direction === FlickDirection.Left) return getNativeArrowSpriteWidthSkin002Left(index);
    return getNativeArrowSpriteWidthSkin002Right(index);
  }
  if (skin === NativeArrowAnimationSkin.Skin003) {
    if (direction === FlickDirection.Up) return getNativeArrowSpriteWidthSkin003Up(index);
    if (direction === FlickDirection.Left) return getNativeArrowSpriteWidthSkin003Left(index);
    return getNativeArrowSpriteWidthSkin003Right(index);
  }
  if (direction === FlickDirection.Up) return getNativeArrowSpriteWidthSkin001Up(index);
  if (direction === FlickDirection.Left) return getNativeArrowSpriteWidthSkin001Left(index);
  return getNativeArrowSpriteWidthSkin001Right(index);
};

const getArrowHeight = (skin: NativeArrowAnimationSkin, index: number, direction: FlickDirection) => {
  if (skin === NativeArrowAnimationSkin.Skin002) {
    if (direction === FlickDirection.Up) return getNativeArrowSpriteHeightSkin002Up(index);
    if (direction === FlickDirection.Left) return getNativeArrowSpriteHeightSkin002Left(index);
    return getNativeArrowSpriteHeightSkin002Right(index);
  }
  if (skin === NativeArrowAnimationSkin.Skin003) {
    if (direction === FlickDirection.Up) return getNativeArrowSpriteHeightSkin003Up(index);
    if (direction === FlickDirection.Left) return getNativeArrowSpriteHeightSkin003Left(index);
    return getNativeArrowSpriteHeightSkin003Right(index);
  }
  if (direction === FlickDirection.Up) return getNativeArrowSpriteHeightSkin001Up(index);
  if (direction === FlickDirection.Left) return getNativeArrowSpriteHeightSkin001Left(index);
  return getNativeArrowSpriteHeightSkin001Right(index);
};

/** Native source m_Rect bounds, preserved by the root packer with transparent padding. */
export const getArrowLayout = (
  size: number,
  direction: FlickDirection,
  lane: number,
  judgmentY: number,
  skin: NativeArrowAnimationSkin,
) => {
  const geometrySkin = getNativeArrowGeometrySkin(skin);
  const index = getArrowSpriteIndex(geometrySkin, size, direction);
  const scale = direction === FlickDirection.Up ? 0.8 : 1;
  const w = ((getArrowWidth(geometrySkin, index, direction) * 12) / 1420 / 2) * scale;
  const h = (getArrowHeight(geometrySkin, index, direction) / 850) * scale;
  const centerOffset = ((direction === FlickDirection.Up ? 1.15 : 1) * 100) / 850;

  return new Rect({ l: -w, r: w, b: h / 2, t: -h / 2 })
    .toQuad()
    .rotate(direction === FlickDirection.Left ? Math.PI : 0)
    .translate(lane, judgmentY - centerOffset);
};

/** Apply an animated child Transform about the authored sprite pivot. */
export const getNativeArrowAnimationLayout = (
  layout: Quad,
  direction: FlickDirection,
  lane: number,
  judgmentY: number,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
) => {
  const parentScale = direction === FlickDirection.Up ? 0.8 : 1;
  const unit = 100 / 850;
  const pivotY = judgmentY - (direction === FlickDirection.Up ? 1.15 : 1) * unit;

  return layout
    .translate(-lane, -pivotY)
    .scale(scaleX, scaleY)
    .translate(lane + x * parentScale * unit, pivotY - (y - 1) * parentScale * unit);
};

/** Orthographic chart-preview layout for the same native flick sprites. */
export const getPreviewArrowLayout = (
  size: number,
  direction: FlickDirection,
  lane: number,
  chartY: number,
  wToH: number,
  skin: NativeArrowAnimationSkin,
) => {
  const geometrySkin = getNativeArrowGeometrySkin(skin);
  const index = getArrowSpriteIndex(geometrySkin, size, direction);
  const scale = direction === FlickDirection.Up ? 0.8 : 1;
  const w = ((getArrowWidth(geometrySkin, index, direction) * 12) / 1420 / 2) * scale;
  const h = ((getArrowHeight(geometrySkin, index, direction) * 12) / 1420) * scale * wToH;
  const centerOffset = (((direction === FlickDirection.Up ? 1.15 : 1) * 100 * 12) / 1420) * wToH;

  return new Rect({ l: -w, r: w, b: -h / 2, t: h / 2 })
    .toQuad()
    .rotate(direction === FlickDirection.Left ? Math.PI : 0)
    .translate(lane, chartY + centerOffset);
};

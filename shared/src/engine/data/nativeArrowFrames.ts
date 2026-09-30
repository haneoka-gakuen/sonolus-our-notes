import { FlickDirection } from "./FlickDirection.js";
import { getNativeArrowAnimation, type NativeArrowAnimationSkin } from "./nativeArrowAnimation.js";

// Sonolus supplies levelMemory as a compiler global. The shared package
// typecheck has no Sonolus ambient globals, so keep the declaration local and
// erased from the compiled engine source.
type NativeArrowFrame = { x: number; y: number; scaleX: number; scaleY: number; alpha: number };
declare const levelMemory: (definition: unknown) => {
  up: NativeArrowFrame;
  left: NativeArrowFrame;
  right: NativeArrowFrame;
};

const frames = levelMemory({
  up: { x: Number, y: Number, scaleX: Number, scaleY: Number, alpha: Number },
  left: { x: Number, y: Number, scaleX: Number, scaleY: Number, alpha: Number },
  right: { x: Number, y: Number, scaleX: Number, scaleY: Number, alpha: Number },
});

export const updateNativeArrowFrames = (skin: NativeArrowAnimationSkin, time: number) => {
  const up = getNativeArrowAnimation(skin, FlickDirection.Up, time);
  frames.up.x = up.x;
  frames.up.y = up.y;
  frames.up.scaleX = up.scaleX;
  frames.up.scaleY = up.scaleY;
  frames.up.alpha = up.alpha;
  const left = getNativeArrowAnimation(skin, FlickDirection.Left, time);
  frames.left.x = left.x;
  frames.left.y = left.y;
  frames.left.scaleX = left.scaleX;
  frames.left.scaleY = left.scaleY;
  frames.left.alpha = left.alpha;
  const right = getNativeArrowAnimation(skin, FlickDirection.Right, time);
  frames.right.x = right.x;
  frames.right.y = right.y;
  frames.right.scaleX = right.scaleX;
  frames.right.scaleY = right.scaleY;
  frames.right.alpha = right.alpha;
};

export const readNativeArrowFrame = (direction: FlickDirection) => ({
  x: direction === FlickDirection.Up ? frames.up.x : direction === FlickDirection.Left ? frames.left.x : frames.right.x,
  y: direction === FlickDirection.Up ? frames.up.y : direction === FlickDirection.Left ? frames.left.y : frames.right.y,
  scaleX:
    direction === FlickDirection.Up
      ? frames.up.scaleX
      : direction === FlickDirection.Left
        ? frames.left.scaleX
        : frames.right.scaleX,
  scaleY:
    direction === FlickDirection.Up
      ? frames.up.scaleY
      : direction === FlickDirection.Left
        ? frames.left.scaleY
        : frames.right.scaleY,
  alpha:
    direction === FlickDirection.Up
      ? frames.up.alpha
      : direction === FlickDirection.Left
        ? frames.left.alpha
        : frames.right.alpha,
});

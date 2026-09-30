import { FlickDirection } from "./FlickDirection.js";
import {
  getNativeArrowAnimationSkin001Upduration,
  getNativeArrowAnimationSkin001Upx,
  getNativeArrowAnimationSkin001Upy,
  getNativeArrowAnimationSkin001UpscaleX,
  getNativeArrowAnimationSkin001UpscaleY,
  getNativeArrowAnimationSkin001Upalpha,
  getNativeArrowAnimationSkin001Leftduration,
  getNativeArrowAnimationSkin001Leftx,
  getNativeArrowAnimationSkin001Lefty,
  getNativeArrowAnimationSkin001LeftscaleX,
  getNativeArrowAnimationSkin001LeftscaleY,
  getNativeArrowAnimationSkin001Leftalpha,
  getNativeArrowAnimationSkin001Rightduration,
  getNativeArrowAnimationSkin001Rightx,
  getNativeArrowAnimationSkin001Righty,
  getNativeArrowAnimationSkin001RightscaleX,
  getNativeArrowAnimationSkin001RightscaleY,
  getNativeArrowAnimationSkin001Rightalpha,
  getNativeArrowAnimationSkin002Upduration,
  getNativeArrowAnimationSkin002Upx,
  getNativeArrowAnimationSkin002Upy,
  getNativeArrowAnimationSkin002UpscaleX,
  getNativeArrowAnimationSkin002UpscaleY,
  getNativeArrowAnimationSkin002Upalpha,
  getNativeArrowAnimationSkin002Leftduration,
  getNativeArrowAnimationSkin002Leftx,
  getNativeArrowAnimationSkin002Lefty,
  getNativeArrowAnimationSkin002LeftscaleX,
  getNativeArrowAnimationSkin002LeftscaleY,
  getNativeArrowAnimationSkin002Leftalpha,
  getNativeArrowAnimationSkin002Rightduration,
  getNativeArrowAnimationSkin002Rightx,
  getNativeArrowAnimationSkin002Righty,
  getNativeArrowAnimationSkin002RightscaleX,
  getNativeArrowAnimationSkin002RightscaleY,
  getNativeArrowAnimationSkin002Rightalpha,
  getNativeArrowAnimationSkin003Upduration,
  getNativeArrowAnimationSkin003Upx,
  getNativeArrowAnimationSkin003Upy,
  getNativeArrowAnimationSkin003UpscaleX,
  getNativeArrowAnimationSkin003UpscaleY,
  getNativeArrowAnimationSkin003Upalpha,
  getNativeArrowAnimationSkin003Leftduration,
  getNativeArrowAnimationSkin003Leftx,
  getNativeArrowAnimationSkin003Lefty,
  getNativeArrowAnimationSkin003LeftscaleX,
  getNativeArrowAnimationSkin003LeftscaleY,
  getNativeArrowAnimationSkin003Leftalpha,
  getNativeArrowAnimationSkin003Rightduration,
  getNativeArrowAnimationSkin003Rightx,
  getNativeArrowAnimationSkin003Righty,
  getNativeArrowAnimationSkin003RightscaleX,
  getNativeArrowAnimationSkin003RightscaleY,
  getNativeArrowAnimationSkin003Rightalpha,
} from "./nativeArrowSource.generated.js";

export const NativeArrowAnimationSkin = {
  None: 0,
  Skin001: 1,
  Skin002: 2,
  Skin003: 3,
} as const;

export type NativeArrowAnimationSkin = (typeof NativeArrowAnimationSkin)[keyof typeof NativeArrowAnimationSkin];

export type NativeArrowAnimation = {
  duration: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
};

export const getNativeArrowAnimationSkin = (
  skin001: boolean,
  skin002: boolean,
  skin003: boolean,
): NativeArrowAnimationSkin => {
  if (skin001) return NativeArrowAnimationSkin.Skin001;
  if (skin002) return NativeArrowAnimationSkin.Skin002;
  if (skin003) return NativeArrowAnimationSkin.Skin003;
  return NativeArrowAnimationSkin.None;
};

/** Packs without a marker retain the historical skin001 geometry. */
export const getNativeArrowGeometrySkin = (skin: NativeArrowAnimationSkin) =>
  skin === NativeArrowAnimationSkin.None ? NativeArrowAnimationSkin.Skin001 : skin;

const animationFunction = (
  skin: NativeArrowAnimationSkin,
  direction: FlickDirection,
  time: number,
  field: "duration" | "x" | "y" | "scaleX" | "scaleY" | "alpha",
): number => {
  if (skin === NativeArrowAnimationSkin.Skin002) {
    if (direction === FlickDirection.Up) {
      if (field === "duration") return getNativeArrowAnimationSkin002Upduration(time);
      if (field === "x") return getNativeArrowAnimationSkin002Upx(time);
      if (field === "y") return getNativeArrowAnimationSkin002Upy(time);
      if (field === "scaleX") return getNativeArrowAnimationSkin002UpscaleX(time);
      if (field === "scaleY") return getNativeArrowAnimationSkin002UpscaleY(time);
      return getNativeArrowAnimationSkin002Upalpha(time);
    }
    if (direction === FlickDirection.Left) {
      if (field === "duration") return getNativeArrowAnimationSkin002Leftduration(time);
      if (field === "x") return getNativeArrowAnimationSkin002Leftx(time);
      if (field === "y") return getNativeArrowAnimationSkin002Lefty(time);
      if (field === "scaleX") return getNativeArrowAnimationSkin002LeftscaleX(time);
      if (field === "scaleY") return getNativeArrowAnimationSkin002LeftscaleY(time);
      return getNativeArrowAnimationSkin002Leftalpha(time);
    }
    if (field === "duration") return getNativeArrowAnimationSkin002Rightduration(time);
    if (field === "x") return getNativeArrowAnimationSkin002Rightx(time);
    if (field === "y") return getNativeArrowAnimationSkin002Righty(time);
    if (field === "scaleX") return getNativeArrowAnimationSkin002RightscaleX(time);
    if (field === "scaleY") return getNativeArrowAnimationSkin002RightscaleY(time);
    return getNativeArrowAnimationSkin002Rightalpha(time);
  }
  if (skin === NativeArrowAnimationSkin.Skin003) {
    if (direction === FlickDirection.Up) {
      if (field === "duration") return getNativeArrowAnimationSkin003Upduration(time);
      if (field === "x") return getNativeArrowAnimationSkin003Upx(time);
      if (field === "y") return getNativeArrowAnimationSkin003Upy(time);
      if (field === "scaleX") return getNativeArrowAnimationSkin003UpscaleX(time);
      if (field === "scaleY") return getNativeArrowAnimationSkin003UpscaleY(time);
      return getNativeArrowAnimationSkin003Upalpha(time);
    }
    if (direction === FlickDirection.Left) {
      if (field === "duration") return getNativeArrowAnimationSkin003Leftduration(time);
      if (field === "x") return getNativeArrowAnimationSkin003Leftx(time);
      if (field === "y") return getNativeArrowAnimationSkin003Lefty(time);
      if (field === "scaleX") return getNativeArrowAnimationSkin003LeftscaleX(time);
      if (field === "scaleY") return getNativeArrowAnimationSkin003LeftscaleY(time);
      return getNativeArrowAnimationSkin003Leftalpha(time);
    }
    if (field === "duration") return getNativeArrowAnimationSkin003Rightduration(time);
    if (field === "x") return getNativeArrowAnimationSkin003Rightx(time);
    if (field === "y") return getNativeArrowAnimationSkin003Righty(time);
    if (field === "scaleX") return getNativeArrowAnimationSkin003RightscaleX(time);
    if (field === "scaleY") return getNativeArrowAnimationSkin003RightscaleY(time);
    return getNativeArrowAnimationSkin003Rightalpha(time);
  }
  if (direction === FlickDirection.Up) {
    if (field === "duration") return getNativeArrowAnimationSkin001Upduration(time);
    if (field === "x") return getNativeArrowAnimationSkin001Upx(time);
    if (field === "y") return getNativeArrowAnimationSkin001Upy(time);
    if (field === "scaleX") return getNativeArrowAnimationSkin001UpscaleX(time);
    if (field === "scaleY") return getNativeArrowAnimationSkin001UpscaleY(time);
    return getNativeArrowAnimationSkin001Upalpha(time);
  }
  if (direction === FlickDirection.Left) {
    if (field === "duration") return getNativeArrowAnimationSkin001Leftduration(time);
    if (field === "x") return getNativeArrowAnimationSkin001Leftx(time);
    if (field === "y") return getNativeArrowAnimationSkin001Lefty(time);
    if (field === "scaleX") return getNativeArrowAnimationSkin001LeftscaleX(time);
    if (field === "scaleY") return getNativeArrowAnimationSkin001LeftscaleY(time);
    return getNativeArrowAnimationSkin001Leftalpha(time);
  }
  if (field === "duration") return getNativeArrowAnimationSkin001Rightduration(time);
  if (field === "x") return getNativeArrowAnimationSkin001Rightx(time);
  if (field === "y") return getNativeArrowAnimationSkin001Righty(time);
  if (field === "scaleX") return getNativeArrowAnimationSkin001RightscaleX(time);
  if (field === "scaleY") return getNativeArrowAnimationSkin001RightscaleY(time);
  return getNativeArrowAnimationSkin001Rightalpha(time);
};

export const getNativeArrowAnimation = (
  skin: NativeArrowAnimationSkin,
  direction: FlickDirection,
  time: number,
): NativeArrowAnimation => ({
  duration: animationFunction(skin, direction, time, "duration"),
  x: animationFunction(skin, direction, time, "x"),
  y: animationFunction(skin, direction, time, "y"),
  scaleX: animationFunction(skin, direction, time, "scaleX"),
  scaleY: animationFunction(skin, direction, time, "scaleY"),
  alpha: animationFunction(skin, direction, time, "alpha"),
});

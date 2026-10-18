export interface SourceViewBillboardFrame {
  cameraY: number;
  cameraZ: number;
  sinPitch: number;
  cosPitch: number;
  scaleX: number;
  scaleY: number;
  offsetY: number;
  expandX: number;
  expandY: number;
}

/** View-aligned, unrotated billboard with an X-pitch camera; output uses the adapter's stage space. */
export const projectSourceViewBillboard = (
  worldX: number,
  worldY: number,
  worldZ: number,
  sizeX: number,
  sizeY: number,
  frame: SourceViewBillboardFrame,
) => {
  const dy = worldY - frame.cameraY,
    dz = worldZ - frame.cameraZ;
  const inverseDepth = 1 / (-frame.sinPitch * dy - frame.cosPitch * dz);
  return {
    x: worldX * frame.scaleX * inverseDepth,
    y: (frame.cosPitch * dy - frame.sinPitch * dz) * frame.scaleY * inverseDepth + frame.offsetY,
    halfWidth: sizeX * frame.expandX * 0.5 * frame.scaleX * inverseDepth,
    halfHeight: -sizeY * frame.expandY * 0.5 * frame.scaleY * inverseDepth,
  };
};

/** Projection of a point already expressed in the camera frame. */
export const projectSourceCameraBillboard = (
  viewX: number,
  viewY: number,
  viewZ: number,
  sizeX: number,
  sizeY: number,
  frame: Pick<SourceViewBillboardFrame, "scaleX" | "scaleY" | "offsetY" | "expandX" | "expandY">,
) => {
  const inverseDepth = 1 / -viewZ;
  return {
    x: viewX * frame.scaleX * inverseDepth,
    y: viewY * frame.scaleY * inverseDepth + frame.offsetY,
    halfWidth: sizeX * frame.expandX * 0.5 * frame.scaleX * inverseDepth,
    halfHeight: -sizeY * frame.expandY * 0.5 * frame.scaleY * inverseDepth,
  };
};

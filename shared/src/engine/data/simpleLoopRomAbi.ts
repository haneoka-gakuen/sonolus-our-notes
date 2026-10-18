/** Source SimpleLoop ROM v2. Offsets and counts index little-endian Float32 values. */
export const SIMPLE_LOOP_ROM = {
  magic: 21324,
  version: 2,
  headerSize: 16,
  recordStride: 4,
  motionStride: 11,
  sizeStride: 5,
  maxResidents: 64,
  effectName: "Our Notes Source SimpleLoop Point",
} as const;

export const simpleLoopHermite = (
  t: number,
  t0: number,
  v0: number,
  outSlope: number,
  t1: number,
  v1: number,
  inSlope: number,
) => {
  const duration = t1 - t0;
  const q = Math.max(0, Math.min(1, (t - t0) / duration));
  const q2 = q * q;
  const q3 = q2 * q;
  return Math.max(
    0,
    (2 * q3 - 3 * q2 + 1) * v0 +
      (q3 - 2 * q2 + q) * duration * outSlope +
      (-2 * q3 + 3 * q2) * v1 +
      (q3 - q2) * duration * inSlope,
  );
};

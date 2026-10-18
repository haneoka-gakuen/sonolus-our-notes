export const CONNECT_WALL_DRAW_PROFILES = ["standard", "light", "simple"] as const;
export const CONNECT_WALL_DRAW_RANGES = 9;
export const connectWallDrawCapability = (profile: string) => `Our Notes Source Connect Draw ${profile}`;
export const connectWallDrawSpriteTable = (): Record<string, string> =>
  Object.fromEntries(
    CONNECT_WALL_DRAW_PROFILES.flatMap((profile, p) =>
      Array.from({ length: CONNECT_WALL_DRAW_RANGES * 2 }, (_, i) => [
        `sourceConnectDraw${p * CONNECT_WALL_DRAW_RANGES * 2 + i}`,
        `Our Notes Source Connect Draw ${profile} ${String(i).padStart(2, "0")}`,
      ]),
    ),
  );

export const CONNECT_FRAME_DRAW_PIECES = 3;
export const CONNECT_FRAME_DRAW_RANGES = 16;
export const CONNECT_FRAME_DRAW_GEOMETRY = {
  referenceSize: 2,
  edgeCenterScale: 1.02,
  capHalfWidth: 0.1333465491446022,
  lightCapHalfWidth: 0.24364881489656742,
  middleBoundary: 0.9533267254276989,
  lightMiddleBoundary: 0.8981755925517163,
} as const;
export const connectFrameDrawCapability = (profile: string) => `Our Notes Source Connect Frame Draw ${profile}`;
export const connectFrameDrawSpriteTable = (): Record<string, string> =>
  Object.fromEntries(
    CONNECT_WALL_DRAW_PROFILES.flatMap((profile, p) =>
      Array.from({ length: CONNECT_FRAME_DRAW_RANGES * CONNECT_FRAME_DRAW_PIECES * 2 }, (_, i) => [
        `sourceConnectFrameDraw${p * CONNECT_FRAME_DRAW_RANGES * CONNECT_FRAME_DRAW_PIECES * 2 + i}`,
        `Our Notes Source Connect Frame Draw ${profile} ${String(i).padStart(2, "0")}`,
      ]),
    ),
  );

export const CONNECT_WALL_LEVEL_COUNT = 64;
export const CONNECT_WALL_POOL = { groupCount: 28, birthCount: 48 } as const;
export const connectWallLevelEnergy = (level: number) => (level > 0 ? 2 ** ((level - 1) / 6 - 6) : 0);
export const connectWallEffectTable = (): Record<string, string> =>
  Object.fromEntries(
    Array.from({ length: CONNECT_WALL_LEVEL_COUNT }, (_, i) => [
      `sourceConnectWall${i}`,
      `Our Notes Source Connect Wall ${String(i).padStart(2, "0")}`,
    ]),
  );

import type { SonolusCLIConfig } from "@sonolus/sonolus.js";

type EsbuildHook = NonNullable<SonolusCLIConfig["esbuild"]>;

const workerCount = Number(process.env.SONOLUS_COMPILER_WORKERS || 1);
if (!Number.isInteger(workerCount) || workerCount < 1 || workerCount > 4) {
  throw new Error("SONOLUS_COMPILER_WORKERS must be an integer from 1 to 4");
}

export const engineEsbuild: EsbuildHook = (options) => ({
  ...options,
  tsconfig: "./tsconfig.base.json",
});

/**
 * Per-build output directories. sonolus-cli writes its compiler outfile to
 * `<dev>/index.mjs` and the engine artifacts to `<dist>/`. Both default to
 * shared paths, so concurrent facet builds clobber each other (the tutorial
 * worker would import another facet's outfile and crash on the missing
 * `tutorialData`). The parallel orchestrator overrides these via env to give
 * each facet an isolated workspace; standalone builds keep the defaults.
 */
export const engineOutputPaths = {
  // sonolus-cli otherwise starts half the machine's CPU count in workers,
  // each retaining a compiler graph. Keep local builds bounded by default.
  workerCount,
  dev: process.env.SONOLUS_ENGINE_DEV ?? "./.dev",
  dist: process.env.SONOLUS_ENGINE_DIST ?? "./dist",
};

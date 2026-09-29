import type { SonolusCLIConfig } from "@sonolus/sonolus.js";
import { engineEsbuild, engineOutputPaths } from "../esbuild.config.ts";
import { configureDevBgm } from "../dev-bgm.ts";

export default {
  type: "watch",
  esbuild: engineEsbuild,
  ...engineOutputPaths,

  devServer(sonolus) {
    configureDevBgm(sonolus, engineOutputPaths.dev);
  },
} satisfies SonolusCLIConfig;

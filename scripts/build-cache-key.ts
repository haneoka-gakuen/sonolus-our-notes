import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyInstalledCompiler } from "./verify-compiler.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const digest = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const facets = ["play", "watch", "preview", "tutorial"] as const;

/** Fingerprint the facet's actual import graph without invoking the SDK compiler. */
export async function facetCacheIdentity(facet: string, optimization: string) {
  if (!facets.some((name) => name === facet)) throw new Error(`Unknown engine facet: ${facet}`);
  if (optimization !== "low" && optimization !== "high") throw new Error(`Invalid optimization: ${optimization}`);
  const compiler = verifyInstalledCompiler();
  const sdkRequire = createRequire(import.meta.resolve("@sonolus/sonolus.js"));
  const esbuild = sdkRequire("esbuild") as {
    build(options: Record<string, unknown>): Promise<{ metafile: { inputs: Record<string, unknown> } }>;
  };
  const result = await esbuild.build({
    absWorkingDir: root,
    entryPoints: [`${facet}/src/index.ts`],
    bundle: true,
    write: false,
    metafile: true,
    packages: "external",
    platform: "node",
    format: "esm",
    tsconfig: resolve(root, "tsconfig.base.json"),
    logLevel: "silent",
  });
  const inputs = new Set(Object.keys(result.metafile.inputs));
  for (const path of [
    "scripts/build-cache-key.ts",
    "scripts/verify-compiler.ts",
    "esbuild.config.ts",
    `${facet}/sonolus-cli.config.ts`,
    "tsconfig.base.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "patches/compiler.json",
    "assets/EngineRom",
  ])
    inputs.add(path);
  const generatedInputs = [
    ["nativeArrowSource.generated.ts", "generate-native-arrow-data.ts", "native-arrows.json"],
    ["nativeNoteGeometry.generated.ts", "generate-native-note-geometry.ts", "native-note-geometry.json"],
    ["nativeNoteSprites.generated.ts", "generate-native-note-geometry.ts", "native-note-geometry.json"],
    ["nativeTutorialGeometry.generated.ts", "generate-native-note-geometry.ts", "native-note-geometry.json"],
  ];
  for (const [output, script, contract] of generatedInputs)
    if ([...inputs].some((path) => path.endsWith(`/${output}`))) {
      inputs.add(`scripts/${script}`);
      inputs.add(`contract/${contract}`);
    }
  const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    packageManager?: string;
    engines?: Record<string, string>;
  };
  const files = [...inputs].sort().map((path) => ({
    path: relative(root, resolve(root, path)).replaceAll("\\", "/"),
    sha256: digest(readFileSync(resolve(root, path))),
  }));
  const identity = {
    schema: 1,
    facet,
    optimization,
    nodeMajor: process.versions.node.split(".")[0],
    toolchain: {
      dependencies: manifest.dependencies,
      devDependencies: manifest.devDependencies,
      packageManager: manifest.packageManager,
      engines: manifest.engines,
      compiler: { version: compiler.version, patchSha256: compiler.patchSha256, files: compiler.files },
    },
    files,
  };
  return { key: digest(JSON.stringify(identity)), ...identity };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const identity = await facetCacheIdentity(process.argv[2] ?? "", process.argv[3] ?? "high");
  console.log(process.argv.includes("--json") ? JSON.stringify(identity, null, 2) : identity.key);
}

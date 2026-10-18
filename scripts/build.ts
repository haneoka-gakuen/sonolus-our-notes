import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyInstalledCompiler } from "./verify-compiler.ts";
import { isDeepStrictEqual } from "node:util";
import { gunzipSync } from "node:zlib";
import { SIMPLE_LOOP_WORLD_ROM as sourceLoopRomAbi } from "../shared/src/engine/data/simpleLoopWorldRomAbi.ts";
const engineRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(engineRoot, "dist");
/** Existing C producer output, shared by every runtime facet. */
const engineRomPath = resolve(engineRoot, "assets/EngineRom");
/** Local dev: parallel facets stage here before merging into `dist/`. */
const stagingRoot = resolve(engineRoot, ".build-parallel");
/** CI matrix: a single facet's output lands here for caching + artifact upload. */
const matrixRoot = resolve(engineRoot, ".build-matrix");

/**
 * Each facet produces its own `Engine<Facet>Data` plus a shared
 * `EngineConfiguration`. The compiler also writes a `LevelData` intermediate we
 * discard.
 */
const FACETS = [
  { name: "play", artifact: "EnginePlayData" },
  { name: "watch", artifact: "EngineWatchData" },
  { name: "preview", artifact: "EnginePreviewData" },
  { name: "tutorial", artifact: "EngineTutorialData" },
] as const;

/** Resolves the local `sonolus-cli` bin explicitly (children don't inherit `.bin`). */
function sonolusCli(): string {
  const candidate = resolve(engineRoot, "node_modules/.bin/sonolus-cli");
  return existsSync(candidate) ? realpathSync(candidate) : "sonolus-cli";
}

function run(bin: string, args: readonly string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { cwd: engineRoot, env: { ...process.env, ...env }, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`\`${bin} ${args.join(" ")}\` exited with status ${code}`));
    });
  });
}

async function finishBatch(tasks: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(tasks);
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length)
    throw new AggregateError(
      failures.map((result) => result.reason),
      "Engine facet build failed",
    );
}

/** Compile one facet into an isolated `dev`/`dist` workspace. */
async function buildFacet(name: string, dev: string, dist: string): Promise<void> {
  await run(sonolusCli(), ["--build", `./${name}/sonolus-cli.config.ts`], {
    SONOLUS_ENGINE_DEV: dev,
    SONOLUS_ENGINE_DIST: dist,
  });
  const facet = FACETS.find((value) => value.name === name)!;
  const data = JSON.parse(gunzipSync(readFileSync(resolve(dist, facet.artifact))).toString("utf8")) as {
    nodes: Array<{ value?: number; func?: string; args?: number[] }>;
  };
  const maxima = { level: -1, temporary: -1 };
  for (const node of data.nodes) {
    if (!node.args || !/^(?:Get|Set|Increment|Decrement)/u.test(node.func ?? "")) continue;
    const [blockRef, indexRef] = node.args;
    if (blockRef === undefined || indexRef === undefined) continue;
    const block = data.nodes[blockRef]?.value;
    const memory = block === 2000 ? "level" : block === 10000 ? "temporary" : undefined;
    if (!memory) continue;
    const index = data.nodes[indexRef]?.value;
    if (index === undefined) continue;
    if (!Number.isInteger(index) || index < 0 || index >= 4096)
      throw new Error(`${facet.artifact}: ${memory} memory index ${index} exceeds 0–4095`);
    maxima[memory] = Math.max(maxima[memory], index);
  }
  console.log(`${facet.artifact}: constant memory addresses level=${maxima.level}, temporary=${maxima.temporary}`);
}

function verifyEngineRom(): void {
  const bytes = readFileSync(engineRomPath);
  const read = (index: number) => bytes.readFloatLE(index * 4);
  if (
    bytes.length < sourceLoopRomAbi.headerSize * 4 ||
    bytes.length % 4 !== 0 ||
    read(0) !== sourceLoopRomAbi.magic ||
    read(1) !== sourceLoopRomAbi.phaseVersion ||
    read(6) !== sourceLoopRomAbi.recordStride ||
    read(10) !== sourceLoopRomAbi.motionStride ||
    read(11) * 4 !== bytes.length ||
    read(27) !== sourceLoopRomAbi.phaseCount ||
    read(28) !== sourceLoopRomAbi.maximumLatePhase
  )
    throw new Error("EngineRom does not match the SourceLoop phase ABI");
}

/**
 * CI matrix entry point: compile a single facet into
 * `.build-matrix/<facet>/dist/` (EngineConfiguration + Engine<Facet>Data), skipping
 * the merge and license stamp that the fan-in job owns. This path is what the
 * per-facet cache stores and the workflow artifact uploads.
 */
async function buildRequestedFacets(names: string[]): Promise<void> {
  const facets = names.map((name) => {
    const facet = FACETS.find((value) => value.name === name);
    if (!facet)
      throw new Error(
        `Unknown facet ${JSON.stringify(name)}. Expected one of: ${FACETS.map((f) => f.name).join(", ")}`,
      );
    return facet;
  });
  if (new Set(names).size !== names.length) throw new Error("A facet may only be requested once");
  const requestedJobs = Number(process.env.SONOLUS_BUILD_JOBS || 1);
  if (!Number.isInteger(requestedJobs) || requestedJobs < 1 || requestedJobs > FACETS.length)
    throw new Error("SONOLUS_BUILD_JOBS must be an integer from 1 to 4");
  await run("node", ["./scripts/generate-contract.ts"], {});
  await run("node", ["./scripts/generate-native-note-geometry.ts"], {});
  await run("node", ["./scripts/generate-native-arrow-data.ts"], {});
  for (let start = 0; start < facets.length; start += requestedJobs)
    await finishBatch(
      facets.slice(start, start + requestedJobs).map(async (facet) => {
        const facetRoot = resolve(matrixRoot, facet.name);
        rmSync(facetRoot, { recursive: true, force: true });
        const facetDist = resolve(facetRoot, "dist");
        await buildFacet(facet.name, resolve(facetRoot, "dev"), facetDist);
        copyFileSync(engineRomPath, resolve(facetDist, "EngineRom"));
      }),
    );
}

/**
 * Local build: compile facets with bounded concurrency, merge their artifacts into
 * `dist/`, and stamp the distribution with licenses + the source pointer.
 */
async function buildAll(): Promise<void> {
  await run("node", ["./scripts/generate-contract.ts"], {});
  await run("node", ["./scripts/generate-native-note-geometry.ts"], {});
  await run("node", ["./scripts/generate-native-arrow-data.ts"], {});
  rmSync(stagingRoot, { recursive: true, force: true });

  // Compiler graphs are memory intensive. Default to one facet; opt-in
  // concurrency is bounded by the four independent targets.
  const requestedJobs = Number(process.env.SONOLUS_BUILD_JOBS || 1);
  if (!Number.isInteger(requestedJobs) || requestedJobs < 1 || requestedJobs > FACETS.length) {
    throw new Error("SONOLUS_BUILD_JOBS must be an integer from 1 to 4");
  }
  for (let start = 0; start < FACETS.length; start += requestedJobs) {
    await finishBatch(
      FACETS.slice(start, start + requestedJobs).map(({ name }) =>
        buildFacet(name, resolve(stagingRoot, name, "dev"), resolve(stagingRoot, name, "dist")),
      ),
    );
  }

  // Every facet shares one configuration; validate before replacing dist/.
  const configuration = (name: string) =>
    JSON.parse(
      gunzipSync(readFileSync(resolve(stagingRoot, name, "dist", "EngineConfiguration"))).toString("utf8"),
    ) as unknown;
  const firstConfiguration = configuration(FACETS[0].name);
  for (const { name } of FACETS) {
    if (!isDeepStrictEqual(firstConfiguration, configuration(name)))
      throw new Error(`EngineConfiguration differs in ${name}; preserve the previous dist until all facets agree`);
  }

  // Merge only the complete, consistent artifact set.
  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(distRoot, { recursive: true });
  const first = FACETS[0];
  if (!first) throw new Error("No engine facets are configured");
  copyFileSync(
    resolve(stagingRoot, first.name, "dist", "EngineConfiguration"),
    resolve(distRoot, "EngineConfiguration"),
  );
  for (const { name, artifact } of FACETS) {
    copyFileSync(resolve(stagingRoot, name, "dist", artifact), resolve(distRoot, artifact));
  }
  copyFileSync(engineRomPath, resolve(distRoot, "EngineRom"));
  rmSync(stagingRoot, { recursive: true, force: true });

  // Stamp the distribution with licenses + source pointer (idempotent, standalone script).
  await run("node", ["./scripts/copy-upstream-license.ts"], {});
}

// Requested facets share generation and retain independent matrix outputs.
const requestedFacets = process.argv.slice(2);
verifyInstalledCompiler();
verifyEngineRom();
if (requestedFacets.length) {
  await buildRequestedFacets(requestedFacets);
} else {
  await buildAll();
}

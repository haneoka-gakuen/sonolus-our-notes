# `@haneoka/sonolus-our-notes`

`@haneoka/sonolus-our-notes` is the native Sonolus engine for Our Notes. It
ships the play, watch, preview, and tutorial targets plus their gameplay
presentation, native effect profiles, authored skin contract, and required
license/source notices.

Chart conversion stays in `@haneoka/cassiopeia-plugin-sonolus`. This engine has
no Cassiopeia or game-server dependency. A host builds the engine, supplies its
resource pack, and publishes the generated `dist/` files through its existing
Sonolus server.

## Build from a clean checkout

This repository owns its Sonolus compiler dependencies and has no unpublished
peer package to clone. Use the pinned package manager and a low-memory build:

```sh
git clone https://github.com/haneoka-gakuen/sonolus-our-notes.git
cd sonolus-our-notes
corepack enable
corepack prepare pnpm@11.14.0 --activate
pnpm install --frozen-lockfile
SONOLUS_BUILD_JOBS=1 SONOLUS_COMPILER_WORKERS=1 \
  NODE_OPTIONS=--max-old-space-size=1536 pnpm build
```

The current build requires Node 24 or newer. `pnpm build` compiles four bounded
facets—play, watch, preview, and tutorial—and emits these files in `dist/`:

```text
EngineConfiguration
EnginePlayData
EngineWatchData
EnginePreviewData
EngineTutorialData
LICENSE
LICENSE.pjsekai.txt
NOTICE.txt
SOURCE.txt
```

`SONOLUS_BUILD_JOBS` and `SONOLUS_COMPILER_WORKERS` accept values from 1 to 4.
Use `1` on a constrained machine; each additional compiler worker retains a
large graph in memory.

## Local CLI playback with BGM

The play and watch configurations use the host-provided
`SONOLUS_ENGINE_BGM` file for local preview audio:

```sh
SONOLUS_ENGINE_BGM="$PWD/music.mp3" \
  pnpm exec sonolus-cli ./play/sonolus-cli.config.ts
```

The config copies that file to the CLI development root as `bgm.mp3` and adds
its hash and URL to the preview level. Preview and tutorial builds use their
own `sonolus-cli.config.ts` files:

```sh
pnpm exec sonolus-cli ./preview/sonolus-cli.config.ts
pnpm exec sonolus-cli ./tutorial/sonolus-cli.config.ts
```

The source-level configs import their level/engine objects from TypeScript;
there is no JSON input manifest for the engine build. The host supplies chart
conversion output and release level metadata separately.

## Host artifact workflow

After `pnpm build`, publish the generated engine files and the required notices
from `dist/` to the Sonolus server already used by the host. A host can locate
the built package without assuming a repository path:

```ts
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(
  fileURLToPath(import.meta.resolve("@haneoka/sonolus-our-notes/package.json"))
);
const engineDist = `${packageRoot}/dist`;

// Publish these files from engineDist:
// EngineConfiguration, EnginePlayData, EngineWatchData,
// EnginePreviewData, EngineTutorialData, LICENSE, LICENSE.pjsekai.txt,
// NOTICE.txt, and SOURCE.txt.
```

The host then creates its Sonolus engine record from `EngineConfiguration`,
selects `EnginePlayData`/`EngineWatchData`/`EnginePreviewData`/
`EngineTutorialData` for each target, and serves the resource pack described by
the host's level/catalog metadata.

## Native effect contract

The host asset compiler reads
[`contract/native-effects.json`](contract/native-effects.json). It defines the
four targets, native effect profiles, authored width buckets, projection
planes, width thresholds, and stable base effect names. Use those values when
baking sprites or particle resources; keep the resource URLs and storage policy
in host code.

## Optional effect capture tools

The tools in [`optionaltools/effects`](optionaltools/effects) capture sprites
from a host workspace that already has Cassiopeia, the Our Notes plugin, the
Three renderer, Three.js, and the source media pack. They are separate from
engine compilation:

```sh
node optionaltools/effects/serve.mjs /path/to/extracted/runtime /path/to/output
node optionaltools/effects/bake.mjs /path/to/extracted/runtime /path/to/output
```

`serve.mjs` requires an extracted runtime directory containing `unity/`; it
mounts the built Cassiopeia/Our Notes/Three bundles for the capture page.
`bake.mjs` drives that local capture page through the configured browser agent.
Run these tools only when the host needs baked native effect resources. The
engine build itself does not load a chart or a game media archive.

## Lifetime, resources, and licenses

The engine artifacts are immutable build outputs. A server owns their storage
and HTTP lifetime; the Sonolus client owns runtime loading and disposal. The
host owns resource packs, BGM, charts, level metadata, catalog routes,
authentication, and release URLs.

Preserve [LICENSE](LICENSE),
[`LICENSE.pjsekai.txt`](LICENSE.pjsekai.txt), and
[`NOTICE.txt`](NOTICE.txt) when redistributing source or build artifacts.
Haneoka-authored code is MPL-2.0; upstream engine code retains its MIT license;
game-derived media and host asset packs retain the terms set by their operators.

# `@haneoka/sonolus-our-notes`

Standalone Sonolus play, watch, preview, and tutorial targets for Our Notes
charts. This repository owns the engine runtime and its gameplay presentation;
it does not own chart conversion, a web server, release catalogs, or game
media.

The engine has no dependency on Cassiopeia or a game server. A host builds the
engine, supplies its own resource pack, and serves the generated `dist/`
artifacts through whatever Sonolus server it already uses.

## Build

```sh
pnpm install --frozen-lockfile
pnpm build
```

The build emits `EngineConfiguration`, one `Engine*Data` file per target, and
the required license/source notices in `dist/`. Builds use one compiler worker
and one target at a time by default. `SONOLUS_BUILD_JOBS` and
`SONOLUS_COMPILER_WORKERS` accept values from 1 to 4.

For local CLI playback, provide an audio file with `SONOLUS_ENGINE_BGM`:

```sh
SONOLUS_ENGINE_BGM="$PWD/music.mp3" pnpm exec sonolus-cli ./play/sonolus-cli.config.ts
```

The optional effect capture tools in [`optionaltools/effects`](optionaltools/effects)
run from a host workspace with Cassiopeia, its Our Notes plugin, its Three renderer
and Three.js installed. They build sprite resources from the host's media and
remain separate from engine compilation.

For a constrained machine, pass the memory limit to the build command:

```sh
NODE_OPTIONS=--max-old-space-size=1536 pnpm build
```

## Host contract

The package includes the native effect profile contract at
[`contract/native-effects.json`](contract/native-effects.json). An asset
compiler should read that file rather than importing this engine's source or
assuming a repository path. It defines the four targets, the two native effect
profiles, the authored width buckets, the four projection planes, and the
width bucket thresholds, and stable base effect names. The host still supplies the baked skin, sound,
particle, and background resources and chooses their storage URLs.

The package can be consumed as a build artifact by a host package:

```ts
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const enginePackageRoot = dirname(
  fileURLToPath(import.meta.resolve("@haneoka/sonolus-our-notes/package.json")),
);
const engineDist = `${enginePackageRoot}/dist`;
// Publish `engineDist/EngineConfiguration` and the Engine*Data files from here.
```

The host supplies optional local-preview audio through `SONOLUS_ENGINE_BGM`. Catalogs, chart conversion, level metadata, HTTP routes,
release storage, authentication, and production resource URLs remain host
code.

Set `SONOLUS_ENGINE_REVISION` when a build runs from a source snapshot without
the native engine Git metadata; otherwise the build records the engine
repository's own `HEAD` in `dist/SOURCE.txt`.

## License

Haneoka-authored source is covered by [MPL-2.0](LICENSE). Third-party engine code retains its MIT license; preserve
[`LICENSE.pjsekai.txt`](LICENSE.pjsekai.txt) and [`NOTICE.txt`](NOTICE.txt)
when redistributing source or build artifacts. Game-derived media and host
asset packs are supplied and licensed by their respective operators.

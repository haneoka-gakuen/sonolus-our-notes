# `@haneoka/cassiopeia-sonolus-engine`

Sonolus play, watch, preview, and tutorial engine targets used by
`@haneoka/cassiopeia-plugin-sonolus`.

```sh
pnpm install --frozen-lockfile
pnpm build
```

Build output is written to `dist/` and includes the engine configuration,
scripts, and ROM files for each target.

Haneoka-authored files are licensed under [MPL-2.0](LICENSE). Preserve
[`LICENSE.pjsekai.txt`](LICENSE.pjsekai.txt) when redistributing derived engine
source or builds.

Local builds default to one target and one compiler worker, rather than
sonolus-cli's CPU-count-based pool. `SONOLUS_BUILD_JOBS` and
`SONOLUS_COMPILER_WORKERS` accept 1..4. For a constrained machine:

```sh
NODE_OPTIONS=--max-old-space-size=1536 pnpm build
```

Note effects come from the bounded baked atlas in the host-provided baked asset pack; rebuilding
the engine does not restore the former per-particle expansion.

# Compiler installation

Build this checkout with Node 24 or newer and the package manager pinned in
`package.json`:

```sh
pnpm install --frozen-lockfile
pnpm run verify:compiler
pnpm run build
```

The workspace applies `patches/sonolus.js-compiler@1.8.4.patch` to exactly
`@sonolus/sonolus.js-compiler@1.8.4`. It improves the compiler's FIFO work queue
and indexes read-only propagation states. Key identity, first-match lookup,
NaN handling, insertion order, and Value/T comparison remain intact.
The compiler's optimizer levels and engine behavior are unchanged.

Backward analyses start with reversed compiler postorder so successor states
reach predecessors earlier. Internal count-entry order may differ; optimizer
decisions use target identity and set membership.

`scripts/build.ts` verifies the reviewed patch and installed files before
generating or compiling facets. It checks both direct imports and the CLI
worker's peer dependency resolution. An unpatched installation or another
compiler version stops the build. Keep pnpm's patch application and unused
patch failures enabled.

In a parent workspace, register the same canonical patch in that workspace's
`pnpm-workspace.yaml` using its relative path, and update that workspace's lock
through pnpm. This repository's own workspace and lock support independent
checkout installation. Do not copy an experimental module loader into an app.

Before upgrading the compiler, review the patch against the new version and
regenerate the version-specific patch, file hashes, and both locks. Remove the
patch only when the selected upstream compiler provides equivalent behavior
and passes the build checks. Do not silently apply this patch to a version range.

The compiler patch is distributed under the MIT notice in
`LICENSE.sonolus-compiler.txt`. Preserve that notice with the patch. Runtime
resource and native client compatibility checks remain separate from compiler
installation.

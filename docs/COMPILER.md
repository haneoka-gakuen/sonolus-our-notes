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
and stores propagation states with target-indexed bitsets and shared immutable
blocks of 32 constant values. This avoids copying and scanning a full variable
map at each control-flow node. Key identity, first-match lookup, NaN-key
non-matches, NaN-value comparisons, and Value/T joins retain their semantics.
State entry order is internal; replacements still follow collected IR order.
Count and definition joins index targets once per input state, preserving first-match lookup and join order. Compiler decisions retain their original semantics.

Backward analyses start with reversed compiler postorder so successor states
reach predecessors earlier. Internal count-entry order may differ; optimizer
decisions use target identity and set membership.

CI compiles all four facets with high optimization. The build checks constant
level and temporary memory addresses against the native 0–4095 range.

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

# Running the Our Notes Sonolus server

With Node 24 or newer and the pinned pnpm, run these commands from this checkout.

```sh
pnpm install --frozen-lockfile
pnpm serve
```

Add the server at `http://localhost:3000` in Sonolus. Set `PORT` to change the listening port and `SONOLUS_ADDRESS` to advertise the public URL, including any reverse-proxy prefix.

The server supports Sonolus 1.1.4 and 1.1.5 and selects the protocol header from the client User-Agent.

The server uses the checked-in presentation assets and four executable engine facets. Run `pnpm build` to compile a local engine. The server uses the resulting `dist/` on its next start. The included original example chart has a 120 BPM click track. Set `SONOLUS_ENGINE_BGM` to use a different audio file for this chart, or `SONOLUS_LEVEL_PACK` to the output directory of `sonolus-pack` to serve your own catalog. Use the engine name `ourNotes` for levels that use this engine.

An external host can combine `resources/presentation/` with `resources/engine/Engine*` to serve the same resources with its own catalog.

// Read-only asset mounts plus three bounded output files; no file watching.
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname, basename, extname, sep } from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const packageRoot = (name) => dirname(require.resolve(`${name}/package.json`));
const kernel = packageRoot("@haneoka/cassiopeia");
const rules = packageRoot("@haneoka/cassiopeia-plugin-our-notes");
const rendererRoot = packageRoot("@haneoka/cassiopeia-renderer-three");
const runtime = resolve(process.argv[2] || "");
if (!process.argv[2] || !existsSync(resolve(runtime, "unity"))) throw Error("Pass an extracted runtime directory");
const output = resolve(process.argv[3] || resolve(root, "artifacts/effects"));
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const sourceInfo = {
  build: basename(dirname(runtime)),
  rendererSha256: sha256(resolve(rendererRoot, "dist/index.js")),
  captureScriptSha256: sha256(resolve(root, "optionaltools/effects/capture.mjs")),
};
mkdirSync(output, { recursive: true });
const mounts = {
  "/core/": resolve(kernel, "dist"),
  "/our-notes/": resolve(rules, "dist"),
  "/renderer/": resolve(rendererRoot, "dist"),
  "/three/": dirname(require.resolve("three")),
  "/runtime/": runtime,
};
const mime = {
  ".html": "text/html",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
};
const safe = (base, p) => {
  const f = resolve(base, p);
  if (!f.startsWith(base + sep)) throw Error("Invalid path");
  return f;
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (req.method === "POST" && /^\/output\/(particle\.texture\.png|particle\.json|capture\.json)$/.test(path)) {
      const chunks = [];
      let bytes = 0;
      for await (const c of req) {
        bytes += c.length;
        if (bytes > 128 * 1024 * 1024) throw Error("Upload limit");
        chunks.push(c);
      }
      writeFileSync(safe(output, path.slice(8)), Buffer.concat(chunks));
      res.end("ok");
      return;
    }
    if (req.method !== "GET") throw Error("Unsupported request");
    if (path === "/source.json") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(sourceInfo));
      return;
    }
    let file;
    if (path === "/") file = resolve(root, "optionaltools/effects/capture.html");
    else if (path === "/capture.mjs") file = resolve(root, "optionaltools/effects/capture.mjs");
    else if (path === "/sonolus-preview.mjs") file = resolve(root, "optionaltools/effects/sonolus-preview.mjs");
    else if (/^\/output\/(particle\.texture\.png|particle\.json)$/.test(path)) file = safe(output, path.slice(8));
    else if (path.startsWith("/asset/")) {
      // Materials sample the complete Texture2D, not a tight Sprite crop.
      // ef_tap_particle_star is 128x128; its 47x125 derivative would stretch
      // the luminous footprint and amplify bloom by changing pixel coverage.
      file = safe(resolve(runtime, "../assets"), path.slice(7));
    } else
      for (const [prefix, base] of Object.entries(mounts))
        if (path.startsWith(prefix)) file = safe(base, path.slice(prefix.length));
    if (!file || !existsSync(file)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.setHeader("content-type", mime[extname(file)] || "application/octet-stream");
    createReadStream(file).pipe(res);
  } catch (error) {
    res.writeHead(400);
    res.end(error.message);
  }
});
server.listen(4323, "127.0.0.1", () => console.log("Effect capture: http://127.0.0.1:4323"));

import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../..", import.meta.url));
if (!process.argv[2]) throw Error("Usage: node scripts/effects/bake.mjs RUNTIME_DIRECTORY OUTPUT_DIRECTORY");
const session = "cassiopeia-effect-bake";
const browser = (args, timeout = 60000) => {
  const result = spawnSync(
    process.env.AGENT_BROWSER || "npx",
    [...(process.env.AGENT_BROWSER ? [] : ["--yes", "agent-browser"]), "--session", session, ...args],
    { encoding: "utf8", timeout, maxBuffer: 1024 * 1024 },
  );
  if (result.error || result.status !== 0) throw Error(result.stderr || result.error?.message || result.stdout);
  return result.stdout.trim();
};
const poll = (expression, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  // Headless software WebGL makes the initial texture load slow; poll instead
  // of the fixed 25s `wait --fn` timeout.
  while (Date.now() < deadline) {
    if (browser(["eval", expression]).includes("true")) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000);
  }
  throw Error(`Timed out waiting for ${expression}`);
};
const server = spawn(
  process.execPath,
  [
    resolve(root, "optionaltools/effects/serve.mjs"),
    resolve(process.argv[2]),
    resolve(process.argv[3] || resolve(root, "artifacts/effects")),
  ],
  { stdio: ["ignore", "pipe", "inherit"] },
);
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("exit", (code) => reject(Error(`Capture server exited: ${code}`)));
    server.once("error", reject);
  });
  browser(["open", "http://127.0.0.1:4323"]);
  poll("window.captureReady === true", 300000);
  const count = Number(browser(["eval", "window.captureCount"]));
  if (!Number.isInteger(count) || count < 1 || count > 128) throw Error("Invalid capture count");
  for (let i = 0; i < count; i++) console.log(browser(["eval", `window.measureNext(${i})`], 180000));
  console.log(browser(["eval", "window.allocateAtlas()"]));
  for (let i = 0; i < count; i++) console.log(browser(["eval", `window.captureNext(${i})`], 180000));
  console.log(browser(["eval", "window.finishCapture()"], 300000));
} finally {
  try {
    browser(["close"]);
  } finally {
    server.kill("SIGTERM");
  }
}

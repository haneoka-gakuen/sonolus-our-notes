import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const engineRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(engineRoot, "dist");

mkdirSync(outputRoot, { recursive: true });
copyFileSync(resolve(engineRoot, "LICENSE"), resolve(outputRoot, "LICENSE"));
copyFileSync(resolve(engineRoot, "NOTICE.txt"), resolve(outputRoot, "NOTICE.txt"));
copyFileSync(resolve(engineRoot, "LICENSE.pjsekai.txt"), resolve(outputRoot, "LICENSE.pjsekai.txt"));

const explicitRevision = process.env.SONOLUS_ENGINE_REVISION?.trim();
let gitRevision: string | undefined;
try {
  gitRevision = execFileSync("git", ["-C", engineRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  gitRevision = undefined;
}
const sourceRevision = [explicitRevision, gitRevision].find((value) => /^[0-9a-f]{40}$/i.test(value ?? ""));
const sourceUrl = sourceRevision
  ? `https://github.com/haneoka-gakuen/sonolus-our-notes/tree/${sourceRevision}`
  : "https://github.com/haneoka-gakuen/sonolus-our-notes";
writeFileSync(resolve(outputRoot, "SOURCE.txt"), `Corresponding Haneoka Source Code Form:\n${sourceUrl}\n`);

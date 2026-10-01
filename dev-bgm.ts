import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

/** Optional local-preview audio supplied by the host. */
export function configureDevBgm(sonolus: unknown, devRoot: string): void {
  const source = process.env.SONOLUS_ENGINE_BGM;
  if (!source) return;
  const output = resolve(devRoot, "bgm.mp3");
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(resolve(source), output);
  const level = (sonolus as { level?: { items?: Array<{ bgm?: { hash: string; url: string } }> } }).level?.items?.[0];
  if (!level) throw new Error("No preview level is available for BGM setup");
  level.bgm = { hash: createHash("sha1").update(readFileSync(output)).digest("hex"), url: "/bgm.mp3" };
}

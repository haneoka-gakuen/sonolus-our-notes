import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SIMPLE_LOOP_WORLD_ROM as ABI } from "../shared/src/engine/data/simpleLoopWorldRomAbi.ts";

const [destination, sourcePath] = process.argv.slice(2);
if (!destination || !sourcePath) throw new Error("Usage: compile-source-view-rom-assets OUTPUT SOURCE_ROM");
const bytes = readFileSync(sourcePath),
  read = (index: number) => bytes.readFloatLE(index * 4);
if (
  read(0) !== ABI.magic ||
  (read(1) !== ABI.version && read(1) !== ABI.phaseVersion) ||
  read(6) !== ABI.recordStride ||
  read(10) !== ABI.motionStride ||
  read(11) * 4 !== bytes.length
)
  throw new Error("Source view ROM header mismatch");
const output = Buffer.from(bytes),
  camera = { y: read(16), z: read(17), sin: read(18), cos: read(19) },
  changed = new Set([16, 17, 18, 19]),
  keys = new Set<number>();
for (let i = 0; i < read(4); i++) {
  const record = read(5) + i * ABI.recordStride,
    offset = read(record + 6),
    count = read(record + 7);
  if (offset < ABI.headerSize || offset + count * ABI.motionStride > bytes.length / 4)
    throw new Error("Source view ROM motion range mismatch");
  for (let key = 0; key < count; key++) keys.add(offset + key * ABI.motionStride);
}
for (const key of keys) {
  const y = read(key + 1) - camera.y,
    z = read(key + 2) - camera.z;
  output.writeFloatLE(camera.cos * y - camera.sin * z, (key + 1) * 4);
  output.writeFloatLE(camera.sin * y + camera.cos * z, (key + 2) * 4);
  changed.add(key + 1);
  changed.add(key + 2);
}
for (const [index, value] of [
  [16, 0],
  [17, 0],
  [18, 0],
  [19, 1],
] as const)
  output.writeFloatLE(value, index * 4);
let preserved = 0;
for (let i = 0; i < bytes.length / 4; i++) {
  if (changed.has(i)) continue;
  if (!bytes.subarray(i * 4, i * 4 + 4).equals(output.subarray(i * 4, i * 4 + 4)))
    throw new Error("Source view ROM changed a protected value");
  preserved++;
}
const hash = (data: Uint8Array, algorithm = "sha256") => createHash(algorithm).update(data).digest("hex"),
  directory = resolve(destination);
mkdirSync(directory, { recursive: true });
writeFileSync(resolve(directory, "EngineRom"), output);
const report = {
  coordinateFrame: "camera-view",
  originalCameraFrame: camera,
  sourceRomSha256: hash(bytes),
  sourceRomMetadataSha1: hash(bytes, "sha1"),
  romSha256: hash(output),
  romMetadataSha1: hash(output, "sha1"),
  bytes: output.length,
  motionKeys: keys.size,
  protectedFloatValues: preserved,
  protected:
    "All record births, lifetimes, widths, sizes, motion times, curve keys and ABI fields outside camera frame remain exact.",
  interpolation:
    "Fixed affine camera transform commutes with linear motion interpolation; only the derived native ROM changes basis.",
};
writeFileSync(resolve(directory, "source-view-rom-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));

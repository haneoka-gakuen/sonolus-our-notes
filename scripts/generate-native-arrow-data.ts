import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type CurveKey = { time: number; a: number; b: number; c: number; d: number };
type Curve = number | readonly CurveKey[];

const engineRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUR_NOTES_BUNDLED_NOTE_ATLASES = JSON.parse(
  readFileSync(resolve(engineRoot, "contract/native-arrows.json"), "utf8"),
) as Record<string, unknown>;
const output = process.env.SONOLUS_NATIVE_ARROW_DATA_OUTPUT ?? "shared/src/engine/data/nativeArrowSource.generated.ts";

const skins = [
  { key: "Skin001", atlas: "skin001" },
  { key: "Skin002", atlas: "skin002" },
  { key: "Skin003", atlas: "skin003" },
] as const;

const directions = [
  { key: "Up", note: "flick", field: "up" },
  { key: "Left", note: "flick-left", field: "left" },
  { key: "Right", note: "flick-right", field: "right" },
] as const;

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${path} must be an object`);
  return value as Record<string, unknown>;
}

function finite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} must be finite`);
  return value;
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function sourceNotes(atlasKey: string): Record<string, unknown> {
  const atlas = record(
    OUR_NOTES_BUNDLED_NOTE_ATLASES[atlasKey as keyof typeof OUR_NOTES_BUNDLED_NOTE_ATLASES],
    atlasKey,
  );
  return record(atlas.notes, `${atlasKey}.notes`);
}

function arrowEntries(atlasKey: string, direction: (typeof directions)[number]): Record<string, unknown>[] {
  const note = record(sourceNotes(atlasKey)[direction.note], `${atlasKey}.notes.${direction.note}`);
  const arrows = note.arrows;
  if (!Array.isArray(arrows) || !arrows.length)
    throw new Error(`${atlasKey}.notes.${direction.note}.arrows must be non-empty`);
  return arrows.map((value, index) => record(value, `${atlasKey}.notes.${direction.note}.arrows[${index}]`));
}

function spriteRect(atlasKey: string, spriteName: string, index: number): { width: number; height: number } {
  const atlas = record(
    OUR_NOTES_BUNDLED_NOTE_ATLASES[atlasKey as keyof typeof OUR_NOTES_BUNDLED_NOTE_ATLASES],
    atlasKey,
  );
  const sprite = record(
    record(atlas.spriteMetadata, `${atlasKey}.spriteMetadata`)[spriteName],
    `${atlasKey}.spriteMetadata.${spriteName}`,
  );
  const rect = record(
    record(sprite.data, `${atlasKey}.spriteMetadata.${spriteName}.data`).m_Rect,
    `${atlasKey}.spriteMetadata.${spriteName}.data.m_Rect`,
  );
  return {
    width: finite(rect.width, `${atlasKey} arrow ${index} width`),
    height: finite(rect.height, `${atlasKey} arrow ${index} height`),
  };
}

function curve(value: unknown, path: string): Curve {
  if (typeof value === "number") return finite(value, path);
  if (!Array.isArray(value) || !value.length) throw new Error(`${path} must be a number or non-empty curve`);
  return value.map((entry, index) => {
    const key = record(entry, `${path}[${index}]`);
    return {
      time: finite(key.time, `${path}[${index}].time`),
      a: finite(key.a, `${path}[${index}].a`),
      b: finite(key.b, `${path}[${index}].b`),
      c: finite(key.c, `${path}[${index}].c`),
      d: finite(key.d, `${path}[${index}].d`),
    };
  });
}

function animation(atlasKey: string, direction: (typeof directions)[number]) {
  const note = record(sourceNotes(atlasKey)[direction.note], `${atlasKey}.notes.${direction.note}`);
  const value = record(note.arrowAnimation, `${atlasKey}.notes.${direction.note}.arrowAnimation`);
  return {
    duration: finite(value.duration, `${atlasKey} ${direction.field} duration`),
    x: curve(value.x, `${atlasKey} ${direction.field} x`),
    y: curve(value.y, `${atlasKey} ${direction.field} y`),
    scaleX: curve(value.scaleX, `${atlasKey} ${direction.field} scaleX`),
    scaleY: curve(value.scaleY, `${atlasKey} ${direction.field} scaleY`),
    alpha: curve(value.alpha, `${atlasKey} ${direction.field} alpha`),
  };
}

function number(value: number): string {
  return JSON.stringify(value);
}

function cubic(key: CurveKey, time: string): string {
  const delta = `(${time} - ${number(key.time)})`;
  let expression = number(key.a);
  for (const coefficient of [key.b, key.c, key.d]) {
    expression =
      expression === "0"
        ? number(coefficient)
        : `(${expression} * ${delta}${coefficient === 0 ? "" : ` + ${number(coefficient)}`})`;
  }
  return expression;
}

function curveExpression(value: Curve, time: string, duration: number): string {
  if (typeof value === "number") return number(value);
  const keys = value.filter((key) => key.time < duration);
  if (keys.every((key) => key.a === 0 && key.b === 0 && key.c === 0 && key.d === keys[0]!.d)) return number(keys[0]!.d);
  let expression = cubic(keys[keys.length - 1]!, time);
  for (let index = keys.length - 2; index >= 0; index -= 1) {
    const key = keys[index]!;
    const next = keys[index + 1]!;
    expression = `${time} < ${number(next.time)} ? ${cubic(key, time)} : ${expression}`;
  }
  return expression;
}

function renderAnimation(name: string, value: ReturnType<typeof animation>): string {
  const fields = ["duration", "x", "y", "scaleX", "scaleY", "alpha"] as const;
  return fields
    .map((field) => {
      const expression =
        field === "duration" ? number(value.duration) : curveExpression(value[field], "t", value.duration);
      return (
        `export const getNativeArrowAnimation${name}${field} = (time: number) => {\n` +
        (expression.includes("t -") || expression.includes("t <")
          ? `    const t = time - Math.floor(time / ${number(value.duration)}) * ${number(value.duration)}\n`
          : "") +
        `    return ${expression}\n}\n`
      );
    })
    .join("\n");
}

function renderIndex(name: string, entries: readonly Record<string, unknown>[]): string {
  const thresholds = entries.map((entry, index) => finite(entry.maxWidth, `${name} threshold ${index}`));
  let output = `export const getNativeArrowSpriteIndex${name} = (width: number) => {\n`;
  for (let index = 0; index < thresholds.length - 1; index += 1)
    output += `    if (width < ${number(thresholds[index]!)}) return ${index}\n`;
  return `${output}    return ${thresholds.length - 1}\n}\n`;
}

function renderMetric(
  atlasKey: string,
  name: string,
  entries: readonly Record<string, unknown>[],
  metric: "width" | "height",
): string {
  let output = `export const getNativeArrowSprite${metric[0]!.toUpperCase()}${metric.slice(1)}${name} = (index: number) => {\n    switch (index) {\n`;
  for (const [index, entry] of entries.entries()) {
    // Match the packer's existing repair for missing width-tier bindings.
    const binding =
      entry.sprite === null
        ? (entries.slice(index + 1).find((candidate) => candidate.sprite !== null)?.sprite ??
          entries.slice(0, index).findLast((candidate) => candidate.sprite !== null)?.sprite ??
          null)
        : entry.sprite;
    const sprite = binding === null ? null : text(binding, `${name} sprite ${index}`);
    const value = sprite === null ? 0 : spriteRect(atlasKey, sprite, index)[metric];
    output += `        case ${index}: return ${number(value)}\n`;
  }
  return `${output}        default: return 0\n    }\n}\n`;
}

let generated = `// Generated by scripts/generate-native-arrow-data.ts. Do not edit manually.\n\n`;
for (const skin of skins) {
  const duration = animation(skin.atlas, directions[0]!).duration;
  for (const direction of directions) {
    if (animation(skin.atlas, direction).duration !== duration)
      throw new Error(`${skin.atlas} arrow animation durations must agree across directions`);
  }
  for (const direction of directions) {
    const entries = arrowEntries(skin.atlas, direction);
    const name = `${skin.key}${direction.key}`;
    generated += renderIndex(name, entries);
    generated += renderMetric(skin.atlas, name, entries, "width");
    generated += renderMetric(skin.atlas, name, entries, "height");
    generated += renderAnimation(name, animation(skin.atlas, direction));
    generated += "\n";
  }
}

mkdirSync(dirname(resolve(engineRoot, output)), { recursive: true });
writeFileSync(resolve(engineRoot, output), generated);

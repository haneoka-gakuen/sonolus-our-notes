import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";
import type { ParticleData } from "@sonolus/core";
import {
  NATIVE_EFFECT_CONTRACT,
  NATIVE_EFFECT_PLANE_LABELS,
  NATIVE_EFFECT_WIDTHS,
  NATIVE_PARTICLE_TIMINGS,
  NATIVE_SHORT_EFFECT_DURATION,
  NATIVE_SHORT_EFFECTS,
} from "../shared/src/engine/data/nativeEffects.ts";

export function buildNativeParticleLifetimeAssets(options: {
  destination: string;
  baseline: string;
}) {
  const output = resolve(options.destination),
    baseline = resolve(options.baseline);
  const input = readFileSync(`${baseline}/particle.data`);
  const data = JSON.parse(gunzipSync(input).toString()) as ParticleData;
  const sourceDuration = NATIVE_PARTICLE_TIMINGS.simpleFlick[0];
  const ratio = sourceDuration / NATIVE_SHORT_EFFECT_DURATION;
  const prefix = NATIVE_EFFECT_CONTRACT.nativeEffects.semanticPrefix;
  const aliases = new Set(
    Object.values(NATIVE_SHORT_EFFECTS).flatMap(({ baseName }) =>
      NATIVE_EFFECT_WIDTHS.flatMap((width) =>
        NATIVE_EFFECT_PLANE_LABELS.map(
          (plane) => `${prefix} ${baseName} Short W${width} ${plane}`,
        ),
      ),
    ),
  );
  const originals = data.effects.filter((effect) => !aliases.has(effect.name));
  const replacedAliases = data.effects.length - originals.length;
  data.effects = [...originals];
  const entries: {
    source: string;
    alias: string;
    definitions: number;
    lastVisibleSeconds: number;
    maxTimingError: number;
  }[] = [];
  for (const { baseName } of Object.values(NATIVE_SHORT_EFFECTS)) {
    for (const width of NATIVE_EFFECT_WIDTHS) {
      for (const plane of NATIVE_EFFECT_PLANE_LABELS) {
        const name = `${prefix} ${baseName} W${width} ${plane}`;
        const source = data.effects.find((effect) => effect.name === name);
        if (!source) continue;
        const effect = structuredClone(source);
        effect.name = `${prefix} ${baseName} Short W${width} ${plane}`;
        let maxTimingError = 0,
          lastVisibleSeconds = 0,
          definitions = 0;
        for (const group of effect.groups) {
          for (const particle of group.particles) {
            const start = particle.start,
              duration = particle.duration;
            particle.start *= ratio;
            particle.duration *= ratio;
            lastVisibleSeconds = Math.max(
              lastVisibleSeconds,
              (start + duration) * sourceDuration,
            );
            maxTimingError = Math.max(
              maxTimingError,
              Math.abs(
                particle.start * NATIVE_SHORT_EFFECT_DURATION -
                  start * sourceDuration,
              ),
              Math.abs(
                particle.duration * NATIVE_SHORT_EFFECT_DURATION -
                  duration * sourceDuration,
              ),
            );
            definitions++;
          }
        }
        if (lastVisibleSeconds > NATIVE_SHORT_EFFECT_DURATION)
          throw new Error(`particle-support-exceeds-alias:${name}`);
        data.effects.push(effect);
        entries.push({
          source: name,
          alias: effect.name,
          definitions,
          lastVisibleSeconds,
          maxTimingError,
        });
      }
    }
  }
  mkdirSync(output, { recursive: true });
  const bytes = gzipSync(JSON.stringify(data), {
    level: 9,
    mtime: 0,
  } as Parameters<typeof gzipSync>[1]);
  writeFileSync(`${output}/particle.data`, bytes);
  if (output !== baseline)
    copyFileSync(
      `${baseline}/particle.texture.png`,
      `${output}/particle.texture.png`,
    );
  const digest = (value: Uint8Array, algorithm = "sha256") =>
    createHash(algorithm).update(value).digest("hex");
  const report = {
    scope:
      "Optional shortened residency aliases; all original effect entries, texture and property expressions remain.",
    producerSha256: digest(readFileSync(fileURLToPath(import.meta.url))),
    sourceDuration,
    aliasDuration: NATIVE_SHORT_EFFECT_DURATION,
    ratio,
    originalEffects: originals.length,
    replacedAliases,
    appendedEffects: entries.length,
    originalEntriesExact:
      JSON.stringify(data.effects.slice(0, originals.length)) ===
      JSON.stringify(originals),
    textureSha256: digest(readFileSync(`${output}/particle.texture.png`)),
    sourceDataSha256: digest(input),
    dataSha256: digest(bytes),
    dataMetadataSha1: digest(bytes, "sha1"),
    maxTimingError: Math.max(...entries.map((entry) => entry.maxTimingError)),
    entries,
  };
  writeFileSync(
    `${output}/particle-lifetime-report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return report;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [outputArgument, baselineArgument] = process.argv.slice(2);
  if (!outputArgument || !baselineArgument)
    throw new Error(
      "usage: build-native-particle-lifetime-assets output baseline-simple",
    );
  const report = buildNativeParticleLifetimeAssets({
    destination: outputArgument,
    baseline: baselineArgument,
  });
  console.log(
    JSON.stringify({
      aliases: report.appendedEffects,
      sourceDuration: report.sourceDuration,
      aliasDuration: report.aliasDuration,
      sha256: report.dataSha256,
    }),
  );
}

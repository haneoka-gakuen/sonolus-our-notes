import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { NATIVE_SHORT_SLIDE_EFFECT, nativeSlideShortEffectTable } from "../shared/src/engine/data/nativeEffects.ts";

interface Particle {
  start: number;
  duration: number;
  [key: string]: unknown;
}
interface Effect {
  name: string;
  groups: { count: number; particles: Particle[] }[];
  [key: string]: unknown;
}
interface Pack {
  effects: Effect[];
  [key: string]: unknown;
}

const recipes = NATIVE_SHORT_SLIDE_EFFECT.profiles.map((profile) => ({
  profile,
  family: NATIVE_SHORT_SLIDE_EFFECT.baseName,
  sourceDuration: NATIVE_SHORT_SLIDE_EFFECT.sourceDuration,
  aliasDuration: NATIVE_SHORT_SLIDE_EFFECT.duration,
}));
const [outputArg, baselineArg] = process.argv.slice(2);
if (!outputArg || !baselineArg) throw Error("Usage: build-native-hit-lifetime-assets.ts OUTPUT BASELINE_PARTICLES");
const output = resolve(outputArg),
  baseline = resolve(baselineArg);
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const reports = [];
for (const { profile, family, sourceDuration, aliasDuration } of recipes) {
  const source = resolve(baseline, profile);
  const bytes = readFileSync(resolve(source, "particle.data"));
  const pack = JSON.parse(gunzipSync(bytes).toString()) as Pack;
  const original = JSON.stringify(pack.effects);
  const aliasNames = new Map(
    Object.values(nativeSlideShortEffectTable()).map((alias) => [
      alias.replace(`${family} Short W`, `${family} W`),
      alias,
    ]),
  );
  const aliases: Effect[] = [];
  const definitions = [];
  const ratio = sourceDuration / aliasDuration;
  const sourceFloatDuration = Math.fround(sourceDuration),
    aliasFloatDuration = Math.fround(aliasDuration);
  let latestAbsoluteEnd = 0,
    latestFloatEnd = 0,
    maximumClockError = 0,
    maximumFloatClockError = 0;
  for (const effect of pack.effects) {
    const aliasName = aliasNames.get(effect.name);
    if (!aliasName) continue;
    const alias = structuredClone(effect);
    alias.name = aliasName;
    for (const [groupIndex, group] of alias.groups.entries()) {
      for (const [particleIndex, particle] of group.particles.entries()) {
        const { start, duration } = particle;
        particle.start *= ratio;
        particle.duration *= ratio;
        const oldEnd = (start + duration) * sourceDuration;
        const newEnd = (particle.start + particle.duration) * aliasDuration;
        const oldFloatStart = Math.fround(Math.fround(start) * sourceFloatDuration);
        const oldFloatDuration = Math.fround(Math.fround(duration) * sourceFloatDuration);
        const newFloatStart = Math.fround(Math.fround(particle.start) * aliasFloatDuration);
        const newFloatDuration = Math.fround(Math.fround(particle.duration) * aliasFloatDuration);
        const floatEnd = Math.fround(newFloatStart + newFloatDuration);
        const doubleError = Math.max(
          Math.abs(start * sourceDuration - particle.start * aliasDuration),
          Math.abs(duration * sourceDuration - particle.duration * aliasDuration),
          Math.abs(oldEnd - newEnd),
        );
        const floatError = Math.max(
          Math.abs(oldFloatStart - newFloatStart),
          Math.abs(oldFloatDuration - newFloatDuration),
          Math.abs(Math.fround(oldFloatStart + oldFloatDuration) - floatEnd),
        );
        latestAbsoluteEnd = Math.max(latestAbsoluteEnd, newEnd);
        latestFloatEnd = Math.max(latestFloatEnd, floatEnd);
        maximumClockError = Math.max(maximumClockError, doubleError);
        maximumFloatClockError = Math.max(maximumFloatClockError, floatError);
        if (newEnd > aliasDuration || floatEnd > aliasFloatDuration) throw Error(`Truncated ${effect.name}`);
        definitions.push({
          effect: effect.name,
          alias: alias.name,
          group: groupIndex,
          particle: particleIndex,
          start,
          duration,
          aliasStart: particle.start,
          aliasParticleDuration: particle.duration,
          absoluteEnd: newEnd,
          floatEnd,
          doubleError,
          floatError,
        });
      }
    }
    aliases.push(alias);
  }
  if (aliases.length !== aliasNames.size || JSON.stringify(pack.effects) !== original)
    throw Error("Original effect table changed");
  pack.effects.push(...aliases);
  const directory = resolve(output, profile);
  mkdirSync(directory, { recursive: true });
  const next = gzipSync(JSON.stringify(pack));
  writeFileSync(resolve(directory, "particle.data"), next);
  writeFileSync(resolve(directory, "particle.json"), JSON.stringify(pack));
  copyFileSync(resolve(source, "particle.texture.png"), resolve(directory, "particle.texture.png"));
  const report = {
    profile,
    family,
    sourceDuration,
    aliasDuration,
    sourceFloatDuration,
    aliasFloatDuration,
    ratio,
    aliases: aliases.length,
    originalEffects: pack.effects.length - aliases.length,
    sourceSha256: hash(bytes),
    candidateSha256: hash(next),
    latestAbsoluteEnd,
    latestFloatEnd,
    floatLifetimeMargin: aliasFloatDuration - latestFloatEnd,
    maximumClockError,
    maximumFloatClockError,
    originalEffectsExact: true,
    propertyExpressionsExact: true,
    groupCountsAndOrderExact: true,
    definitions,
  };
  writeFileSync(resolve(directory, "lifetime-report.json"), JSON.stringify(report, null, 2) + "\n");
  reports.push({ ...report, definitions: definitions.length });
}
mkdirSync(resolve(output, "simple"), { recursive: true });
for (const file of ["particle.data", "particle.texture.png"])
  copyFileSync(resolve(baseline, "simple", file), resolve(output, "simple", file));
writeFileSync(
  resolve(output, "summary.json"),
  JSON.stringify({ recipes, reports, simple: "byte-exact baseline" }, null, 2) + "\n",
);
console.log(JSON.stringify(reports));

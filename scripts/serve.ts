import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import express from "express";
import { Sonolus } from "@sonolus/express";
import { loadEngineResources } from "./engine-resources.mjs";
import { exampleLevel } from "./example-level.ts";

const root = resolve(import.meta.dirname, "..");
const localBuild = resolve(root, "dist");
const bundledEngine = resolve(root, "resources/engine");
const enginePrograms = ["Play", "Watch", "Preview", "Tutorial"].map((mode) => `Engine${mode}Data`);
const engineDirectory = enginePrograms.every((file) => existsSync(resolve(localBuild, file))) ? localBuild : bundledEngine;
const presentationDirectory = resolve(root, "resources/presentation");
const port = Number(process.env.PORT ?? 3000);
const address = process.env.SONOLUS_ADDRESS;
const sonolus = new Sonolus(address ? { address, fallbackLocale: "en" } : { fallbackLocale: "en" });
const resource = (path: string) => sonolus.add(resolve(presentationDirectory, path));
const jsonResource = (value: object) => sonolus.add(gzipSync(JSON.stringify(value)));
const thumbnail = sonolus.add(resolve(root, "docs/brand/icon-512.png"));
const item = <Version extends number>(name: string, version: Version, title: string | Record<string, string>) => ({
  name,
  version,
  title: typeof title === "string" ? { en: title } : title,
  subtitle: { en: "Our Notes", ja: "アワーノーツ" },
  author: { en: "haneoka" },
  tags: [],
});

const levelPack = process.env.SONOLUS_LEVEL_PACK;
if (levelPack) sonolus.load(resolve(levelPack));
sonolus.title = { en: "Our Notes", ja: "アワーノーツ" };
sonolus.description = { en: "BanG Dream! Our Notes", ja: "BanG Dream! Our Notes" };

function register<T extends { name: string }>(items: T[], entry: T): void {
  const existing = items.findIndex(({ name }) => name === entry.name);
  if (existing === -1) items.push(entry);
  else items[existing] = entry;
}

for (const [id, name, title] of [
  ["skin001", "ourNotesSkin", { en: "Our Notes", ja: "アワーノーツ" }],
  ["skin002", "ourNotesSkin002", { en: "Girls Band Party!", ja: "ガルパ" }],
  ["skin003", "ourNotesSkin003", { en: "Honeycomb", ja: "ハニカム" }],
] as const) {
  const directory = `skins/${id}`;
  register(sonolus.skin.items, {
    ...item(name, 4, title),
    thumbnail: resource(`${directory}/thumbnail.png`),
    data: resource(`${directory}/skin.data`),
    texture: resource(`${directory}/skin.texture.png`),
  });
}

for (const [id, name, title] of [
  [1, "ourNotesEffect", { en: "Default", ja: "デフォルト" }],
  [2, "ourNotesEffectSolid", { en: "Solid", ja: "ソリッド" }],
  [3, "ourNotesEffectWood", { en: "Wood", ja: "ウッド" }],
  [4, "ourNotesEffectTyping", { en: "Typing", ja: "タイピング" }],
] as const) {
  register(sonolus.effect.items, {
    ...item(name, 5, title),
    thumbnail,
    data: resource(`effects/${id}/effect.data`),
    audio: resource(`effects/${id}/effect.audio`),
  });
}

const particleThumbnail = resource("particle.thumbnail.png");
for (const [profile, name, title] of [
  ["standard", "ourNotesParticle", { en: "Default", ja: "デフォルト", ko: "기본", zhs: "默认", zht: "預設" }],
  ["light", "ourNotesParticleLight", { en: "Light", ja: "軽量", ko: "경량", zhs: "轻量", zht: "輕量" }],
  ["simple", "ourNotesParticleSimple", { en: "Simple", ja: "シンプル", ko: "심플", zhs: "简洁", zht: "簡約" }],
] as const) {
  register(sonolus.particle.items, {
    ...item(name, 3, title),
    thumbnail: particleThumbnail,
    data: resource(`particles/${profile}/particle.data`),
    texture: resource(`particles/${profile}/particle.texture.png`),
  });
}

const backgroundData = jsonResource({ aspectRatio: 1536 / 1212, fit: "cover", color: "#03030a" });
const backgroundConfiguration = jsonResource({ blur: 0, mask: "#0000004d" });
for (const [id, name, title] of [
  [0, "ourNotesBgStage", { en: "Stage", ja: "ステージ" }],
  [1, "ourNotesBgMyGO", "MyGO!!!!!"],
  [2, "ourNotesBgAveMujica", "Ave Mujica"],
  [3, "ourNotesBgMugendaiMewType", "Mugendai Mewtype"],
  [4, "ourNotesBgMillsage", "millsage"],
  [5, "ourNotesBgIkkaDumbRock", "Ikka Dumb Rock!"],
] as const) {
  register(sonolus.background.items, {
    ...item(name, 2, title),
    thumbnail: resource(`backgrounds/${id}/thumbnail.png`),
    image: resource(`backgrounds/${id}/image.png`),
    data: backgroundData,
    configuration: backgroundConfiguration,
  });
}

const engineName = "ourNotes";
const engine = loadEngineResources(engineDirectory);
register(sonolus.engine.items, {
  ...item(engineName, 13, "Our Notes"),
  skin: "ourNotesSkin",
  background: "ourNotesBgMyGO",
  effect: "ourNotesEffect",
  particle: "ourNotesParticleSimple",
  thumbnail,
  playData: sonolus.add(engine.playData),
  watchData: sonolus.add(engine.watchData),
  previewData: sonolus.add(engine.previewData),
  tutorialData: sonolus.add(engine.tutorialData),
  configuration: sonolus.add(engine.configuration),
  ...(engine.rom ? { rom: sonolus.add(engine.rom) } : {}),
});

if (!levelPack) {
  const bgm = process.env.SONOLUS_ENGINE_BGM;
  sonolus.level.items.push({
    ...item("ourNotesExample", 1, {
      en: "Example Chart",
      ja: "サンプル譜面",
      ko: "예제 채보",
      zhs: "示例谱面",
      zht: "範例譜面",
    }),
    artists: { en: "Our Notes" },
    rating: 0,
    engine: engineName,
    useSkin: { useDefault: true },
    useBackground: { useDefault: true },
    useEffect: { useDefault: true },
    useParticle: { useDefault: true },
    cover: thumbnail,
    bgm: sonolus.add(bgm ? resolve(bgm) : resolve(bundledEngine, "example.mp3")),
    preview: {},
    data: jsonResource(exampleLevel),
  });
}

const app = express();
app.use(sonolus.router);
app.listen(port, () => console.log(`Our Notes Sonolus listening on ${address ?? `http://localhost:${port}`}`));

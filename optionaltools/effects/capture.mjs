import { WebGLRenderer, PerspectiveCamera, Scene, Vector3, SRGBColorSpace, Mesh, PlaneGeometry, ShaderMaterial, Texture, NoColorSpace, LinearFilter } from "three";
import {
  ParticleLayer,
  StageProjector,
  configureOurNotesCamera,
  LiveUrpBloomPipeline,
} from "@haneoka/cassiopeia-renderer-three";
import { createOurNotesAssetManifest, nativeParticleEffectLifetime } from "@haneoka/cassiopeia-plugin-our-notes";
import {
  SonolusParticlePreview,
  readSourceLoopRom,
  groundEffectLayout,
  linearEffectLayout,
  planeEffectLayout,
  stageToPixel,
  stageTransform,
} from "/sonolus-preview.mjs";

const placeholder = "/unused";
const sourceInfo = await fetch("/source.json").then((response) => {
  if (!response.ok) throw Error("Could not read capture provenance");
  return response.json();
});
const icons = (names) => Object.fromEntries(names.map((n) => [n, placeholder]));
const hud = {
  judgementImages: icons(["just", "perfect", "great", "good", "bad", "miss", "fast", "late"]),
  comboLabelUrl: placeholder,
  comboDigitUrls: [],
  perfectComboLabelUrl: placeholder,
  perfectComboDigitUrls: [],
  pauseIconUrl: placeholder,
  pauseFrameUrl: placeholder,
  pauseShadowUrl: placeholder,
  lifeIconUrls: icons(["normal", "danger", "over"]),
  rankIconUrls: icons(["D", "C", "B", "A", "S", "SS"]),
  rankBaseUrl: placeholder,
  statusBaseUrl: placeholder,
  scoreStarUrl: placeholder,
  whiteSpriteUrl: placeholder,
};
// ?quality=2 selects the authored effect001Light profile (native quality 2).
const quality = Number(new URLSearchParams(location.search).get("quality") ?? "0");
const noteEffectSkin =
  new URLSearchParams(location.search).get("skin") === "effect001Simple" ? "effect001Simple" : "effect001";
const assets = createOurNotesAssetManifest(
  { noteAtlasTextureUrl: placeholder, hud, currentQuality: Number.isInteger(quality) ? quality : 0, noteEffectSkin },
  {
    asset: (path) => "/asset/" + path,
    runtime: (path) => "/runtime/" + path,
  },
);
const renderer = new WebGLRenderer({
  canvas: document.querySelector("#view"),
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setSize(1920, 1080, false);
renderer.setClearColor(0, 1);
renderer.autoClear = false;
renderer.outputColorSpace = SRGBColorSpace;
const camera = configureOurNotesCamera(new PerspectiveCamera(54, 16 / 9, 0.1, 5000));
const projector = new StageProjector();
const particles = new ParticleLayer(projector, assets, 1, 4096);
const scene = new Scene();
scene.add(particles.group);
scene.add(particles.laneInputGroup);
const bloom = new LiveUrpBloomPipeline();
bloom.setSize(1920, 1080);
await particles.loadTextures();
const captureWidth = 6;
const ref = (19.12000084 * captureWidth) / 24;
const origin = new Vector3(0, 0, -9.62).project(camera);
const unitX = new Vector3(ref / 2, 0, -9.62).project(camera).x;
// Sonolus' vertical effect unit is one physical lane measured in screen
// height units, not the perspective displacement of moving along the ground.
const unitY = new Vector3(19.12000084 / 24, 0, -9.62).project(camera).x * 2 * camera.aspect;
const boundsByEffect = [];
const measure = document.createElement("canvas");
measure.width = 256;
measure.height = 144;
const measureCtx = measure.getContext("2d", { willReadFrequently: true });
// Sonolus binds exactly one PNG texture per level, so every frame shares one
// atlas. 8192 is the largest texture size safe across Sonolus devices. Each
// frame first gets the 4x floor (190x254 vs the legacy 94x126 tiles); the
// remaining atlas budget is then distributed proportionally to each effect's
// on-screen footprint so wide/tall effects stay as sharp as small ones.
const atlas = document.createElement("canvas");
const ctx = atlas.getContext("2d", { willReadFrequently: true });
const floorTileWidth = 190,
  floorTileHeight = 254;
const sample = document.createElement("canvas");
const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
const specs = [];
for (const [kind, label, direction] of [
  ["tap", "Normal", "none"],
  ["slide", "Slide", "none"],
  ["flick", "Flick", "up"],
  ["flick", "Flick Left", "left"],
  ["flick", "Flick Right", "right"],
  ["connect", "Connect", "none"],
]) {
  for (const [judgement, j] of [
    ["perfect", 5],
    ["great", 4],
    ["good", 3],
    ["bad", 2],
  ])
    specs.push({
      kind,
      name:
        "Our Notes Native " +
        label +
        (judgement === "perfect" ? "" : " " + judgement[0].toUpperCase() + judgement.slice(1)),
      direction,
      judgement,
      lifetime: nativeParticleEffectLifetime(kind, j),
    });
}
specs.push({
  kind: "slide-loop",
  name: "Our Notes Native Slide Loop",
  direction: "none",
  judgement: "perfect",
  lifetime: 1,
});
const baseSpecs = specs.splice(0);
for (const spec of baseSpecs)
  for (const width of [4, 6, 10]) {
    specs.push({ ...spec, width, name: spec.name + (width === 6 ? "" : ` Width ${width}`) });
  }
for (const [kind, label] of [
  ["lane-input-blank-miss", "In Vain"],
  ["lane-effect-normal", "Normal"],
  ["lane-effect-slide", "Slide"],
  ["lane-effect-flick", "Flick"],
  ["lane-effect-flick-left", "Flick Left"],
  ["lane-effect-flick-right", "Flick Right"],
])
  specs.push({
    kind,
    name: "Our Notes Lane " + label,
    direction: "none",
    judgement: "perfect",
    lifetime: 0.225,
    ground: true,
    width: 4,
  });
window.captureCount = specs.length;
const sprites = [],
  effects = [];
const plans = [];
let atlasDensity = 0;
const constant = (c) => ({ from: { c }, to: { c }, ease: "linear" });
const frameSettings = (spec) => {
  // Native effect camera updates at 30 Hz. Loop samples use steady-state emission.
  const frames = Math.min(32, Math.max(2, Math.ceil(spec.lifetime * 30)));
  const frameRate = Math.min(30, frames / spec.lifetime);
  const width = spec.width ?? captureWidth;
  const unitX = new Vector3((19.12000084 * width) / 48, 0, -9.62).project(camera).x;
  const draw = (f) => {
    const effect = {
      id: 1,
      kind: spec.kind,
      direction: spec.direction,
      judgement: spec.judgement,
      lane: 12 - width / 2,
      width,
      age: (spec.kind === "slide-loop" ? 1 : 0) + f / frameRate,
      lifetime: spec.kind === "slide-loop" ? 2 : spec.lifetime,
      seed: 0x4f4e,
    };
    particles.update(spec.ground ? [] : [effect]);
    particles.updateLaneInput(spec.ground ? [effect] : []);
    renderer.setRenderTarget(null);
    renderer.clear();
    if (spec.ground) renderer.render(scene, camera);
    else {
      bloom.renderEffect(renderer, () => renderer.render(scene, camera));
      bloom.composite(renderer);
    }
  };
  return { frames, frameRate, width, unitX, draw };
};
// Phase 1: measure every effect's live bounds from a 256x144 probe.
window.measureNext = async (index) => {
  if (index !== plans.length) throw Error("Measure effects in order, once each");
  const spec = specs[index];
  if (!spec) throw Error("Invalid effect index");
  const { frames, frameRate, width, unitX, draw } = frameSettings(spec);
  particles.update([]);
  let minX = 256,
    minY = 144,
    maxX = -1,
    maxY = -1;
  for (let f = 0; f < frames; f++) {
    draw(f);
    measureCtx.drawImage(renderer.domElement, 0, 0, 256, 144);
    const p = measureCtx.getImageData(0, 0, 256, 144).data;
    for (let y = 0; y < 144; y++)
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 4;
        if (Math.max(p[i], p[i + 1], p[i + 2]) < 2) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  }
  if (maxX < 0) throw Error("Empty rendered effect: " + spec.name);
  minX = Math.max(0, minX - 2);
  minY = Math.max(0, minY - 2);
  maxX = Math.min(256, maxX + 3);
  maxY = Math.min(144, maxY + 3);
  const crop = [minX * 7.5, minY * 7.5, (maxX - minX) * 7.5, (maxY - minY) * 7.5];
  const bounds = {
    l: (minX / 128 - 1) / unitX,
    r: (maxX / 128 - 1) / unitX,
    b: -1 + (1 - maxY / 72 - origin.y) / unitY,
    t: -1 + (1 - minY / 72 - origin.y) / unitY,
  };
  boundsByEffect.push({ name: spec.name, sourceWidth: width, unitX, bounds });
  plans.push({ spec, frames, frameRate, crop, bounds, draw });
  document.querySelector("#status").textContent = `Measured ${index + 1}/${specs.length}: ${spec.name}`;
  return { index, frames };
};
// Phase 2: solve the per-effect tile sizes and shelf-pack every frame.
const layoutAtlas = (density) => {
  for (const plan of plans) {
    plan.tileW = Math.max(floorTileWidth, 2 * Math.ceil((plan.crop[2] * density) / 2));
    plan.tileH = Math.max(floorTileHeight, 2 * Math.ceil((plan.crop[3] * density) / 2));
    plan.slots = [];
  }
  const order = plans.flatMap((plan, specIndex) =>
    Array.from({ length: plan.frames }, (_, f) => ({ plan, f, specIndex })),
  );
  // Tallest first keeps shelves tight; the spec index keeps the layout deterministic.
  order.sort((a, b) => b.plan.tileH - a.plan.tileH || a.specIndex - b.specIndex);
  const shelves = [];
  for (const { plan, f } of order) {
    const { tileW, tileH } = plan;
    let shelf = shelves.find((s) => s.h >= tileH && atlas.width - s.x >= tileW);
    if (!shelf) {
      shelf = { x: 0, h: tileH, y: shelves.reduce((total, s) => total + s.h, 0) };
      shelves.push(shelf);
    }
    plan.slots[f] = { x: shelf.x, y: shelf.y };
    shelf.x += tileW;
  }
  return shelves.reduce((total, s) => total + s.h, 0);
};
window.allocateAtlas = () => {
  if (plans.length !== specs.length) throw Error("Incomplete effect measurement");
  // Diagnostic previews use the source and Sonolus canvases only. Allocate
  // the 256 MiB capture atlas when an actual atlas capture begins.
  atlas.width = 8192;
  atlas.height = 8192;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 40; i++) {
    if (layoutAtlas((lo + hi) / 2) <= atlas.height - 64) lo = (lo + hi) / 2;
    else hi = (lo + hi) / 2;
  }
  if (lo === 0 || layoutAtlas(lo) > atlas.height - 64) throw Error("Effect atlas capacity exceeded");
  atlasDensity = lo;
  for (let i = 0; i < plans.length; i++) boundsByEffect[i].tile = [plans[i].tileW, plans[i].tileH];
  document.querySelector("#status").textContent = `Allocated atlas at density ${lo.toFixed(3)}`;
  return {
    density: lo,
    packedHeight: layoutAtlas(lo),
    minTile: Math.min(...plans.map((p) => p.tileW * p.tileH)),
    maxTile: Math.max(...plans.map((p) => p.tileW * p.tileH)),
  };
};
// Phase 3: capture every frame into its allocated tile.
window.captureNext = async (index) => {
  if (index !== effects.length) throw Error("Capture effects in order, once each");
  const plan = plans[index];
  if (!plan) throw Error("Invalid effect index");
  if (!plan.slots?.length) throw Error("Allocate the atlas before capture");
  const { spec, frames, frameRate, crop, bounds, draw } = plan;
  sample.width = plan.tileW - 2;
  sample.height = plan.tileH - 2;
  const groups = [];
  particles.update([]);
  for (let f = 0; f < frames; f++) {
    draw(f);
    sampleCtx.clearRect(0, 0, sample.width, sample.height);
    sampleCtx.drawImage(renderer.domElement, ...crop, 0, 0, sample.width, sample.height);
    const pixels = sampleCtx.getImageData(0, 0, sample.width, sample.height);
    // Sonolus uses straight-alpha sprites. Preserve emission on black; the
    // missing additive blend on bright backgrounds is a documented loss.
    for (let p = 0; p < pixels.data.length; p += 4) {
      const a = Math.max(pixels.data[p], pixels.data[p + 1], pixels.data[p + 2]);
      if (a) for (let c = 0; c < 3; c++) pixels.data[p + c] = Math.round((pixels.data[p + c] * 255) / a);
      pixels.data[p + 3] = a;
    }
    const { x, y } = plan.slots[f];
    ctx.putImageData(pixels, x + 1, y + 1);
    sprites.push({ x: x + 1, y: y + 1, w: sample.width, h: sample.height });
    const start = f / frameRate / spec.lifetime;
    const end = Math.min((f + 1) / frameRate / spec.lifetime, 1);
    groups.push({
      count: 1,
      particles: [
        {
          sprite: sprites.length - 1,
          color: "#ffffff",
          start,
          duration: end - start,
          x: constant((bounds.l + bounds.r) / 2),
          y: constant((bounds.b + bounds.t) / 2),
          // Sonolus/studio getPoint uses x +/- w and y +/- h.
          w: constant((bounds.r - bounds.l) / 2),
          h: constant((bounds.t - bounds.b) / 2),
          r: constant(0),
          // Studio includes both interval endpoints. 'none' steps to zero
          // exactly at the end, preventing adjacent frames from doubling glow.
          a: { from: { c: 1 }, to: { c: 0 }, ease: "none" },
        },
      ],
    });
  }
  effects.push({
    name: spec.name,
    transform: Object.fromEntries(["x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"].map((k) => [k, { [k]: 1 }])),
    groups,
  });
  document.querySelector("#status").textContent = `Captured ${index + 1}/${specs.length}: ${spec.name}`;
  return { index, frames, tile: [plan.tileW, plan.tileH] };
};
window.finishCapture = async () => {
  if (effects.length !== specs.length) throw Error("Incomplete effect capture");
  const blob = await new Promise((resolve) => atlas.toBlob(resolve, "image/png"));
  if (!blob) throw Error("Atlas PNG encoding failed");
  const save = async (name, options) => {
    const response = await fetch(`/output/${name}`, options);
    if (!response.ok) throw Error(`Saving ${name} failed: ${await response.text()}`);
  };
  await save("particle.texture.png", { method: "POST", body: blob });
  await save("particle.json", {
    method: "POST",
    body: JSON.stringify({
      width: 8192,
      height: 8192,
      interpolation: true,
      sprites,
      effects,
    }),
  });
  await save("capture.json", {
    method: "POST",
    body: JSON.stringify({
      schema: "cassiopeia-baked-effects-v1",
      source: noteEffectSkin,
      renderer: "Cassiopeia ParticleLayer + LiveUrpBloom",
      sourceInfo,
      seed: 0x4f4e,
      captureWidth,
      unitX,
      unitY,
      referenceValidated: false,
      loopWarmupSeconds: 1,
      boundsByEffect,
      tileSize: [floorTileWidth, floorTileHeight],
      tileDensity: atlasDensity,
      specs,
    }),
  });
  particles.dispose();
  bloom.dispose();
  renderer.dispose();
  return { effects: effects.length, sprites: sprites.length };
};
window.captureReady = true;
document.querySelector("#status").textContent = "Ready";

const loadPreviewBackground = async (url) => createImageBitmap(
  await fetch(url).then((response) => {
    if (!response.ok) throw Error("Could not read preview background");
    return response.blob();
  }),
  { premultiplyAlpha: "none", colorSpaceConversion: "none", imageOrientation: "none" },
);

const previewBackgroundLayer = (bitmap) => {
  const texture = new Texture(bitmap);
  texture.colorSpace = NoColorSpace;
  texture.flipY = false;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    uniforms: { uMap: { value: texture } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }",
    fragmentShader: "uniform sampler2D uMap; varying vec2 vUv; void main(){ gl_FragColor=texture2D(uMap,vec2(vUv.x,1.0-vUv.y)); }",
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  return { scene, dispose: () => { geometry.dispose(); material.dispose(); texture.dispose(); } };
};

// Full-resolution diagnostic view for comparison with recorded client frames.
const previewEffect = ({
  kind = "tap",
  direction = "none",
  judgement = "perfect",
  age = 0.1,
  width = 4,
  lane = 6,
  screenWidth = 1554,
  screenHeight = 1080,
  sourceFrameRate = 60,
  sourceSeed = 0x4f4e,
  includeSourceTrace = false,
  sourceParticles,
  sourceMeshFamilies,
  sourceBillboardTextures,
  bloomEnabled = true,
  bloomQuality,
  renderingScale = 0.85,
  backgroundRgb = [0, 0, 0],
  backgroundImageUrl,
  backgroundBitmap,
  laneInstances,
} = {}) => {
  const diagnosticBloom = renderingScale === 0.85 && bloomQuality === undefined ? bloom : new LiveUrpBloomPipeline(renderingScale, bloomQuality);
  const visibility = [];
  const sourceTrace = [];
  const alphaRestore = [];
  const bloomIntensity = diagnosticBloom.compositeUniforms.uIntensity.value;
  if (!bloomEnabled) diagnosticBloom.compositeUniforms.uIntensity.value = 0;
  if (includeSourceTrace || sourceParticles) particles.setTraceSink({ billboard: (entry) => sourceTrace.push(entry), mesh: () => {} });
  const background = backgroundBitmap ? previewBackgroundLayer(backgroundBitmap) : undefined;
  try {
    const aspect = screenWidth / screenHeight;
    camera.aspect = aspect;
    camera.fov = (2 * Math.atan((Math.tan((54 * Math.PI) / 360) * (16 / 9)) / Math.min(aspect, 16 / 9)) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    renderer.setSize(screenWidth, screenHeight, false);
    diagnosticBloom.setSize(screenWidth, screenHeight);
    const updateStarted = performance.now();
    particles.update([]);
    particles.updateLaneInput([]);
    const effect = {
      id: 1, kind, direction, judgement, lane, width, age,
      ...(kind === "slide-loop" ? {} : { lifetime: kind.startsWith("lane-") ? 0.45 / 2 : 1 }),
      seed: sourceSeed,
    };
    const laneFeedback = laneInstances !== undefined || kind.startsWith("lane-");
    if (laneFeedback) particles.updateLaneInput(laneInstances === undefined ? [effect] : laneInstances.map((entry, i) => ({
      id: `lane-instance-${i}`, kind: entry.kind, direction: "none", judgement: "perfect",
      lane: entry.chartLane, width: 1, age: entry.age, lifetime: Math.fround(.225), seed: 1,
    })));
    else {
      for (let frame = 0; frame / sourceFrameRate < age; frame++)
        particles.update([{ ...effect, age: frame / sourceFrameRate }]);
      sourceTrace.length = 0;
      particles.update([effect]);
    }
    if (sourceParticles) scene.traverse((object) => {
      if (!object.isMesh || !object.name.startsWith("Effect001Particles:")) return;
      const texture = object.name.slice("Effect001Particles:".length);
      const entries = sourceTrace.filter(entry => entry.texture === texture);
      const colour = object.geometry.attributes.aColor;
      for (let i = 0; i < object.geometry.instanceCount; i++) {
        const entry = entries[i];
        if (entry && sourceParticles.some(p => p.system === entry.system && p.emission === entry.emission)) continue;
        alphaRestore.push([colour, i, colour.getW(i)]);
        colour.setW(i, 0);
      }
      colour.data.needsUpdate = true;
    });
    if (sourceMeshFamilies || sourceBillboardTextures)
      scene.traverse((object) => {
        if (!object.isMesh) return;
        visibility.push([object, object.visible]);
        object.visible = object.visible && ((sourceMeshFamilies?.some((family) => object.name === `Effect001Mesh:${family}`) ?? false) || (sourceBillboardTextures?.some((texture) => object.name === `Effect001Particles:${texture}`) ?? false));
      });
    const cpuUpdateMs = performance.now() - updateStarted;
    renderer.setRenderTarget(null);
    renderer.setClearColor((backgroundRgb[0] << 16) | (backgroundRgb[1] << 8) | backgroundRgb[2], 1);
    renderer.clear();
    if (background) renderer.render(background.scene, camera);
    if (laneFeedback) renderer.render(scene, camera);
    else {
      diagnosticBloom.renderEffect(renderer, () => renderer.render(scene, camera));
      diagnosticBloom.composite(renderer);
    }
    const stats = particles.stats;
    const sourceBuffers = [];
    if (includeSourceTrace) scene.traverse((object) => {
      if (!object.isMesh || !object.name.startsWith("Effect001Particles:center")) return;
      const values = {};
      for (const key of ["aColor", "aTint", "aSize", "aRenderMode"]) {
        const attr = object.geometry.attributes[key];
        if (attr) values[key] = [attr.getX(0), attr.getY(0), attr.getZ(0), attr.getW(0)].slice(0, attr.itemSize);
      }
      sourceBuffers.push({ name: object.name, values, texture: object.material.uniforms.uMap.value.image.src, visible: object.visible });
    });
    const png = renderer.domElement.toDataURL("image/png");
    return { png, age, width, lane, stats, cpuUpdateMs, sourceFrameRate, sourceSeed, noteEffectSkin, renderingScale, sourceParticles, sourceMeshFamilies, sourceBillboardTextures, bloomEnabled, bloomQuality, backgroundRgb, backgroundImage: Boolean(backgroundImageUrl), ...(laneInstances === undefined ? {} : { laneInstances }), ...(includeSourceTrace ? { sourceTrace, sourceBuffers } : {}) };
  } finally {
    diagnosticBloom.compositeUniforms.uIntensity.value = bloomIntensity;
    if (includeSourceTrace || sourceParticles) particles.setTraceSink(undefined);
    for (const [colour, index, alpha] of alphaRestore) { colour.setW(index, alpha); colour.data.needsUpdate = true; }
    background?.dispose();
    for (const [object, visible] of visibility) object.visible = visible;
    particles.update([]);
    particles.updateLaneInput([]);
    renderer.setClearColor(0, 1);
    camera.aspect = 16 / 9;
    camera.fov = 54;
    camera.updateProjectionMatrix();
    renderer.setSize(1920, 1080, false);
    bloom.setSize(1920, 1080);
    if (diagnosticBloom !== bloom) diagnosticBloom.dispose();
  }
};

window.previewEffect = (options = {}) => options.backgroundImageUrl
  ? loadPreviewBackground(options.backgroundImageUrl).then((bitmap) => {
      try { return previewEffect({ ...options, backgroundBitmap: bitmap }); }
      finally { bitmap.close(); }
    })
  : previewEffect(options);

// Native Sonolus particle preview of /output/particle.json at the same
// screen size, for numeric comparison with previewEffect().
let sonolusPreview;
let sonolusSourceRom;
let sonolusPreviewKey;
window.previewSonolus = async ({
  names = [],
  ground = [],
  chartLane = 6,
  width = 4,
  progress = 0.1,
  screenWidth = 1554,
  screenHeight = 1080,
  seed = 1,
  loop = false,
  planeOrder = [0, 1, 2, 3],
  sourceLoopTime,
  sourceLoopFrameRate = 60,
  sourceLoopLayout,
  compositeOperation = "source-over",
  backgroundRgb = [0, 0, 0],
  backgroundImageUrl,
  laneInstances,
  particleDataUrl = "/output/particle.json",
  textureUrl = "/output/particle.texture.png",
} = {}) => {
  const resourceKey = `${particleDataUrl}|${textureUrl}`;
  if (!sonolusPreview || sonolusPreviewKey !== resourceKey) {
    const data = await fetch(particleDataUrl, { cache: "no-store" }).then((r) => r.json());
    const image = await createImageBitmap(
      await fetch(textureUrl, { cache: "no-store" }).then((r) => r.blob()),
      { premultiplyAlpha: "none", colorSpaceConversion: "none" },
    );
    const previous = sonolusPreview;
    sonolusPreview = new SonolusParticlePreview(data, image);
    previous?.image.close?.();
    sonolusPreviewKey = resourceKey;
  }
  const canvas = new OffscreenCanvas(screenWidth, screenHeight);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${backgroundRgb.join(",")})`;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  if (backgroundImageUrl) {
    const bitmap = await loadPreviewBackground(backgroundImageUrl);
    try { ctx.drawImage(bitmap, 0, 0, screenWidth, screenHeight); }
    finally { bitmap.close(); }
  }
  if (!["source-over", "lighter"].includes(compositeOperation)) throw Error("Invalid diagnostic composite operation");
  ctx.globalCompositeOperation = compositeOperation;
  const tr = stageTransform(screenWidth / screenHeight);
  const toPixel = stageToPixel(tr, screenWidth, screenHeight);
  // chartToLevelData: lane = (pos + size / 2) / 2 - 6, size = width / 4.
  const lane = (chartLane + width / 2) / 2 - 6;
  const size = width / 4;
  let drawn = 0;
  for (const name of names) {
    // Layered native effects: "<name> P0".."P3", each on its own plane.
    if (sonolusPreview.byName.has(`${name} P0`)) {
      for (const plane of planeOrder) {
        if (!sonolusPreview.byName.has(`${name} P${plane}`)) continue;
        drawn += sonolusPreview.draw(
          ctx,
          `${name} P${plane}`,
          planeEffectLayout(tr, plane, lane, size),
          progress,
          toPixel,
          seed + plane * 7919,
          loop,
        );
      }
    } else drawn += sonolusPreview.draw(ctx, name, name.endsWith(" B0") ? planeEffectLayout(tr, 0, lane, size) : linearEffectLayout(tr, lane, size), progress, toPixel, seed, loop);
  }
  for (const name of ground)
    drawn += sonolusPreview.draw(ctx, name, groundEffectLayout(tr, lane, size), progress, toPixel, seed, loop);
  for (const entry of laneInstances ?? []) {
    if (entry.age < 0 || entry.age >= Math.fround(.225)) continue;
    const spec = specs.find((spec) => spec.ground && spec.kind === entry.kind);
    if (!spec) throw Error(`Unknown lane feedback kind: ${entry.kind}`);
    const centre = (entry.chartLane + .5) / 2 - 6;
    drawn += sonolusPreview.draw(ctx, spec.name, groundEffectLayout(tr, centre, .25),
      Math.fround(entry.age) / Math.fround(.225), toPixel, 1, false);
  }
  let sourceResidents = 0;
  let sourceDroppedLate = 0;
  if (sourceLoopTime !== undefined) {
    sonolusSourceRom ??= readSourceLoopRom(
      await fetch("/output/EngineRom", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw Error("Source particle ROM is missing");
        return r.arrayBuffer();
      }),
    );
    const result = sonolusPreview.drawMovedSourceSlot(
      ctx,
      sonolusSourceRom,
      sourceLoopTime,
      tr,
      lane,
      toPixel,
      sourceLoopFrameRate,
      1,
      size,
      sourceLoopLayout,
    );
    drawn += result.drawn;
    sourceResidents = result.residents;
    sourceDroppedLate = result.droppedLate;
  }
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { png: "data:image/png;base64," + btoa(binary), drawn, sourceResidents, sourceDroppedLate, compositeOperation, backgroundRgb, backgroundImage: Boolean(backgroundImageUrl) };
};
window.reloadSonolus = () => {
  sonolusPreview?.image.close?.();
  sonolusPreview = undefined;
  sonolusPreviewKey = undefined;
  sonolusSourceRom = undefined;
  return true;
};

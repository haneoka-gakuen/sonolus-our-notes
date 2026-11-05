export const LANE_CLIP_CELLS = 64;
export const LANE_CLIP_STRIDE = LANE_CLIP_CELLS * 2 - 1;

export function isLaneClippedSprite(name: string): boolean {
  return /^Our Notes (Native (Tap|Slide|End|Flick(?! Arrow Animation)|Trace|Node|Connection|Line)|Note |Trace |Diamond |Tap Decoration|Slide Decoration|Flick( Left| Right)? Decoration|Flick Arrow |Slide Connection |Active Slide Connection |Simultaneous Line)/.test(name)
    || name.startsWith("#NOTE_") && name !== "#NOTE_SLOT"
    || name.startsWith("#DIRECTIONAL_MARKER_");
}

export const laneClipSpriteName = (name: string, node: number) => `${name} Lane Clip ${node}`;

/** Heap node n owns one dyadic UV interval; children are 2n and 2n+1. */
export function laneClipInterval(node: number) {
  const level = Math.floor(Math.log2(node));
  const span = 1 / 2 ** level;
  return { start: (node - 2 ** level) * span, span };
}

export interface LaneClipSpriteReference { name: string; id: number }

/** Data-only UV references are added after compilation, without script objects. */
export function appendLaneClipSprites(sprites: readonly LaneClipSpriteReference[]): LaneClipSpriteReference[] {
  const original = sprites.filter(sprite => !/ Lane Clip \d+$/.test(sprite.name));
  const result = [...original];
  for (const sprite of original) {
    if (!isLaneClippedSprite(sprite.name)) continue;
    for (let node = 2; node < LANE_CLIP_CELLS * 2; node++) result.push({
      name: laneClipSpriteName(sprite.name, node),
      id: original.length + sprite.id * (LANE_CLIP_STRIDE - 1) + node - 2,
    });
  }
  return result;
}

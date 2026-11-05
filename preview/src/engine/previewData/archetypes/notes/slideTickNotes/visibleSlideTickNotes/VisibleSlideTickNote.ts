import {
  getNativeNoteCapId,
  getNativeNoteMainIds,
} from "../../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js";
import {
  getNativeNoteRects,
  getNativePreviewNoteRect,
} from "../../../../../../../../shared/src/engine/data/nativeNoteGeometry.js";
import { panel } from "../../../../panel.js";
import { scaledScreen } from "../../../../scaledScreen.js";
import { drawClipped, getZ, layer, skin } from "../../../../skin.js";
import { SlideTickNote } from "../SlideTickNote.js";

export abstract class VisibleSlideTickNote extends SlideTickNote {
  abstract sprites: {
    tick: SkinSprite;
    fallback: SkinSprite;
  };

  render() {
    const time = bpmChanges.at(this.import.beat).time;
    const pos = panel.getPos(time);

    const z = getZ(layer.note.tick, time, this.import.lane);

    if (this.useFallbackSprite) return;
    const rects = getNativeNoteRects(
      this.import.lane,
      this.import.size,
      7,
      skin.sprites.nativeArrowAnimationSkin002.exists,
      skin.sprites.nativeArrowAnimationSkin003.exists,
      true,
    );
    const main = getNativeNoteMainIds(skin.sprites.nativeTapLeft0.id, 7);
    this.drawBody(getNativeNoteCapId(skin.sprites.nativeTapLeft0.id, 7, 0, false), rects.left, pos, z);
    this.drawBody(main.left, rects.mainLeft, pos, z);
    this.drawBody(main.middle, rects.middle, pos, z);
    this.drawBody(main.right, rects.mainRight, pos, z);
    this.drawBody(getNativeNoteCapId(skin.sprites.nativeTapLeft0.id, 7, 0, true), rects.right, pos, z);
    drawClipped(this.sprites.tick.id, new Rect(getNativePreviewNoteRect(rects.mark, scaledScreen.wToH)).add(pos).toQuad(), [z], 1, pos.x);
  }

  drawBody(id: SkinSpriteId, rect: RectLike, pos: Vec, z: number) {
    if (skin.sprites.exists(id))
      drawClipped(id, new Rect(getNativePreviewNoteRect(rect, scaledScreen.wToH)).add(pos).toQuad(), [z - 1], 1, pos.x);
  }

  get useFallbackSprite() {
    return !this.sprites.tick.exists;
  }
}

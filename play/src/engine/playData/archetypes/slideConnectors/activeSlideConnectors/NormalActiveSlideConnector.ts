import { particle } from "../../../particle.js";
import { skin } from "../../../skin.js";
import { archetypes } from "../../index.js";
import { ActiveSlideConnector } from "./ActiveSlideConnector.js";

export class NormalActiveSlideConnector extends ActiveSlideConnector {
  sprites = {
    missed: skin.sprites.normalSlideConnectorNormal,
    normal: skin.sprites.normalActiveSlideConnectorNormal,
    pressed: skin.sprites.normalActiveSlideConnectorActive,
  };

  effects = {
    circular: particle.effects.normalSlideConnectorCircular,
    linear: particle.effects.normalSlideConnectorLinear,
  };

  get slideStartNote() {
    return archetypes.NormalSlideStartNote;
  }
}

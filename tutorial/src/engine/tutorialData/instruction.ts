import { InstructionIconName, Text } from "@sonolus/core";
import { hand } from "./hand.js";
import { scaledScreen } from "./scaledScreen.js";

export const instruction = defineInstruction({
  texts: {
    tap: Text.Tap,
    hold: Text.Hold,
    slide: Text.HoldSlide,
    flick: Text.Flick,
  },
  icons: { hand: InstructionIconName.Hand },
});

export const drawContact = (lane: number, alpha: number) => {
  const angle = Math.PI / 3;
  instruction.icons.hand.paint(
    new Vec(0, 1)
      .rotate(angle)
      .mul(0.25 * ui.configuration.instruction.scale)
      .add(hand.position)
      .translate(lane * scaledScreen.laneUnitWidth, 0),
    0.25 * ui.configuration.instruction.scale,
    (180 * angle) / Math.PI,
    0,
    alpha * ui.configuration.instruction.alpha,
  );
};

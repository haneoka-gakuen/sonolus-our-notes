import { connector } from "../../components/connector.js";
import { flickArrow } from "../../components/flickArrow.js";
import { noteDisplay } from "../../components/noteDisplay.js";
import { slide } from "../../components/slide.js";
import { startHeldSound, stopHeldSound } from "../../sound.js";
import { drawHand } from "../../instruction.js";
import { destroyHoldEffect, spawnHoldEffect } from "../../particle.js";

const effectInstanceIds = tutorialMemory({
  p0: ParticleEffectInstanceId,
  p1: ParticleEffectInstanceId,
  p2: ParticleEffectInstanceId,
  p3: ParticleEffectInstanceId,
  p4: ParticleEffectInstanceId,
  p5: ParticleEffectInstanceId,
  p6: ParticleEffectInstanceId,
});

export const slideEndFlickNoteFall = {
  enter() {
    flickArrow.showFall();
    noteDisplay.showFall("flickEnd");
    slide.show();
    connector.showFallOut();

    startHeldSound();
    {
      const ids = spawnHoldEffect();
      effectInstanceIds.p0 = ids.p0;
      effectInstanceIds.p1 = ids.p1;
      effectInstanceIds.p2 = ids.p2;
      effectInstanceIds.p3 = ids.p3;
      effectInstanceIds.p4 = ids.p4;
      effectInstanceIds.p5 = ids.p5;
      effectInstanceIds.p6 = ids.p6;
    }
  },

  update() {
    drawHand(Math.PI / 3, 0, 1);
  },

  exit() {
    flickArrow.clear();
    noteDisplay.clear();
    slide.clear();
    connector.clear();

    stopHeldSound();
    destroyHoldEffect(effectInstanceIds);
  },
};

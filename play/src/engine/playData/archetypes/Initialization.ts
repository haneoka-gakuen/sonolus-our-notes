import { options } from "../../configuration/options.js";
import {
  getNativeLaneUnitWidth,
  getNativeJudgmentY,
  getNativeVanishingPointY,
  nativeStage,
} from "../../../../../shared/src/engine/data/lane.js";
import { particle } from "../particle.js";
import { scaledScreen } from "../scaledScreen.js";
import { skin } from "../skin.js";
import { archetypes } from "./index.js";
import { inputClock, sourceTimingProfile, sourceTimingProfileDataName } from "../inputClock.js";
import { soloModeImports, sourceFloat, sourceMultiply } from "../../../../../shared/src/engine/data/soloMode.js";
import { assistMemory } from "../assist.js";
import { soloModeConfig, soloResultMemory } from "../soloMode.js";

export class Initialization extends Archetype {
  import = this.defineImport({
    timingProfile: { name: sourceTimingProfileDataName, type: Number },
    ...soloModeImports,
  });
  sharedMemory = this.defineSharedMemory({ assist: assistMemory, solo: soloResultMemory });

  preprocessOrder = -1;

  preprocess() {
    inputClock.profile = this.import.timingProfile === sourceTimingProfile ? sourceTimingProfile : 0;
    soloModeConfig.bandPower = this.import.power > 0 ? this.import.power : options.soloBandPower;
    const difficulty = sourceFloat(1 + sourceMultiply(this.import.difficulty - 5, 0.005));
    soloModeConfig.multiplier = sourceMultiply(sourceMultiply(3, soloModeConfig.bandPower), difficulty);
    soloModeConfig.weightedNoteTenths = Math.max(0, this.import.weightedNotes) * 10;
    soloModeConfig.noteCount = 0;
    soloModeConfig.ranges.get(0).mission = this.import.mission1;
    soloModeConfig.ranges.get(0).start = this.import.start1;
    soloModeConfig.ranges.get(0).end = this.import.end1;
    soloModeConfig.ranges.get(1).mission = this.import.mission2;
    soloModeConfig.ranges.get(1).start = this.import.start2;
    soloModeConfig.ranges.get(1).end = this.import.end2;
    soloModeConfig.ranges.get(2).mission = this.import.mission3;
    soloModeConfig.ranges.get(2).start = this.import.start3;
    soloModeConfig.ranges.get(2).end = this.import.end3;
    this.sharedMemory.solo.life = 1000;
    this.sharedMemory.assist.resultFrame = -9999;
    const targetAspectRatio = nativeStage.targetAspectRatio;

    const stage = {
      w: options.lockStageAspectRatio
        ? screen.aspectRatio >= targetAspectRatio
          ? targetAspectRatio * screen.h
          : screen.w
        : screen.w,
      h: options.lockStageAspectRatio
        ? screen.aspectRatio >= targetAspectRatio
          ? screen.h
          : screen.w / targetAspectRatio
        : screen.h,
    };

    const t = getNativeVanishingPointY(stage.h);
    const b = getNativeJudgmentY(stage.h);
    const w = getNativeLaneUnitWidth(stage.w);

    scaledScreen.l = screen.l / w;
    scaledScreen.r = screen.r / w;
    scaledScreen.b = screen.b / (b - t);
    scaledScreen.t = screen.t / (b - t);

    scaledScreen.wToH = w / (t - b);

    const transform = Mat.identity.scale(w, b - t).translate(0, t);
    skin.transform.set(transform);
    particle.transform.set(transform);

    score.base.set({
      perfect: 1,
      great: 0.8,
      good: 0.5,
    });
    score.consecutive.great.set({
      multiplier: 0.01,
      step: 100,
      cap: 1000,
    });

    const gap = 0.05;
    const uiRect = screen.rect.shrink(gap, gap);

    ui.menu.set({
      anchor: uiRect.rt,
      pivot: { x: 1, y: 1 },
      size: new Vec(0.15, 0.15).mul(ui.configuration.menu.scale),
      rotation: 0,
      alpha: ui.configuration.menu.alpha,
      horizontalAlign: HorizontalAlign.Center,
      background: true,
    });

    ui.metric.primary.bar.set({
      anchor: uiRect.lt,
      pivot: { x: 0, y: 1 },
      size: new Vec(0.75, 0.15).mul(ui.configuration.metric.primary.scale),
      rotation: 0,
      alpha: ui.configuration.metric.primary.alpha,
      horizontalAlign: HorizontalAlign.Left,
      background: true,
    });
    ui.metric.primary.value.set({
      anchor: uiRect.lt.add(new Vec(0.715, -0.035).mul(ui.configuration.metric.primary.scale)),
      pivot: { x: 1, y: 1 },
      size: new Vec(0, 0.08).mul(ui.configuration.metric.primary.scale),
      rotation: 0,
      alpha: ui.configuration.metric.primary.alpha,
      horizontalAlign: HorizontalAlign.Right,
      background: false,
    });

    ui.metric.secondary.bar.set({
      anchor: uiRect.rt.sub(new Vec(gap, 0)).sub(new Vec(0.15, 0).mul(ui.configuration.menu.scale)),
      pivot: { x: 1, y: 1 },
      size: new Vec(0.55, 0.15).mul(ui.configuration.metric.secondary.scale),
      rotation: 0,
      alpha: ui.configuration.metric.secondary.alpha,
      horizontalAlign: HorizontalAlign.Left,
      background: true,
    });
    ui.metric.secondary.value.set({
      anchor: uiRect.rt
        .sub(new Vec(gap, 0))
        .sub(new Vec(0.15, 0).mul(ui.configuration.menu.scale))
        .sub(new Vec(0.035, 0.035).mul(ui.configuration.metric.secondary.scale)),
      pivot: { x: 1, y: 1 },
      size: new Vec(0, 0.08).mul(ui.configuration.metric.secondary.scale),
      rotation: 0,
      alpha: ui.configuration.metric.secondary.alpha,
      horizontalAlign: HorizontalAlign.Right,
      background: false,
    });

    ui.combo.value.set({
      anchor: { x: stage.w * 0.355, y: stage.h * 0.0875 },
      pivot: { x: 0.5, y: 0.5 },
      size: new Vec(0, stage.h * 0.14).mul(ui.configuration.combo.scale),
      rotation: 0,
      alpha: ui.configuration.combo.alpha,
      horizontalAlign: HorizontalAlign.Center,
      background: false,
    });
    ui.combo.text.set({
      anchor: { x: stage.w * 0.355, y: stage.h * 0.0875 },
      pivot: { x: 0.5, y: -2.25 },
      size: new Vec(0, stage.h * 0.14 * 0.25).mul(ui.configuration.combo.scale),
      rotation: 0,
      alpha: ui.configuration.combo.alpha,
      horizontalAlign: HorizontalAlign.Center,
      background: false,
    });

    ui.judgment.set({
      anchor: { x: 0, y: stage.h * -0.115 },
      pivot: { x: 0.5, y: 0.5 },
      size: new Vec(0, stage.h * 0.0475).mul(ui.configuration.judgment.scale),
      rotation: 0,
      alpha: ui.configuration.judgment.alpha,
      horizontalAlign: HorizontalAlign.Center,
      background: false,
    });
  }

  spawnOrder() {
    return 0;
  }

  updateSequential() {
    archetypes.InputManager.spawn({});

    this.despawn = true;
  }
}

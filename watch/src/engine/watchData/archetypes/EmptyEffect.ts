import { NativeLaneEffectType } from "../../../../../shared/src/engine/data/nativeLaneFeedback.js";
import { restartNativeLaneEffect } from "../particle.js";

export class EmptyEffect extends SpawnableArchetype({
  l: Number,
}) {
  nextTime = this.entityMemory(Number);

  spawnTime() {
    return -999999;
  }

  despawnTime() {
    return 999999;
  }

  updateSequential() {
    let shouldUpdate = false;
    let shouldSpawn = false;
    if (time.skip) {
      shouldUpdate = true;
    } else if (time.now >= this.nextTime) {
      shouldUpdate = true;
      shouldSpawn = true;
    }

    if (shouldUpdate) {
      this.nextTime = streams.getNextKey(this.spawnData.l, time.now);
      if (this.nextTime === time.now) this.nextTime = 999999;
    }

    if (shouldSpawn) {
      const first = (this.spawnData.l + 6) * 2;
      restartNativeLaneEffect(NativeLaneEffectType.InVain, first);
      restartNativeLaneEffect(NativeLaneEffectType.InVain, first + 1);
    }
  }
}

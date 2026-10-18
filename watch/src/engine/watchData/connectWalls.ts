import {
  admitConnectWall,
  clearConnectWallAggregate,
  updateConnectWallAggregate,
} from "../../../../shared/src/engine/data/connectWallAggregate.js";
import { options } from "../configuration/options.js";
import { archetypes } from "./archetypes/index.js";
import { hasAggregateConnectWalls, nativeEffectPlaneLayout, particle, connectWallDrawProfile } from "./particle.js";
import { scaledScreen } from "./scaledScreen.js";

const queue = levelMemory({ head: Number, tail: Number, cursor: Number });

/** Watch knows replay hit times in preprocess; terminate remains free of shared-state mutation. */
export const scheduleConnectWall = (
  index: number,
  at: number,
  lane: number,
  size: number,
  fallback: number,
  duration: number,
) => {
  const events = archetypes.NormalTapNote.sharedMemory;
  const event = events.get(index);
  event.wallTime = at;
  event.wallLane = lane;
  event.wallSize = size;
  event.wallFallback = fallback;
  event.wallDuration = duration;
  event.wallNext = 0;
  const entry = index + 1;
  if (!queue.head) {
    queue.head = entry;
    queue.tail = entry;
  } else if (at >= events.get(queue.tail - 1).wallTime) {
    events.get(queue.tail - 1).wallNext = entry;
    queue.tail = entry;
  } else if (at < events.get(queue.head - 1).wallTime) {
    event.wallNext = queue.head;
    queue.head = entry;
  } else {
    let previous = queue.head;
    while (events.get(previous - 1).wallNext) {
      const next = events.get(previous - 1).wallNext;
      if (events.get(next - 1).wallTime > at) break;
      previous = next;
    }
    event.wallNext = events.get(previous - 1).wallNext;
    events.get(previous - 1).wallNext = entry;
  }
  queue.cursor = queue.head;
};

export const updateConnectWalls = () => {
  if (!hasAggregateConnectWalls()) return;
  if (time.skip) {
    clearConnectWallAggregate(connectWallDrawProfile.value);
    queue.cursor = queue.head;
  }
  const events = archetypes.NormalTapNote.sharedMemory;
  while (queue.cursor) {
    const event = events.get(queue.cursor - 1);
    if (event.wallTime > time.now) break;
    const admitted = admitConnectWall(
      time.now,
      event.wallTime,
      event.wallLane,
      event.wallSize,
      particle.effects.simpleProfile.exists,
      particle.effects.sourceConnectWall0.id as unknown as number,
      options.noteEffectSize,
      scaledScreen.wToH,
      false,
      connectWallDrawProfile.value,
      connectWallDrawProfile.frameEnabled,
    );
    if (!admitted) {
      particle.effects.spawn(
        event.wallFallback as unknown as ParticleEffectId,
        nativeEffectPlaneLayout({ plane: 1, lane: event.wallLane, size: event.wallSize }),
        event.wallDuration,
        false,
      );
      if (connectWallDrawProfile.frameEnabled)
        particle.effects.spawn(
          (event.wallFallback + 2) as unknown as ParticleEffectId,
          nativeEffectPlaneLayout({ plane: 3, lane: event.wallLane, size: event.wallSize }),
          event.wallDuration,
          false,
        );
    }
    queue.cursor = event.wallNext;
  }
  updateConnectWallAggregate(
    time.now,
    false,
    particle.effects.sourceConnectWall0.id as unknown as number,
    options.noteEffectSize,
    scaledScreen.wToH,
    connectWallDrawProfile.value,
    connectWallDrawProfile.frameEnabled,
    particle.effects.simpleProfile.exists,
  );
};

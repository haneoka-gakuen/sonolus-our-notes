import { clearNativeLaneEffectInstances } from "../../../../shared/src/engine/data/nativeLaneFeedback.js";
import { archetypes } from "./archetypes/index.js";
import { restartNativeLaneEffect } from "./particle.js";

const queue = levelMemory({ head: Number, tail: Number, cursor: Number });

export const scheduleNativeLaneFeedback = (index: number, type: number, first: number, last: number, at: number) => {
  const events = archetypes.NormalTapNote.sharedMemory;
  const event = events.get(index);
  event.laneEffectType = type;
  event.laneFirst = first;
  event.laneLast = last;
  event.laneTime = at;
  event.laneNext = 0;
  const entry = index + 1;
  if (!queue.head) {
    queue.head = entry;
    queue.tail = entry;
  } else if (at >= events.get(queue.tail - 1).laneTime) {
    events.get(queue.tail - 1).laneNext = entry;
    queue.tail = entry;
  } else if (at < events.get(queue.head - 1).laneTime) {
    event.laneNext = queue.head;
    queue.head = entry;
  } else {
    let previous = queue.head;
    while (events.get(previous - 1).laneNext) {
      const next = events.get(previous - 1).laneNext;
      if (events.get(next - 1).laneTime > at) break;
      previous = next;
    }
    event.laneNext = events.get(previous - 1).laneNext;
    events.get(previous - 1).laneNext = entry;
  }
  queue.cursor = queue.head;
};

/** Watch's global cache is writable in the sequential phase. */
export const updateNativeLaneFeedback = () => {
  if (time.skip) {
    clearNativeLaneEffectInstances();
    queue.cursor = queue.head;
  }
  const events = archetypes.NormalTapNote.sharedMemory;
  while (queue.cursor) {
    const event = events.get(queue.cursor - 1);
    if (event.laneTime > time.now) break;
    if (!time.skip)
      for (let lane = event.laneFirst; lane <= event.laneLast; lane++)
        restartNativeLaneEffect(event.laneEffectType, lane);
    queue.cursor = event.laneNext;
  }
};

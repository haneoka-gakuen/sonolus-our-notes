import { consumeFlickTouch, isFlickLatchReady, scanFlickLatch } from "../../../../../flick.js";
import { claimStart, disallowEmpty, getClaimedStart } from "../../../../InputManager.js";
import { FlickNote } from "../FlickNote.js";

// FTLiveSimulator judges flick notes from the current-frame flick input of
// any pressed finger (GetUseSimulateInputUnitPair pairs flicks by BeginLane,
// with no fresh-touch requirement), so a finger already holding a slide can
// swipe the flick without releasing first.
export abstract class SingleFlickNote extends FlickNote {
  hasReservedTap = this.entityMemory(Boolean);

  initialize() {
    super.initialize();
    this.hasReservedTap = false;
  }

  touch() {
    if (this.despawn) return;
    if (!this.canReceiveInput) return;

    if (!this.hasReservedTap) {
      const index = getClaimedStart(this.info.index);
      if (index !== -1) {
        this.hasReservedTap = true;
        disallowEmpty(touches.get(index));
      }
    }

    const latched = scanFlickLatch(
      this.fullHitbox.l,
      this.fullHitbox.r,
      this.flickImport.direction,
      this.import.originalTimeMs,
      this.windows.input,
    );
    if (latched.time !== -9999) {
      this.flickLatchedTime = latched.time;
      this.flickLatchedTouchId = latched.touchId;
    }
    if (
      isFlickLatchReady(
        this.flickLatchedTime,
        this.targetTime,
        this.flickLatchedTouchId,
        this.import.originalTimeMs,
        this.windows.input,
      )
    ) {
      consumeFlickTouch(this.flickLatchedTouchId);
      this.completeAt(this.flickLatchedTime);
    }
  }

  updateSequential() {
    if (this.despawn) return;

    if (!this.hasReservedTap && this.flickLatchedTime === -9999 && this.isWithinInputWindow) {
      claimStart(
        this.info.index,
        this.targetTime,
        new Rect(this.hitbox),
        new Rect(this.fullHitbox),
        this.import.originalTimeMs,
        this.windows.input,
      );
    }
    if (touches.count) return;

    // touch() only fires on touch events; complete a latched swipe once
    // the note time arrives on an otherwise quiet frame.
    if (
      isFlickLatchReady(
        this.flickLatchedTime,
        this.targetTime,
        this.flickLatchedTouchId,
        this.import.originalTimeMs,
        this.windows.input,
      )
    ) {
      this.completeAt(this.flickLatchedTime);
    }
  }
}

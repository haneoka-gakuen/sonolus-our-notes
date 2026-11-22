import { consumeFlickTouch, isFlickLatchReady, scanFlickLatch } from "../../../../../flick.js";
import { claimStart, disallowEmpty, getClaimedStart } from "../../../../InputManager.js";
import { FlickNote } from "../FlickNote.js";
import { options } from "../../../../../../configuration/options.js";

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

    let hitTime = -9999;
    if (!this.hasReservedTap) {
      const index = getClaimedStart(this.info.index);
      if (index !== -1) {
        const touch = touches.get(index);
        this.hasReservedTap = true;
        disallowEmpty(touch);
        if (options.assistMode) hitTime = touch.startTime;
      }
    }

    if (hitTime === -9999) {
      const hitbox = this.activeFullHitbox;
      const latched = scanFlickLatch(
        hitbox.l,
        hitbox.r,
        this.flickImport.direction,
        this.import.originalTimeMs,
        this.activeInputWindow,
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
          this.activeInputWindow,
        )
      ) {
        consumeFlickTouch(this.flickLatchedTouchId);
        hitTime = this.flickLatchedTime;
      }
    }
    if (hitTime !== -9999) this.completeAt(hitTime, false);
  }

  updateSequential() {
    super.updateSequential();
    if (this.despawn) return;

    if (!this.hasReservedTap && this.flickLatchedTime === -9999 && this.isWithinInputWindow) {
      claimStart(
        this.info.index,
        this.targetTime,
        new Rect(this.hitbox),
        this.activeFullHitbox,
        this.import.originalTimeMs,
        this.activeInputWindow,
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
        this.activeInputWindow,
      )
    ) {
      this.completeAt(this.flickLatchedTime, false);
    }
  }
}

import { ease } from "../../../../../../../../../shared/src/engine/data/EaseType.js";
import { consumeFlickTouch, isFlickLatchReady, scanFlickLatch } from "../../../../../flick.js";
import { getHitbox, getNativeJudgmentLeniency } from "../../../../../lane.js";
import { archetypes } from "../../../../index.js";
import { FlickNote } from "../FlickNote.js";
import { assistLevel } from "../../../../../assist.js";
import { assistAreaExtra } from "../../../../../../../../../shared/src/engine/data/assist.js";

export abstract class SlideEndFlickNote extends FlickNote {
  slideEndFlickImport = this.defineImport({
    slideRef: { name: "slide", type: Number },
  });

  head = this.entityMemory({
    scaledTime: Number,

    l: Number,
    r: Number,
  });
  tail = this.entityMemory({
    scaledTime: Number,

    l: Number,
    r: Number,
  });

  initialize() {
    super.initialize();

    const headTime = bpmChanges.at(this.headImport.beat).time;
    this.head.scaledTime = timeScaleChanges.at(headTime).scaledTime;
    this.head.l = this.headImport.lane - this.headImport.size;
    this.head.r = this.headImport.lane + this.headImport.size;

    const tailTime = bpmChanges.at(this.tailImport.beat).time;
    this.tail.scaledTime = timeScaleChanges.at(tailTime).scaledTime;
    this.tail.l = this.tailImport.lane - this.tailImport.size;
    this.tail.r = this.tailImport.lane + this.tailImport.size;
  }

  touch() {
    if (this.despawn) return;
    if (!this.canReceiveInput) return;

    if (this.startInfo.state === EntityState.Active) return;

    const assisted = this.assistedContact();
    let hitTime = assisted.hitTime;
    if (hitTime === -9999) {
      if (!this.hasInputTargetArrived) {
        this.earlyLatch();
      } else {
        this.lateLatch();
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
    if (hitTime !== -9999) this.completeAt(hitTime, assisted.atTarget);
  }

  updateSequential() {
    super.updateSequential();
    if (this.despawn || touches.count) return;

    // touch() only fires on touch events; complete a latched swipe once
    // the note time arrives on an otherwise quiet frame. The slide-end
    // flick accepts its swipe from note time onward (or on release).
    if (
      isFlickLatchReady(
        this.flickLatchedTime,
        this.targetTime,
        this.flickLatchedTouchId,
        this.import.originalTimeMs,
        this.activeInputWindow,
      ) &&
      this.startInfo.state !== EntityState.Active
    ) {
      this.completeAt(this.flickLatchedTime, false);
    }
  }

  get slideImport() {
    return archetypes.NormalSlideConnector.import.get(this.slideEndFlickImport.slideRef);
  }

  get startInfo() {
    return entityInfos.get(this.slideImport.startRef);
  }

  get startSharedMemory() {
    return archetypes.NormalSlideStartNote.sharedMemory.get(this.slideImport.startRef);
  }

  get headImport() {
    return archetypes.NormalSlideStartNote.import.get(this.slideImport.headRef);
  }

  get tailImport() {
    return archetypes.NormalSlideStartNote.import.get(this.slideImport.tailRef);
  }

  earlyLatch() {
    // The swipe is latched against the connector's interpolated position
    // while the slide is still travelling, so a held finger following the
    // line can swipe the ending flick without lifting off.
    const s = ease(
      this.slideImport.ease,
      Math.unlerpClamped(
        this.head.scaledTime,
        this.tail.scaledTime,
        timeScaleChanges.at(time.now - input.offset).scaledTime,
      ),
    );

    const hitbox = getHitbox({
      l: Math.lerp(this.head.l, this.tail.l, s),
      r: Math.lerp(this.head.r, this.tail.r, s),
      leniency: getNativeJudgmentLeniency({
        operateType: this.import.operateType,
        originalCritical: this.import.originalCritical,
        originalSize: this.import.originalSize,
      }) + assistAreaExtra(this.import.operateType, assistLevel()),
    });

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
  }

  lateLatch() {
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
  }
}

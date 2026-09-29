import { consumeFlickTouch, isFlickLatchReady, scanFlickLatch } from '../../../../../flick.js'
import { FlickNote } from '../FlickNote.js'

// FTLiveSimulator judges flick notes from the current-frame flick input of
// any pressed finger (GetUseSimulateInputUnitPair pairs flicks by BeginLane,
// with no fresh-touch requirement), so a finger already holding a slide can
// swipe the flick without releasing first.
export abstract class SingleFlickNote extends FlickNote {
    touch() {
        if (time.now < this.inputTime.min) return

        const latched = scanFlickLatch( this.fullHitbox.l, this.fullHitbox.r)
        if (latched !== -9999) this.flickLatchedTime = latched
        if (isFlickLatchReady(this.flickLatchedTime, this.targetTime)) {
            consumeFlickTouch(this.flickLatchedTime)
            this.completeAt(this.flickLatchedTime)
        }
    }

    updateParallel() {
        // touch() only fires on touch events; complete a latched swipe once
        // the note time arrives on an otherwise quiet frame.
        if (isFlickLatchReady(this.flickLatchedTime, this.targetTime)) {
            this.completeAt(this.flickLatchedTime)
        }

        super.updateParallel()
    }
}

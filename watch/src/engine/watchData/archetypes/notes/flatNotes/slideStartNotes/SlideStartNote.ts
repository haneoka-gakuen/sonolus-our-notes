import { FlatNote } from "../FlatNote.js";

export abstract class SlideStartNote extends FlatNote {
  render() {
    if (time.now >= this.targetTime) return;

    super.render();
  }
}

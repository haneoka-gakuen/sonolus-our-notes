import { FlatNote } from "../FlatNote.js";

export abstract class SlideStartNote extends FlatNote {
  render() {
    if (this.scrollNow >= this.scrollTarget) return;

    super.render();
  }
}

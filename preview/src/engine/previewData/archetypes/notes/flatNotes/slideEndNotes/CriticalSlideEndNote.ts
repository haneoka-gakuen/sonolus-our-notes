import { skin } from '../../../../skin.js'
import { SlideEndNote } from './SlideEndNote.js'

export class CriticalSlideEndNote extends SlideEndNote {
    sprites = {
        left: skin.sprites.slideEndNoteLeft,
        middle: skin.sprites.slideEndNoteMiddle,
        right: skin.sprites.slideEndNoteRight,
        fallback: skin.sprites.slideNoteEndFallback,
    }
}

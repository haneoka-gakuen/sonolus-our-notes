import { SlideConnector } from '../SlideConnector.js'

export abstract class ActiveSlideConnector extends SlideConnector {
    override nativeLine = true
    getAlpha() {
        return 1
    }
}

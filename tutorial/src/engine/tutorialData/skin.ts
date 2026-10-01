import { nativeSlideSprites } from '../../../../shared/src/engine/data/nativeSlideSkin.js'
import { nativeNoteCapSprites } from '../../../../shared/src/engine/data/nativeNoteSprites.generated.js'
export const skin = defineSkin({
    sprites: {
        ...nativeNoteCapSprites,
        ...nativeSlideSprites,
        sekaiStage: 'Our Notes Stage',
        nativeJudgmentLine: 'Our Notes Judgment Line',

        normalNoteLeft: 'Our Notes Note Cyan Left',
        normalNoteMiddle: 'Our Notes Note Cyan Middle',
        normalNoteRight: 'Our Notes Note Cyan Right',

        slideNoteLeft: 'Our Notes Note Green Left',
        slideNoteMiddle: 'Our Notes Note Green Middle',
        slideNoteRight: 'Our Notes Note Green Right',
        slideEndNoteLeft: 'Our Notes Note Green End Left',
        slideEndNoteMiddle: 'Our Notes Note Green End Middle',
        slideEndNoteRight: 'Our Notes Note Green End Right',

        flickNoteLeft: 'Our Notes Note Red Left',
        flickNoteMiddle: 'Our Notes Note Red Middle',
        flickNoteRight: 'Our Notes Note Red Right',

        tapDecoration: 'Our Notes Tap Decoration',
        slideDecoration: 'Our Notes Slide Decoration',
        flickDecoration: 'Our Notes Flick Decoration',
        flickLeftDecoration: 'Our Notes Flick Left Decoration',
        flickRightDecoration: 'Our Notes Flick Right Decoration',

        traceFlickNoteLeft: 'Our Notes Trace Note Red Left',
        traceFlickNoteMiddle: 'Our Notes Trace Note Red Middle',
        traceFlickNoteRight: 'Our Notes Trace Note Red Right',
        traceFlickNoteDiamond: 'Our Notes Trace Diamond Red',

        normalTraceNoteLeft: 'Our Notes Trace Note Green Left',
        normalTraceNoteMiddle: 'Our Notes Trace Note Green Middle',
        normalTraceNoteRight: 'Our Notes Trace Note Green Right',
        normalTraceNoteDiamond: 'Our Notes Trace Diamond Green',

        normalActiveSlideConnectorNormal: 'Our Notes Active Slide Connection Green',
        normalActiveSlideConnectorActive: 'Our Notes Active Slide Connection Green Active',

        flickArrowUp1: 'Our Notes Flick Arrow Red Up 1',
        flickArrowUp2: 'Our Notes Flick Arrow Red Up 2',
        flickArrowUp3: 'Our Notes Flick Arrow Red Up 3',
        flickArrowUp4: 'Our Notes Flick Arrow Red Up 4',
        flickArrowUp5: 'Our Notes Flick Arrow Red Up 5',
        flickArrowUp6: 'Our Notes Flick Arrow Red Up 6',
        flickArrowUp7: 'Our Notes Flick Arrow Red Up 7',
        flickArrowUp8: 'Our Notes Flick Arrow Red Up 8',
        nativeArrowAnimationSkin001: 'Our Notes Native Flick Arrow Animation Skin 001',
        nativeArrowAnimationSkin002: 'Our Notes Native Flick Arrow Animation Skin 002',
        nativeArrowAnimationSkin003: 'Our Notes Native Flick Arrow Animation Skin 003',
    },
})

export const layer = {
    note: {
        arrow: 102,
        tick: 101,
        body: 100,
        slide: 99,
        connector: 98,
    },

    judgmentLine: 1,
    stage: 0,
}

// Generated skin cells retain the authored gradient position when a long
// ribbon is clipped by the judgment line, horizon, or preview panel.
export const NATIVE_SLIDE_GRADIENT_CELLS = 16

export const nativeSlideSprites = {
    lineNormal0: 'Our Notes Native Line Normal 0',
    lineNormal1: 'Our Notes Native Line Normal 1',
    lineNormal2: 'Our Notes Native Line Normal 2',
    lineNormal3: 'Our Notes Native Line Normal 3',
    lineNormal4: 'Our Notes Native Line Normal 4',
    lineNormal5: 'Our Notes Native Line Normal 5',
    lineNormal6: 'Our Notes Native Line Normal 6',
    lineNormal7: 'Our Notes Native Line Normal 7',
    lineNormal8: 'Our Notes Native Line Normal 8',
    lineNormal9: 'Our Notes Native Line Normal 9',
    lineNormal10: 'Our Notes Native Line Normal 10',
    lineNormal11: 'Our Notes Native Line Normal 11',
    lineNormal12: 'Our Notes Native Line Normal 12',
    lineNormal13: 'Our Notes Native Line Normal 13',
    lineNormal14: 'Our Notes Native Line Normal 14',
    lineNormal15: 'Our Notes Native Line Normal 15',
    linePressed0: 'Our Notes Native Line Pressed 0',
    linePressed1: 'Our Notes Native Line Pressed 1',
    linePressed2: 'Our Notes Native Line Pressed 2',
    linePressed3: 'Our Notes Native Line Pressed 3',
    linePressed4: 'Our Notes Native Line Pressed 4',
    linePressed5: 'Our Notes Native Line Pressed 5',
    linePressed6: 'Our Notes Native Line Pressed 6',
    linePressed7: 'Our Notes Native Line Pressed 7',
    linePressed8: 'Our Notes Native Line Pressed 8',
    linePressed9: 'Our Notes Native Line Pressed 9',
    linePressed10: 'Our Notes Native Line Pressed 10',
    linePressed11: 'Our Notes Native Line Pressed 11',
    linePressed12: 'Our Notes Native Line Pressed 12',
    linePressed13: 'Our Notes Native Line Pressed 13',
    linePressed14: 'Our Notes Native Line Pressed 14',
    linePressed15: 'Our Notes Native Line Pressed 15',
    lineMissed0: 'Our Notes Native Line Missed 0',
    lineMissed1: 'Our Notes Native Line Missed 1',
    lineMissed2: 'Our Notes Native Line Missed 2',
    lineMissed3: 'Our Notes Native Line Missed 3',
    lineMissed4: 'Our Notes Native Line Missed 4',
    lineMissed5: 'Our Notes Native Line Missed 5',
    lineMissed6: 'Our Notes Native Line Missed 6',
    lineMissed7: 'Our Notes Native Line Missed 7',
    lineMissed8: 'Our Notes Native Line Missed 8',
    lineMissed9: 'Our Notes Native Line Missed 9',
    lineMissed10: 'Our Notes Native Line Missed 10',
    lineMissed11: 'Our Notes Native Line Missed 11',
    lineMissed12: 'Our Notes Native Line Missed 12',
    lineMissed13: 'Our Notes Native Line Missed 13',
    lineMissed14: 'Our Notes Native Line Missed 14',
    lineMissed15: 'Our Notes Native Line Missed 15',
} as const

export const getNativeSlideSpriteId = (sprites: { [Key in keyof typeof nativeSlideSprites]: { id: SkinSpriteId } }, progress: number, state: number): SkinSpriteId => {
    const cell = Math.clamp(Math.floor(progress * 16), 0, 15)
    if (cell === 0) return state === 2 ? sprites.linePressed0.id : state === 1 ? sprites.lineMissed0.id : sprites.lineNormal0.id
    if (cell === 1) return state === 2 ? sprites.linePressed1.id : state === 1 ? sprites.lineMissed1.id : sprites.lineNormal1.id
    if (cell === 2) return state === 2 ? sprites.linePressed2.id : state === 1 ? sprites.lineMissed2.id : sprites.lineNormal2.id
    if (cell === 3) return state === 2 ? sprites.linePressed3.id : state === 1 ? sprites.lineMissed3.id : sprites.lineNormal3.id
    if (cell === 4) return state === 2 ? sprites.linePressed4.id : state === 1 ? sprites.lineMissed4.id : sprites.lineNormal4.id
    if (cell === 5) return state === 2 ? sprites.linePressed5.id : state === 1 ? sprites.lineMissed5.id : sprites.lineNormal5.id
    if (cell === 6) return state === 2 ? sprites.linePressed6.id : state === 1 ? sprites.lineMissed6.id : sprites.lineNormal6.id
    if (cell === 7) return state === 2 ? sprites.linePressed7.id : state === 1 ? sprites.lineMissed7.id : sprites.lineNormal7.id
    if (cell === 8) return state === 2 ? sprites.linePressed8.id : state === 1 ? sprites.lineMissed8.id : sprites.lineNormal8.id
    if (cell === 9) return state === 2 ? sprites.linePressed9.id : state === 1 ? sprites.lineMissed9.id : sprites.lineNormal9.id
    if (cell === 10) return state === 2 ? sprites.linePressed10.id : state === 1 ? sprites.lineMissed10.id : sprites.lineNormal10.id
    if (cell === 11) return state === 2 ? sprites.linePressed11.id : state === 1 ? sprites.lineMissed11.id : sprites.lineNormal11.id
    if (cell === 12) return state === 2 ? sprites.linePressed12.id : state === 1 ? sprites.lineMissed12.id : sprites.lineNormal12.id
    if (cell === 13) return state === 2 ? sprites.linePressed13.id : state === 1 ? sprites.lineMissed13.id : sprites.lineNormal13.id
    if (cell === 14) return state === 2 ? sprites.linePressed14.id : state === 1 ? sprites.lineMissed14.id : sprites.lineNormal14.id
    return state === 2 ? sprites.linePressed15.id : state === 1 ? sprites.lineMissed15.id : sprites.lineNormal15.id
}

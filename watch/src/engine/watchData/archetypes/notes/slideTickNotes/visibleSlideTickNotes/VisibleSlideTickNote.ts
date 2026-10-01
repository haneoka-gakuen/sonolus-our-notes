import { nativeNoteEffectDuration } from '../../../../../../../../shared/src/engine/data/nativeEffects.js'
import { getNativeNoteCapId, getNativeNoteMainIds } from '../../../../../../../../shared/src/engine/data/nativeNoteSprites.generated.js'
import { perspectiveLayout } from '../../../../../../../../shared/src/engine/data/utils.js'
import { getNativeNoteParts, getNativeNoteRects } from '../../../../../../../../shared/src/engine/data/nativeNoteGeometry.js'
import { approach } from '../../../../../../../../shared/src/engine/data/note.js'
import { options } from '../../../../../configuration/options.js'
import { sfxDistance } from '../../../../effect.js'
import { note } from '../../../../note.js'
import { sizedEffectId, spawnNativeEffect } from '../../../../particle.js'
import { getZ, layer, skin } from '../../../../skin.js'
import { SlideTickNote } from '../SlideTickNote.js'

export abstract class VisibleSlideTickNote extends SlideTickNote {
    abstract sprites: {
        tick: SkinSprite
        fallback: SkinSprite
    }

    abstract clips: {
        tick: EffectClip
        fallback: EffectClip
    }

    abstract effect: ParticleEffect

    visualTime = this.entityMemory(Range)
    hiddenTime = this.entityMemory(Number)

    initialized = this.entityMemory(Boolean)

    bodyLayouts = this.entityMemory({ left: Rect, mainLeft: Rect, middle: Rect, mainRight: Rect, right: Rect })
    bodyIds = this.entityMemory({ left: SkinSpriteId, mainLeft: SkinSpriteId, middle: SkinSpriteId, mainRight: SkinSpriteId, right: SkinSpriteId })
    spriteLayout = this.entityMemory(Quad)
    z = this.entityMemory(Number)

    preprocess() {
        super.preprocess()

        this.visualTime.copyFrom(
            Range.l.mul(note.duration).add(timeScaleChanges.at(this.targetTime).scaledTime),
        )

        if (options.sfxEnabled) {
            if (replay.isReplay) {
                this.scheduleReplaySFX()
            } else {
                this.scheduleSFX()
            }
        }
    }

    spawnTime() {
        return this.visualTime.min
    }

    despawnTime() {
        return this.visualTime.max
    }

    initialize() {
        if (this.initialized) return
        this.initialized = true

        this.globalInitialize()
    }

    updateParallel() {
        if (options.hidden > 0 && time.scaled > this.hiddenTime) return

        this.render()
    }

    terminate() {
        if (time.skip) return

        this.despawnTerminate()
    }

    get useFallbackSprite() {
        return !this.sprites.tick.exists
    }

    get useFallbackClip() {
        return !this.clips.tick.exists
    }

    globalInitialize() {
        if (options.hidden > 0)
            this.hiddenTime = this.visualTime.max - note.duration * options.hidden

        const rects = getNativeNoteRects(this.import.lane, this.import.size, 7,
            skin.sprites.nativeArrowAnimationSkin002.exists, skin.sprites.nativeArrowAnimationSkin003.exists)
        const parts = getNativeNoteParts(this.import.lane, this.import.size, false)
        const main = getNativeNoteMainIds(skin.sprites, 7)
        this.bodyIds.left = getNativeNoteCapId(skin.sprites, 7, parts.leftTilt, parts.leftRight)
        this.bodyIds.right = getNativeNoteCapId(skin.sprites, 7, parts.rightTilt, parts.rightRight)
        this.bodyIds.mainLeft = main.left
        this.bodyIds.middle = main.middle
        this.bodyIds.mainRight = main.right
        new Rect(rects.left).copyTo(this.bodyLayouts.left)
        new Rect(rects.mainLeft).copyTo(this.bodyLayouts.mainLeft)
        new Rect(rects.middle).copyTo(this.bodyLayouts.middle)
        new Rect(rects.mainRight).copyTo(this.bodyLayouts.mainRight)
        new Rect(rects.right).copyTo(this.bodyLayouts.right)
        new Rect(rects.mark).toQuad().copyTo(this.spriteLayout)

        this.z = getZ(layer.note.tick, this.targetTime, this.import.lane)
    }

    scheduleSFX() {
        if (this.useFallbackClip) {
            this.clips.fallback.schedule(this.targetTime, sfxDistance)
        } else {
            this.clips.tick.schedule(this.targetTime, sfxDistance)
        }
    }

    scheduleReplaySFX() {
        if (!this.import.judgment) return

        this.scheduleSFX()
    }

    render() {
        const y = approach(this.visualTime.min, this.visualTime.max, time.scaled)

        if (this.useFallbackSprite) return

        this.drawBody(this.bodyIds.left, this.bodyLayouts.left, y)
        this.drawBody(this.bodyIds.mainLeft, this.bodyLayouts.mainLeft, y)
        this.drawBody(this.bodyIds.middle, this.bodyLayouts.middle, y)
        this.drawBody(this.bodyIds.mainRight, this.bodyLayouts.mainRight, y)
        this.drawBody(this.bodyIds.right, this.bodyLayouts.right, y)
        this.sprites.tick.draw(this.spriteLayout.mul(y), [this.z], 1)
    }

    drawBody(id: SkinSpriteId, layout: RectLike, y: number) {
        if (skin.sprites.exists(id)) skin.sprites.draw(id, perspectiveLayout(layout).mul(y), [this.z - 1], 1)
    }

    despawnTerminate() {
        if (replay.isReplay && !this.import.judgment) return

        if (options.noteEffectEnabled) this.playNoteEffect()
    }

    playNoteEffect() {
        spawnNativeEffect(sizedEffectId(this.effect.id, this.import.size), this.import.lane, this.import.size, nativeNoteEffectDuration(options.noteEffectProfile, 21, 5))
    }
}

import {
    nativeLaneEffectLifetime,
} from '../../../../../shared/src/engine/data/lane.js'
import { groundEffectLayout, particle } from '../particle.js'

export class EmptyEffect extends SpawnableArchetype({
    l: Number,
}) {
    initialized = this.entityMemory(Boolean)

    layout = this.entityMemory(Quad)

    nextTime = this.entityMemory(Number)

    spawnTime() {
        return -999999
    }

    despawnTime() {
        return 999999
    }

    initialize() {
        if (this.initialized) return
        this.initialized = true

        this.globalInitialize()
    }

    updateParallel() {
        let shouldUpdate = false
        let shouldSpawn = false
        if (time.skip) {
            shouldUpdate = true
        } else if (time.now >= this.nextTime) {
            shouldUpdate = true
            shouldSpawn = true
        }

        if (shouldUpdate) {
            this.nextTime = streams.getNextKey(this.spawnData.l, time.now)
            if (this.nextTime === time.now) this.nextTime = 999999
        }

        if (shouldSpawn) {
            particle.effects.laneInVain.spawn(this.layout, nativeLaneEffectLifetime, false)
        }
    }

    globalInitialize() {
        this.layout.copyFrom(
            new Quad(groundEffectLayout({ lane: this.spawnData.l + 0.5, size: 0.5 })),
        )
    }
}

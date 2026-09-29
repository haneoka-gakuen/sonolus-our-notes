import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NATIVE_EFFECT_CONTRACT } from '../shared/src/engine/data/nativeEffects.ts'

const engineRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contractFile = resolve(engineRoot, 'contract/native-effects.json')

export const writeNativeEffectContract = (): void => {
    mkdirSync(dirname(contractFile), { recursive: true })
    writeFileSync(contractFile, `${JSON.stringify(NATIVE_EFFECT_CONTRACT, null, 2)}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) writeNativeEffectContract()

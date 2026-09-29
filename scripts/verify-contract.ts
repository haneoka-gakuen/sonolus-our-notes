import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { NATIVE_EFFECT_CONTRACT } from '../shared/src/engine/data/nativeEffects.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contract = JSON.parse(readFileSync(resolve(root, 'contract/native-effects.json'), 'utf8')) as unknown

if (!isDeepStrictEqual(contract, NATIVE_EFFECT_CONTRACT)) {
    throw new Error('native-effects contract is stale; run `node scripts/generate-contract.ts`')
}

console.log('native-effects contract: valid')

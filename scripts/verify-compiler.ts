import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const engineRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contract = JSON.parse(readFileSync(resolve(engineRoot, 'patches/compiler.json'), 'utf8')) as {
    version: string
    patchFile: string
    patchSha256: string
    files: Record<string, string>
}
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

export function verifyCompilerRoot(root: string): void {
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string }
    if (manifest.version !== contract.version)
        throw new Error(`Compiler ${manifest.version} needs patch migration review; this engine requires exactly ${contract.version}`)
    for (const [path, expected] of Object.entries(contract.files)) {
        const actual = sha256(resolve(root, 'dist', path))
        if (actual !== expected)
            throw new Error(`Compiler ${contract.version} patch is absent or changed at ${path}; run pnpm install --frozen-lockfile from the workspace root`)
    }
}

/** Both direct engine imports and CLI worker peer resolution must use the patch. */
export function verifyInstalledCompiler() {
    const patchPath = resolve(engineRoot, 'patches', contract.patchFile)
    if (sha256(patchPath) !== contract.patchSha256) throw new Error('Compiler patch changed; update its reviewed contract before building')
    const directEntry = realpathSync(fileURLToPath(import.meta.resolve('@sonolus/sonolus.js-compiler/play')))
    const cliRequire = createRequire(import.meta.resolve('@sonolus/sonolus.js'))
    const workerEntry = realpathSync(cliRequire.resolve('@sonolus/sonolus.js-compiler/play'))
    const directRoot = resolve(dirname(directEntry), '..')
    const workerRoot = resolve(dirname(workerEntry), '..')
    verifyCompilerRoot(directRoot)
    if (workerRoot !== directRoot) verifyCompilerRoot(workerRoot)
    return { version: contract.version, patchSha256: contract.patchSha256, directRoot, workerRoot, files: contract.files }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
    console.log(JSON.stringify(verifyInstalledCompiler(), null, 2))

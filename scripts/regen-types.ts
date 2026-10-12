/**
 * Regenerate src/payload-types.ts using **Payload's own** generateTypes().
 *
 * WHY THIS EXISTS — `payload generate:types` (the CLI subcommand) stalls
 * indefinitely at "Compiling TS types…" in this environment. The config loads
 * fine, so the stall is inside the CLI's compile path, not the schema.
 *
 * WHY NOT a hand-rolled configToJSONSchema + json-schema-to-typescript: that
 * shortcut SKIPS two steps the real generator performs, and skipping them
 * silently corrupts the output —
 *   1. addSelectGenericsToGeneratedTypes() turns every
 *      `export interface XSelect {` into `export interface XSelect<T extends boolean = true> {`
 *   2. the `declare module 'payload' { export interface GeneratedTypes extends Config {} }`
 *      declaration is appended
 * Without (1), every `Select<...>` usage in the repo fails to typecheck and the
 * build breaks with a cascade of "Type 'JsonObject & TypeWithID' is missing the
 * following properties" errors. Always go through payload's generateTypes().
 */
import { config as loadEnv } from 'dotenv'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const root = new URL('..', import.meta.url).pathname
loadEnv({ path: root + '.env' })

console.log('[regen-types] loading config...')
const cfgMod = await import(pathToFileURL(root + 'src/payload.config.ts').toString())
// NOTE: buildConfig() returns a PROMISE here, so the config must be awaited.
// (A missed await leaves config as a Promise and yields "0 collections", which
// then trips the outputFile guard below.)
let config: any = cfgMod.default ?? cfgMod
if (config instanceof Promise) config = await config
if (typeof config === 'function') config = await config()
if (Array.isArray(config)) config = await config[0]()
console.log(
  '[regen-types] config loaded:',
  config.collections?.length,
  'collections,',
  config.globals?.length ?? 0,
  'globals',
)

if (!config.typescript?.outputFile) {
  console.error('[regen-types] ERROR: config.typescript.outputFile is not set.')
  process.exit(1)
}

// Resolve payload's REAL install directory rather than the pnpm symlink, so
// payload's internal relative imports and its own dependencies
// (@payloadcms/translations, json-schema-to-typescript) resolve from its store dir.
const payloadRealDir = fs.realpathSync(root + 'node_modules/payload')
const { generateTypes } = await import(
  pathToFileURL(payloadRealDir + '/dist/bin/generateTypes.js').toString()
)

await generateTypes(config)

// A 0 exit with no output can still mean nothing was written — verify.
const out = config.typescript.outputFile
const content = fs.existsSync(out) ? fs.readFileSync(out, 'utf-8') : ''
const checks = {
  bytes: content.length,
  lines: content.split('\n').length,
  selectGenerics: (content.match(/Select<T extends boolean/g) || []).length,
  generatedTypesDeclare: /interface GeneratedTypes extends Config/.test(content),
}
console.log('[regen-types]', JSON.stringify(checks))

if (checks.bytes === 0) {
  console.error('[regen-types] ERROR: output file is empty.')
  process.exit(1)
}
if (checks.selectGenerics === 0 || !checks.generatedTypesDeclare) {
  console.error(
    '[regen-types] ERROR: output is missing Select generics and/or the GeneratedTypes declare — this is the broken-shortcut signature. Do not commit it.',
  )
  process.exit(1)
}
console.log('[regen-types] OK ->', out)
process.exit(0)

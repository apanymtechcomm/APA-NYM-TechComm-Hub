/**
 * DEV-274 follow-up: migrate remaining hand-built-site images into Payload media.
 * Idempotent — matches seed.ts's upsertMedia pattern (find by filename, create if
 * absent). Staging paths point at seed-assets/ so the repo stays self-contained.
 */
import path from 'path'
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const root = path.resolve(process.cwd())
const p = (...f: string[]) => path.join(root, 'seed-assets', ...f)

const IMAGES: Array<[filename: string, alt: string]> = [
  ['hero-city-blue.png', 'NYC street scene'],
  ['hero-LIC-blue.png', 'Long Island City skyline, blue duotone'],
  ['hero-herald-blue.png', 'Herald Square, blue duotone'],
  ['hero-lower-mn-blue.png', 'Lower Manhattan skyline, blue duotone'],
  ['hero-midtown-blue.png', 'Midtown Manhattan skyline, blue duotone'],
  ['techcomm-logo.png', 'APA NYM TechComm logo'],
]

async function main() {
  const payload = (await getPayload({ config })) as any

  for (const [filename, alt] of IMAGES) {
    const all = await payload.find({
      collection: 'media',
      overrideAccess: true,
      limit: 1000,
      where: { filename: { equals: filename } },
    })
    if (all.docs && all.docs.length > 0) {
      console.log(`exists: ${filename} id=${all.docs[0].id}`)
      continue
    }
    const staged = '/tmp/' + filename
    fs.copyFileSync(p(filename), staged)
    const doc = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt },
      filePath: staged,
    })
    fs.rmSync(staged, { force: true })
    console.log(`media created: ${filename} id=${doc.id}`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
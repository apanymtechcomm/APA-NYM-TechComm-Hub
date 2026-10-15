/**
 * Assign migrated hero images to homepage hero slides (idempotent).
 * Mapping:
 *   Tech Tables Launch            -> hero-herald-blue.png
 *   Planning with a Black Mirror  -> hero-lower-mn-blue.png
 *   Field Notes NPC26             -> hero-LIC-blue.png
 * Matches slides by heading prefix (before any "||" break marker).
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const ASSIGN: Array<{ match: string; bgImage: number }> = [
  { match: 'Tech Tables Launch', bgImage: 7 }, // hero-herald-blue.png
  { match: 'Planning with a Black Mirror', bgImage: 8 }, // hero-lower-mn-blue.png
  { match: 'Field Notes', bgImage: 6 }, // hero-LIC-blue.png
]

async function main() {
  const payload = (await getPayload({ config })) as any

  const slides = await payload.find({
    collection: 'hero-slides',
    overrideAccess: true,
    limit: 100,
  })

  for (const spec of ASSIGN) {
    const slide = slides.docs.find(
      (s: any) => (s.heading || '').split('||')[0].trim() === spec.match,
    )
    if (!slide) {
      console.warn(`slide not found for "${spec.match}"`)
      continue
    }
    if (slide.bgImage && String(slide.bgImage) === String(spec.bgImage)) {
      console.log(`unchanged: "${slide.heading}" bgImage=${slide.bgImage}`)
      continue
    }
    const updated = await payload.update({
      collection: 'hero-slides',
      overrideAccess: true,
      id: slide.id,
      data: { bgImage: spec.bgImage },
    })
    console.log(
      `updated slide id=${updated.id} "${(updated.heading || '').replace('||', ' / ')}" -> bgImage=${spec.bgImage}`,
    )
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
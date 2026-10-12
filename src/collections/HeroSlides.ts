import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  labels: { singular: 'Hero slide', plural: 'Hero slides' },
  admin: {
    useAsTitle: 'heading',
    description: 'Homepage hero carousel slides (order by sortOrder).',
  },
  access: { read: () => true },
  fields: [
    { name: 'heading', type: 'text', required: true, admin: { description: 'Supports <br> via line breaks: use "||" to force a line break' } },
    { name: 'text', type: 'textarea', required: true },
    { name: 'ctaLabel', type: 'text', required: true },
    { name: 'ctaUrl', type: 'text', defaultValue: '#' },
    { name: 'bgImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional full-bleed background (otherwise gradient + city bars)' } },
    { name: 'sortOrder', type: 'number', defaultValue: 100 },
  ],
}
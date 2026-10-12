import type { CollectionConfig } from 'payload'

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  labels: { singular: 'Newsletter', plural: 'Newsletters' },
  admin: {
    useAsTitle: 'title',
    description: 'BYTE BY BYTE quarterly newsletter issues.',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. "BYTE BY BYTE Vol.01 // Spring 2026"' } },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'volume', type: 'text', admin: { description: 'e.g. Vol.01' } },
    { name: 'season', type: 'text', admin: { description: 'e.g. Spring 2026' } },
    { name: 'issueLabel', type: 'text', admin: { description: 'e.g. "NEWSLETTER 2026.01"' } },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'externalUrl', type: 'text', admin: { description: 'Optional link out (PDF or external issue page)' } },
    {
      name: 'body',
      type: 'richText',
      admin: { description: 'Issue content (rendered at /newsletters/[slug])' },
    },
    { name: 'publishedDate', type: 'date' },
  ],
}
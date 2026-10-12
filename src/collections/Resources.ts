import type { CollectionConfig } from 'payload'

export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: { singular: 'Resource', plural: 'Resources' },
  admin: { useAsTitle: 'title' },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'linkLabel', type: 'text', required: true, admin: { description: 'CTA text, e.g. "Visit the GitHub org"' } },
    { name: 'linkUrl', type: 'text', required: true },
  ],
}
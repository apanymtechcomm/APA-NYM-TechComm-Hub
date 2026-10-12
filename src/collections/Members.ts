import type { CollectionConfig } from 'payload'

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Member', plural: 'Members' },
  admin: { useAsTitle: 'name' },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'initials', type: 'text', admin: { description: 'Avatar monogram, e.g. "AB"' } },
    {
      name: 'memberRole',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: [
        { label: 'Co-Chair', value: 'co-chair' },
        { label: 'Secretary', value: 'secretary' },
        { label: 'Advisor', value: 'advisor' },
        { label: 'Member', value: 'member' },
      ],
    },
    { name: 'subtitle', type: 'text', admin: { description: 'e.g. "Co-Chair" or "Founding Co-Chair, Advisor"' } },
    {
      name: 'affiliation',
      type: 'text',
      admin: { description: 'For members: org line, e.g. "NYC Department of City Planning" (members use subtitle for role text)' },
    },
    { name: 'bio', type: 'textarea' },
    { name: 'sortOrder', type: 'number', defaultValue: 100 },
  ],
}
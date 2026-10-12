import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { description: 'Homepage cards section (below the hero carousel).' },
  access: { read: () => true },
  fields: [
    {
      name: 'cards',
      type: 'array',
      maxRows: 4,
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
        { name: 'ctaLabel', type: 'text', required: true },
        { name: 'ctaHref', type: 'text', required: true },
        {
          name: 'showNextEvent',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Replace body with the next upcoming event details' },
        },
      ],
    },
  ],
}

export const Sponsors: GlobalConfig = {
  slug: 'sponsors',
  admin: { description: 'Events page sponsor pitch + logo slots.' },
  access: { read: () => true },
  fields: [
    { name: 'pitch', type: 'textarea', required: true },
    { name: 'contactLabel', type: 'text', defaultValue: 'Get in touch' },
    { name: 'contactHref', type: 'text', defaultValue: '/contact' },
    { name: 'logoSlots', type: 'number', defaultValue: 4 },
  ],
}
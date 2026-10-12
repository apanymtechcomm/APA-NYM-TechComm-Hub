import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    description: 'Tech Tables, happy hours, workshops — committee programming.',
  },
  defaultSort: 'date',
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { description: 'URL segment, e.g. spring-tech-table' } },
    { name: 'eventDate', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    {
      name: 'timeString',
      type: 'text',
      required: true,
      admin: { description: 'Human-readable time range, e.g. "6:00 PM – 8:00 PM EDT"' },
    },
    { name: 'location', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Registration open', value: 'registration-open' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Past', value: 'past' },
      ],
    },
    { name: 'rsvpUrl', type: 'text', admin: { description: 'Google Form or other RSVP link (leave empty if not open)' } },
    { name: 'cmCredits', type: 'text', admin: { description: 'CM credit note, e.g. "CM Credits TBD"' } },
    { name: 'hybrid', type: 'checkbox', defaultValue: false, admin: { description: 'Hybrid option available' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'Show in homepage Events card' } },
  ],
}
import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'siteTitle',
      type: 'text',
      defaultValue: 'APA NYM TechComm',
    },
    {
      name: 'siteSubtitle',
      type: 'text',
      defaultValue: 'American Planning Association New York Metro Chapter Technology Committee',
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}

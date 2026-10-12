import React from 'react'

import { getPayloadClient } from '@/lib/payload'

export async function SiteFooter() {
  const payload = await getPayloadClient()
  const footer = (await payload.findGlobal({ slug: 'footer' })) as any

  return <footer className="site-footer">{footer?.footerText ?? 'APA New York Metro Chapter | Technology Committee'}</footer>
}
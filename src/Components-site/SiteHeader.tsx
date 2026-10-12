import Link from 'next/link'
import React from 'react'

import { getPayloadClient } from '@/lib/payload'

type NavItem = { link?: { type?: string; url?: string; label?: string; newTab?: boolean; reference?: unknown } }

const hrefFor = (item: NavItem): string => {
  const l: any = item?.link ?? item
  if (l?.type === 'custom' && l?.url) return l.url
  // internal references resolve to their doc URL; fallback '#'
  return l?.url || '#'
}

const labelFor = (item: NavItem): string => {
  const l: any = item?.link ?? item
  return l?.label ?? 'Link'
}

export async function SiteHeader() {
  const payload = await getPayloadClient()
  const header = (await payload.findGlobal({ slug: 'header' })) as any

  return (
    <header className="site-header">
      <div className="site-branding">
        <div className="site-title">
          <Link href="/">{header?.siteTitle ?? 'APA NYM TechComm'}</Link>
        </div>
        <div className="site-subtitle">{header?.siteSubtitle}</div>
      </div>
      <nav aria-label="Main navigation">
        <ul className="site-nav">
          {(header?.navItems ?? []).map((item: NavItem, i: number) => {
            const href = hrefFor(item)
            const external = href.startsWith('http')
            return (
              <li key={i}>
                {external ? (
                  <a href={href} target="_blank" rel="noreferrer">
                    {labelFor(item)}
                  </a>
                ) : (
                  <Link href={href}>{labelFor(item)}</Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
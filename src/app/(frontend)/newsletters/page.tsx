import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import React from 'react'

export default async function NewslettersPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'newsletters', overrideAccess: true, sort: '-publishedDate', limit: 50 })

  return (
    <main className="page-section">
      <h1>Newsletters</h1>
      <p className="page-intro">BYTE BY BYTE — the quarterly publication of APA NYM TechComm.</p>
      <h2>Newsletter volumes</h2>
      <div className="newsletter-list">
        {res.docs.map((n: any) => (
          <article className="newsletter-row" key={n.id}>
            <div>
              <h3>{n.title}</h3>
              <span className="issue-label">{n.issueLabel}</span>
            </div>
            {n.externalUrl ? (
              <a href={n.externalUrl} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            ) : (
              <Link href={`/newsletters/${n.slug}`}>Read the issue</Link>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}
import { getPayloadClient } from '@/lib/payload'
import React from 'react'

export default async function ResourcesPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'resources', overrideAccess: true, limit: 100 })

  return (
    <main className="page-section">
      <h1>Resources</h1>
      <p className="page-intro">Tools, frameworks, readings, and case studies for technology-informed planning.</p>
      <div className="resource-grid">
        {res.docs.map((r: any) => (
          <article className="resource-card" key={r.id}>
            <h3>{r.title}</h3>
            <p>{r.description}</p>
            <a href={r.linkUrl} target={r.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              {r.linkLabel}
            </a>
          </article>
        ))}
      </div>
    </main>
  )
}
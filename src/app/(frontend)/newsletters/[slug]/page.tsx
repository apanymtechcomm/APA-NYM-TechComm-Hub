import { notFound } from 'next/navigation'
import RichText from '@/components/RichText'
import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/utilities/mediaUrl'
import React from 'react'

// Static export (GitHub Pages): pre-render every newsletter issue at build time.
export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'newsletters', overrideAccess: true, limit: 100 })
  return (res.docs as any[]).map((n) => ({ slug: n.slug }))
}

export default async function NewsletterIssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'newsletters',
    overrideAccess: true,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  const issue = res.docs[0] as any
  if (!issue) notFound()

  return (
    <main className="page-section">
      <div className="newsletter-article">
        <h1>{issue.title}</h1>
        <p className="page-intro">{issue.issueLabel}</p>
        {issue.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="newsletter-cover" src={mediaUrl(issue.coverImage.url)} alt={issue.coverImage.alt ?? ''} />
        )}
        <RichText data={issue.body} />
      </div>
    </main>
  )
}
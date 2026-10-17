import { getPayloadClient } from '@/lib/payload'
import React from 'react'

export default async function EventsPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'events', overrideAccess: true, sort: 'eventDate', limit: 50 })
  const sponsors = (await payload.findGlobal({ slug: 'sponsors' })) as any

  return (
    <main className="page-section" id="black-mirror">
      <h1>Events</h1>
      <p className="page-intro">Tech Tables, happy hours, workshops, and more.</p>
      {res.docs.map((e: any) => (
        <article className="event-card" key={e.id}>
          <h3>{`// ${e.title.toUpperCase()}`}</h3>
          <span className={`event-status ${e.status}`}>{e.status.replace('-', ' ').toUpperCase()}</span>
          <div className="event-meta">
            <div>🕝 Date/Time: {new Date(e.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} @ {e.timeString}</div>
            <div>📍 Location: {e.location}</div>
          </div>
          <p className="event-desc">{e.description}</p>
          {e.rsvpUrl && (
            <a className="event-rsvp" href={e.rsvpUrl} target="_blank" rel="noreferrer">
              {e.status === 'past' && /github\.com/.test(e.rsvpUrl) ? 'View the lab →' : 'RSVP →'}
            </a>
          )}
        </article>
      ))}

      {sponsors && (
        <section className="sponsors-band">
          <h2>SPONSORS</h2>
          <p className="event-desc" style={{ maxWidth: 640, margin: '0 auto 8px' }}>
            {sponsors.pitch}{' '}
            {sponsors.contactHref && (
              <a href={sponsors.contactHref}>{sponsors.contactLabel ?? 'Get in touch'}</a>
            )}
            .
          </p>
          <div className="sponsors-logos">
            {Array.from({ length: sponsors.logoSlots ?? 4 }).map((_, i) => (
              <div className="sponsor-slot" key={i}>
                Your Logo Here
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
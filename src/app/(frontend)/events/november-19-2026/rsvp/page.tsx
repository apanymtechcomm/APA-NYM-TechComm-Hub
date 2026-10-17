import { EventRsvpForm } from '@/Components-site/EventRsvpForm'
import Link from 'next/link'
import React from 'react'

function eventRsvpApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_EVENT_RSVP_API_URL
  if (configured) return configured

  const signupUrl = process.env.NEXT_PUBLIC_SIGNUP_API_URL
  if (!signupUrl) return ''

  try {
    const url = new URL(signupUrl)
    url.pathname = '/v1/event-rsvps'
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

export default function NovemberTechTableRsvpPage() {
  return (
    <main className="page-section event-rsvp-page">
      <Link className="event-rsvp-back" href="/events">
        ← Back to events
      </Link>
      <h1>RSVP: November Tech Table</h1>
      <p className="page-intro">Thursday, November 19, 2026 · 6:00–8:00 PM EST</p>

      <section aria-labelledby="building-entry-deadline" className="event-deadline-notice">
        <h2 id="building-entry-deadline">Building-entry deadline: November 18</h2>
        <p>
          Submit the full name of every in-person attendee exactly as it should appear on the building-entry list by November 18. Late or unlisted attendees cannot enter the building and must join the program virtually.
        </p>
      </section>

      <p>
        Choose one attendance mode below. You may attend the full event, only the in-person program, only the virtual program, or only the in-person happy hour. Venue and virtual access details will be shared separately when available.
      </p>

      <EventRsvpForm
        apiUrl={eventRsvpApiUrl()}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
      />
    </main>
  )
}

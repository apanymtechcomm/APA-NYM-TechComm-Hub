import Link from 'next/link'
import React from 'react'

export type HomepageCard = {
  heading: string
  body?: string | null
  ctaLabel: string
  ctaHref: string
  showNextEvent?: boolean
}

export type NextEventData = {
  title: string
  dateString: string
  timeString: string
  location: string
  hybrid: boolean
  cmCredits?: string | null
} | null

export function CardsSection({
  cards,
  nextEvent,
}: {
  cards: HomepageCard[]
  nextEvent: NextEventData
}) {
  return (
    <section className="cards-section">
      <div className="cards-grid">
        {cards.map((card, i) => (
          <article className="card" key={i}>
            <h3>{card.heading}</h3>
            {card.showNextEvent && nextEvent ? (
              <div className="card-details">
                <span>
                  <strong>{nextEvent.title}</strong>
                </span>
                <span>{nextEvent.dateString}</span>
                <span>{nextEvent.timeString}</span>
                <span>{nextEvent.location}</span>
                {nextEvent.hybrid && <span>Hybrid option available</span>}
                {nextEvent.cmCredits && <span>{nextEvent.cmCredits}</span>}
              </div>
            ) : (
              card.body && <p>{card.body}</p>
            )}
            <Link href={card.ctaHref} className="card-cta">
              {card.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
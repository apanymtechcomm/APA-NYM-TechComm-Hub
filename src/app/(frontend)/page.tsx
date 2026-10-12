import { HeroCarousel, type HeroSlideData } from '@/Components-site/HeroCarousel'
import { CardsSection, type HomepageCard, type NextEventData } from '@/Components-site/CardsSection'
import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/utilities/mediaUrl'
import React from 'react'

export default async function HomePage() {
  const payload = await getPayloadClient()

  const slidesRes = await payload.find({ collection: 'hero-slides', overrideAccess: true, sort: 'sortOrder', limit: 20 })
  const slides: HeroSlideData[] = slidesRes.docs.map((s: any) => ({
    id: s.id,
    heading: s.heading,
    text: s.text,
    ctaLabel: s.ctaLabel,
    ctaUrl: s.ctaUrl,
    bgImageUrl: s.bgImage?.url ? mediaUrl(s.bgImage.url) : null,
  }))

  const homepage = (await payload.findGlobal({ slug: 'homepage' })) as any
  const cards: HomepageCard[] = homepage?.cards ?? []

  // next upcoming event (skip past dates), for the Events card
  let nextEvent: NextEventData = null
  const eventsRes = await payload.find({
    collection: 'events',
    overrideAccess: true,
    sort: 'eventDate',
    limit: 10,
    where: { status: { not_equals: 'past' } },
  })
  const now = Date.now()
  const upcoming = eventsRes.docs.find((e: any) => new Date(e.eventDate).getTime() >= now - 86400000)
  if (upcoming) {
    nextEvent = {
      title: upcoming.title,
      dateString: new Date(upcoming.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      timeString: upcoming.timeString,
      location: upcoming.location,
      hybrid: Boolean(upcoming.hybrid),
      cmCredits: upcoming.cmCredits,
    }
  }

  return (
    <>
      <HeroCarousel slides={slides} />
      <section className="cards-section" id="about">
        <CardsSection cards={cards} nextEvent={nextEvent} />
      </section>
    </>
  )
}
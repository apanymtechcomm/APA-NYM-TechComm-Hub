'use client'

import React, { useCallback, useEffect, useState } from 'react'

export type HeroSlideData = {
  id: number | string
  heading: string
  text: string
  ctaLabel: string
  ctaUrl: string
  bgImageUrl?: string | null
}

/** Line breaks: seed data may carry "||" markers to force a break (original HTML used <br>). */
const breaks = (s: string): React.ReactNode[] => {
  const parts = (s ?? '').split('||')
  return parts.flatMap((p, i) =>
    i === 0 ? [p] : [<br key={`br-${i}`} />, p],
  )
}

export function HeroCarousel({ slides }: { slides: HeroSlideData[] }) {
  const [active, setActive] = useState(0)
  const count = slides.length

  const prev = useCallback(() => setActive((a) => (a - 1 + count) % count), [count])
  const next = useCallback(() => setActive((a) => (a + 1) % count), [count])

  // keyboard arrows like the original carousel.js
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  return (
    <section className="hero" aria-label="Featured stories" aria-roledescription="carousel">
      <div className="hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="hero-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${count}`}
            aria-hidden={i !== active}
          >
            <div className="hero-slide-bg">
              {s.bgImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.bgImageUrl} alt="" className="hero-bg-img" />
              )}
              <svg
                className="hero-slide-bg-city"
                viewBox="0 0 1200 400"
                preserveAspectRatio="xMidYMax slice"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {[
                  [80, 120, 60, 280],
                  [160, 60, 50, 340],
                  [240, 150, 70, 250],
                  [340, 40, 55, 360],
                  [420, 100, 80, 300],
                  [530, 20, 45, 380],
                  [600, 80, 65, 320],
                  [700, 130, 55, 270],
                  [780, 50, 70, 350],
                  [880, 90, 50, 310],
                  [960, 160, 60, 240],
                  [1050, 70, 55, 330],
                ].map(([x, y, w, h], j) => (
                  <rect key={j} x={x} y={y} width={w} height={h} fill="#ffffff" />
                ))}
              </svg>
            </div>
            <div className="hero-overlay">
              <h2>{breaks(s.heading)}</h2>
              <p>{s.text}</p>
              <a href={s.ctaUrl || '#'} className="hero-cta">
                {s.ctaLabel}
              </a>
            </div>
          </div>
        ))}
      </div>

      <button className="hero-btn hero-btn-prev" aria-label="Previous slide" onClick={prev}>
        ←
      </button>
      <button className="hero-btn hero-btn-next" aria-label="Next slide" onClick={next}>
        →
      </button>
      <div className="hero-dots" role="tablist" aria-label="Carousel slide indicators">
        {slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
            className={`hero-dot${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </section>
  )
}
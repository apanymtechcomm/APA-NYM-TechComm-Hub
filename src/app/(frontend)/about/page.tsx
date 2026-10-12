import { getPayloadClient } from '@/lib/payload'
import React from 'react'

export default async function AboutPage() {
  return (
    <main className="page-section">
      <h1>About</h1>
      <p className="page-intro">
        The APA New York Metro Chapter Technology Committee — connecting planners with the tools that shape cities.
      </p>
      <h2>Our Mission</h2>
      <p>
        The APA NYM Technology Committee serves the New York Metro chapter — one of APA&apos;s largest regional chapters,
        covering New York City, Long Island, and the lower Hudson Valley — by curating technology-focused educational
        content, advising on digital tools for planning practice, connecting members with technology resources, and
        supporting the chapter&apos;s digital presence and communication.
      </p>
      <h2>What We Do</h2>
      <p>• Educational programming — Technology-focused sessions at NYM events, including Tech Tables and conference workshops</p>
      <p>• Tool guidance — Recommendations for planning software, platforms, and data resources</p>
      <p>• Member resources — Tutorials, templates, best practices, and the BYTE BY BYTE quarterly newsletter</p>
      <p>• Industry connections — Vendor relationships and technology partnerships for the planning community</p>
      <h2>Get Involved</h2>
      <p>
        We&apos;re always looking for planners, technologists, designers, and researchers who want to shape how technology
        serves planning practice. Whether you&apos;re a seasoned professional or just getting started, there&apos;s a place
        for you. Join our{' '}
        <a href="/contact" target="_blank" rel="noreferrer">
          listserv
        </a>{' '}
        to stay in the loop, or reach out to our co-chairs at <a href="mailto:technology@nyplanning.org">technology@nyplanning.org</a>.
      </p>
    </main>
  )
}
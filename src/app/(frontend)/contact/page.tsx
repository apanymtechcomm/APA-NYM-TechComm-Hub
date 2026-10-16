import Link from 'next/link'
import React from 'react'

import { SignupForm } from '@/Components-site/SignupForm'

export default function ContactPage() {
  return (
    <main className="page-section">
      <h1>Contact</h1>
      <p className="page-intro">Reach the committee, pitch an idea, or just say hello.</p>
      <div className="contact-block">
        <h2>General Inquiries</h2>
        <p>
          Email: <a href="mailto:technology@nyplanning.org">technology@nyplanning.org</a>
        </p>
        <p>
          Committee Gmail: <a href="mailto:apa.techcomm@gmail.com">apa.techcomm@gmail.com</a>
        </p>
      </div>
      <div className="contact-block">
        <h2>Join the Committee List</h2>
        <p>
          Choose the updates you want from the NYC planning technology community. Your signup details stay confidential.
        </p>
        <SignupForm
          apiUrl={process.env.NEXT_PUBLIC_SIGNUP_API_URL ?? ''}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
        />
      </div>
      <div className="contact-block">
        <h2>Follow Us</h2>
        <p>
          LinkedIn:{' '}
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">
            APA Tech Committee
          </a>
          <br />
          Newsletter: <Link href="/newsletters">BYTE BY BYTE — Read the latest</Link>
        </p>
      </div>
    </main>
  )
}
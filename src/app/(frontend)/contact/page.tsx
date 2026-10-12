import React from 'react'

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
        <h2>Join the Listserv</h2>
        <p>
          Stay connected with the NYC planning technology community. Get event announcements, tool recommendations, and
          discussion digests.
        </p>
        <a href="mailto:apa.techcomm@gmail.com">Join the Listserv</a>
      </div>
      <div className="contact-block">
        <h2>Follow Us</h2>
        <p>
          LinkedIn:{' '}
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">
            APA Tech Committee
          </a>
          <br />
          Newsletter: <a href="/newsletters">BYTE BY BYTE — Read the latest</a>
        </p>
      </div>
    </main>
  )
}
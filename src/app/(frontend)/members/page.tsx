import { getPayloadClient } from '@/lib/payload'
import type { Member } from '@/payload-types'
import React from 'react'

const openRoles = [
  {
    title: 'Co-Chair',
    description: [
      'Helps lead Committee meetings, activities, special projects, and event planning.',
      'Coordinates collaborations and steps in for the other Co-Chair when needed.',
    ],
  },
  {
    title: 'Secretary',
    description: [
      'Prepares meeting minutes and fulfills Chapter recordkeeping and reporting requirements.',
      'Maintains the Committee’s records and archives and coordinates ongoing communications with participants.',
    ],
  },
  {
    title: 'Treasurer',
    description: [
      'Manages Committee funds in accordance with the budget and Chapter financial policies and assists with budget submissions.',
      'Prepares required financial reports and ensures contributions supporting Committee activities are accurately accounted for.',
    ],
  },
  {
    title: 'Communications',
    description: [
      'Coordinates regular updates to participants through email, social media, the website, and other Committee channels.',
      'Keeps current information, publications, and reports posted in a timely manner and aligned with APA and APA-NYM branding.',
    ],
  },
] as const

export default async function MembersPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'members', overrideAccess: true, sort: 'sortOrder', limit: 100 })
  const currentMembers = res.docs as Member[]

  return (
    <main className="page-section">
      <h1>Committee</h1>
      <p className="page-intro">
        The Technology Committee connects planners across the New York metropolitan area to exchange practical knowledge about
        data and technology, share resources, and improve planning practice.
      </p>

      {currentMembers.length ? (
        <section aria-labelledby="current-leadership-heading">
          <h2 id="current-leadership-heading">Current Leadership</h2>
          <div className="member-grid">
            {currentMembers.map((member) => (
              <article className="member-card" key={member.id}>
                <div className="member-avatar" aria-hidden="true">
                  {member.initials}
                </div>
                <div>
                  <h3>{member.name}</h3>
                  <div className="member-sub">{member.subtitle}</div>
                  <p className="member-bio">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="open-roles-heading">
        <h2 id="open-roles-heading">Open Roles</h2>
        <div className="member-grid">
          {openRoles.map((role) => (
            <article className="vacancy-card" key={role.title}>
              <div className="vacancy-label">Position open</div>
              <h3>{role.title}</h3>
              <p className="vacancy-description">{role.description.join(' ')}</p>
            </article>
          ))}
        </div>
        <p className="committee-interest">
          Interested in helping lead the Committee? Email{' '}
          <a href="mailto:apa.techcomm@gmail.com">apa.techcomm@gmail.com</a> to get involved.
        </p>
      </section>
    </main>
  )
}

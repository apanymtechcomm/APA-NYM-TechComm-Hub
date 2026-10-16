import { getPayloadClient } from '@/lib/payload'
import React from 'react'

export default async function MembersPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'members', overrideAccess: true, sort: 'sortOrder', limit: 100 })

  const groups: Array<[string, string]> = [
    ['co-chair', 'Co-Chair'],
    ['secretary', 'Secretary'],
    ['advisor', 'Advisor'],
  ]

  const memberDocs = res.docs as any[]
  const byRole = (role: string) => memberDocs.filter((m: any) => m.memberRole === role)
  const members = byRole('member')

  return (
    <main className="page-section">
      <h1>Members</h1>
      <p className="page-intro">
        A community of planners, technologists, designers, and researchers exploring the future of planning practice.
      </p>
      {groups.map(([role, label]) =>
        byRole(role).length ? (
          <section key={role}>
            <h2>{label}</h2>
            <div className="member-grid">
              {byRole(role).map((m: any) => (
                <article className="member-card" key={m.id}>
                  <div className="member-avatar">{m.initials}</div>
                  <div>
                    <h3>{m.name}</h3>
                    <div className="member-sub">{m.subtitle}</div>
                    <p className="member-bio">{m.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null,
      )}
      {members.length ? (
        <section>
          <h2>Members</h2>
          <div className="member-grid">
            {members.map((m: any) => (
              <article className="member-card" key={m.id}>
                <div className="member-avatar">{m.initials}</div>
                <div>
                  <h3>{m.name}</h3>
                  <div className="member-sub">{m.subtitle}</div>
                  <p className="member-bio">{m.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
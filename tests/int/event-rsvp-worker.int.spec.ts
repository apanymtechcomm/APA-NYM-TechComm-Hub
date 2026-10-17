import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import worker from '../../worker/src/index'

type StoredRsvp = {
  attendanceMode: string
  cmCredit: string | null
  email: string
  eventSlug: string
  fullName: string
  labInterest: string | null
}

class FakeStatement {
  private values: unknown[] = []

  constructor(
    private readonly sql: string,
    private readonly rows: Map<string, StoredRsvp>,
  ) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run() {
    if (!this.sql.includes('INSERT INTO event_rsvps')) throw new Error(`Unexpected SQL: ${this.sql}`)
    const [, eventSlug, email, fullName, attendanceMode, labInterest, cmCredit] = this.values as [
      string,
      string,
      string,
      string,
      string,
      string | null,
      string | null,
      string,
      string,
    ]
    this.rows.set(`${eventSlug}:${email}`, {
      attendanceMode,
      cmCredit,
      email,
      eventSlug,
      fullName,
      labInterest,
    })
    return { success: true, meta: { changes: 1 } }
  }
}

class FakeDatabase {
  readonly rows = new Map<string, StoredRsvp>()

  prepare(sql: string) {
    return new FakeStatement(sql, this.rows)
  }
}

function makeEnv() {
  return {
    ALLOWED_ORIGINS: 'https://apanymtechcomm.github.io,http://localhost:3115',
    CONSENT_SOURCE: 'public-website',
    CONSENT_VERSION: '2026-10-16',
    DB: new FakeDatabase(),
    SIGNUP_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
    SIGNUP_STATUS: 'active',
    TURNSTILE_EXPECTED_ACTION: 'signup',
    TURNSTILE_HOSTNAMES: 'apanymtechcomm.github.io,localhost',
    TURNSTILE_SECRET: 'test-secret',
  }
}

function rsvpRequest(body: Record<string, unknown>) {
  const json = JSON.stringify(body)
  return new Request('https://signup.example.test/v1/event-rsvps', {
    body: json,
    headers: {
      'content-length': String(new TextEncoder().encode(json).byteLength),
      'content-type': 'application/json',
      origin: 'https://apanymtechcomm.github.io',
    },
    method: 'POST',
  })
}

const validBody = {
  attendanceMode: 'in_person_full_event',
  cmCredit: 'yes',
  email: ' Planner@Example.COM ',
  eventSlug: '2026-11-19-tech-table',
  fullName: '  Ada   Planner  ',
  labInterest: 'unsure',
  turnstileToken: 'verified-token',
}

afterEach(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  vi.restoreAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T12:00:00.000Z'))
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        action: 'event-rsvp',
        hostname: 'apanymtechcomm.github.io',
        success: true,
      }),
    ),
  )
})

describe('event RSVP Worker endpoint', () => {
  it('normalizes and stores a complete RSVP without newsletter consent semantics or PII logs', async () => {
    const env = makeEnv()
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const response = await worker.fetch(rsvpRequest(validBody), env as never, {} as ExecutionContext)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Thanks — your RSVP has been saved.',
      ok: true,
    })
    expect(env.DB.rows.get('2026-11-19-tech-table:planner@example.com')).toEqual({
      attendanceMode: 'in_person_full_event',
      cmCredit: 'yes',
      email: 'planner@example.com',
      eventSlug: '2026-11-19-tech-table',
      fullName: 'Ada Planner',
      labInterest: 'unsure',
    })
    expect(JSON.stringify(log.mock.calls)).not.toContain('planner@example.com')
    expect(JSON.stringify(log.mock.calls)).not.toContain('Ada Planner')

    const turnstileBody = vi.mocked(fetch).mock.calls[0][1]?.body as FormData
    expect(Object.fromEntries(turnstileBody.entries())).toMatchObject({
      response: 'verified-token',
      secret: 'test-secret',
    })
  })

  it('allows omitted lab-interest and CM-credit responses', async () => {
    const env = makeEnv()
    const response = await worker.fetch(
      rsvpRequest({ ...validBody, cmCredit: null, labInterest: null }),
      env as never,
      {} as ExecutionContext,
    )
    expect(response.status).toBe(200)
    expect(env.DB.rows.get('2026-11-19-tech-table:planner@example.com')).toMatchObject({
      cmCredit: null,
      labInterest: null,
    })
  })

  it.each([
    ['missing email', { ...validBody, email: '' }],
    ['missing full name', { ...validBody, fullName: ' ' }],
    ['missing attendance mode', { ...validBody, attendanceMode: '' }],
    ['unsupported attendance mode', { ...validBody, attendanceMode: 'phone' }],
    ['wrong event slug', { ...validBody, eventSlug: 'other-event' }],
    ['invalid lab response', { ...validBody, labInterest: 'sometimes' }],
    ['invalid CM response', { ...validBody, cmCredit: 'maybe' }],
  ])('rejects %s', async (_label, body) => {
    const response = await worker.fetch(rsvpRequest(body), makeEnv() as never, {} as ExecutionContext)
    expect(response.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects an in-person RSVP after November 18 but still accepts virtual attendance', async () => {
    vi.setSystemTime(new Date('2026-11-19T05:00:00.000Z'))
    const env = makeEnv()
    const inPerson = await worker.fetch(rsvpRequest(validBody), env as never, {} as ExecutionContext)
    expect(inPerson.status).toBe(409)
    await expect(inPerson.json()).resolves.toMatchObject({
      message: expect.stringContaining('building-entry deadline has passed'),
      ok: false,
    })
    expect(fetch).not.toHaveBeenCalled()

    const virtual = await worker.fetch(
      rsvpRequest({ ...validBody, attendanceMode: 'virtual_program_only' }),
      env as never,
      {} as ExecutionContext,
    )
    expect(virtual.status).toBe(200)
  })

  it('requires the event-rsvp Turnstile action', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({
      action: 'signup',
      hostname: 'apanymtechcomm.github.io',
      success: true,
    }))
    const response = await worker.fetch(rsvpRequest(validBody), makeEnv() as never, {} as ExecutionContext)
    expect(response.status).toBe(400)
  })
})

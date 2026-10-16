import { beforeEach, describe, expect, it, vi } from 'vitest'

import worker from '../../worker/src/index'

type StoredSignup = {
  committeeEmails: number
  consentSource: string
  consentVersion: string
  email: string
  eventNotifications: number
  name: string | null
  status: string
}

class FakeStatement {
  private values: unknown[] = []

  constructor(
    private readonly sql: string,
    private readonly rows: Map<string, StoredSignup>,
  ) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run() {
    if (!this.sql.includes('INSERT INTO signups')) throw new Error(`Unexpected SQL: ${this.sql}`)

    const [
      ,
      email,
      name,
      committeeEmails,
      eventNotifications,
      ,
      consentVersion,
      consentSource,
      status,
    ] = this.values as [string, string, string | null, number, number, string, string, string, string, string]

    this.rows.set(email, {
      committeeEmails,
      consentSource,
      consentVersion,
      email,
      eventNotifications,
      name,
      status,
    })

    return { success: true, meta: { changes: 1 } }
  }
}

class FakeDatabase {
  readonly rows = new Map<string, StoredSignup>()

  prepare(sql: string) {
    return new FakeStatement(sql, this.rows)
  }
}

function makeEnv(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  }
}

function signupRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  const json = JSON.stringify(body)
  return new Request('https://signup.example.test/v1/signup', {
    body: json,
    headers: {
      'content-length': String(new TextEncoder().encode(json).byteLength),
      'content-type': 'application/json',
      origin: 'https://apanymtechcomm.github.io',
      ...headers,
    },
    method: 'POST',
  })
}

const validBody = {
  committeeEmails: true,
  consent: true,
  email: ' Planner@Example.COM ',
  eventNotifications: false,
  name: 'Ada Planner',
  turnstileToken: 'verified-token',
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(
      Response.json({
        action: 'signup',
        hostname: 'apanymtechcomm.github.io',
        success: true,
      }),
    )),
  )
})

describe('confidential signup Worker', () => {
  it('answers preflight only for an explicitly allowed origin', async () => {
    const allowed = await worker.fetch(
      new Request('https://signup.example.test/v1/signup', {
        headers: {
          'access-control-request-method': 'POST',
          origin: 'https://apanymtechcomm.github.io',
        },
        method: 'OPTIONS',
      }),
      makeEnv() as never,
      {} as ExecutionContext,
    )
    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://apanymtechcomm.github.io')
    expect(allowed.headers.get('vary')).toContain('Origin')

    const denied = await worker.fetch(
      new Request('https://signup.example.test/v1/signup', {
        headers: { origin: 'https://attacker.example' },
        method: 'OPTIONS',
      }),
      makeEnv() as never,
      {} as ExecutionContext,
    )
    expect(denied.status).toBe(403)
    expect(denied.headers.has('access-control-allow-origin')).toBe(false)
  })

  it('normalizes and stores a verified signup without logging PII', async () => {
    const env = makeEnv()
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const response = await worker.fetch(signupRequest(validBody), env as never, {} as ExecutionContext)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Thanks — your preferences have been saved.',
      ok: true,
    })
    expect(response.headers.get('access-control-allow-origin')).toBe('https://apanymtechcomm.github.io')
    expect(env.DB.rows.get('planner@example.com')).toMatchObject({
      committeeEmails: 1,
      consentSource: 'public-website',
      consentVersion: '2026-10-16',
      email: 'planner@example.com',
      eventNotifications: 0,
      name: 'Ada Planner',
      status: 'active',
    })
    expect(JSON.stringify(log.mock.calls)).not.toContain('planner@example.com')

    const turnstileCall = vi.mocked(fetch).mock.calls[0]
    expect(turnstileCall[0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const turnstileBody = turnstileCall[1]?.body
    expect(turnstileBody).toBeInstanceOf(FormData)
    expect(Object.fromEntries((turnstileBody as FormData).entries())).toMatchObject({
      response: 'verified-token',
      secret: 'test-secret',
    })
  })

  it('returns the same generic success for a normalized duplicate', async () => {
    const env = makeEnv()
    const first = await worker.fetch(signupRequest(validBody), env as never, {} as ExecutionContext)
    const second = await worker.fetch(
      signupRequest({ ...validBody, email: 'planner@example.com', name: 'Ada P.' }),
      env as never,
      {} as ExecutionContext,
    )

    expect(first.status).toBe(200)
    expect(await second.json()).toEqual(await first.json())
    expect(env.DB.rows.size).toBe(1)
    expect(env.DB.rows.get('planner@example.com')?.name).toBe('Ada P.')
  })

  it.each([
    ['rejects a missing consent', { ...validBody, consent: false }],
    ['rejects an invalid email', { ...validBody, email: 'not-an-email' }],
    ['requires at least one preference', { ...validBody, committeeEmails: false }],
    ['rejects a missing Turnstile token', { ...validBody, turnstileToken: '' }],
  ])('%s', async (_label, body) => {
    const response = await worker.fetch(signupRequest(body), makeEnv() as never, {} as ExecutionContext)
    expect(response.status).toBe(400)
  })

  it('rejects unsupported media types and oversized bodies before parsing', async () => {
    const unsupported = await worker.fetch(
      signupRequest(validBody, { 'content-type': 'text/plain' }),
      makeEnv() as never,
      {} as ExecutionContext,
    )
    expect(unsupported.status).toBe(415)

    const oversized = await worker.fetch(
      signupRequest(validBody, { 'content-length': '20000' }),
      makeEnv() as never,
      {} as ExecutionContext,
    )
    expect(oversized.status).toBe(413)
  })

  it.each([
    [{ action: 'other', hostname: 'apanymtechcomm.github.io', success: true }],
    [{ action: 'signup', hostname: 'evil.example', success: true }],
    [{ action: 'signup', hostname: 'apanymtechcomm.github.io', success: false }],
  ])('rejects a Turnstile response outside the action and hostname contract', async (siteverify) => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(siteverify))
    const response = await worker.fetch(signupRequest(validBody), makeEnv() as never, {} as ExecutionContext)
    expect(response.status).toBe(400)
  })

  it('returns 429 when the Cloudflare rate limiter denies the request', async () => {
    const env = makeEnv({
      SIGNUP_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) },
    })
    const response = await worker.fetch(signupRequest(validBody), env as never, {} as ExecutionContext)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not expose a public read endpoint', async () => {
    const response = await worker.fetch(
      new Request('https://signup.example.test/v1/signup', {
        headers: { origin: 'https://apanymtechcomm.github.io' },
      }),
      makeEnv() as never,
      {} as ExecutionContext,
    )
    expect(response.status).toBe(405)
  })
})

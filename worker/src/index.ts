const SIGNUP_PATH = '/v1/signup'
const EVENT_RSVP_PATH = '/v1/event-rsvps'
const NOVEMBER_EVENT_SLUG = '2026-11-19-tech-table'
const BUILDING_ENTRY_CUTOFF_UTC = Date.parse('2026-11-19T05:00:00.000Z')
const MAX_BODY_BYTES = 16 * 1024
const SIGNUP_SUCCESS_BODY = {
  message: 'Thanks — your preferences have been saved.',
  ok: true,
} as const
const RSVP_SUCCESS_BODY = {
  message: 'Thanks — your RSVP has been saved.',
  ok: true,
} as const

const ATTENDANCE_MODES = new Set([
  'in_person_full_event',
  'in_person_program_only',
  'virtual_program_only',
  'in_person_happy_hour_only',
] as const)
const LAB_INTEREST_CHOICES = new Set(['yes', 'no', 'unsure'] as const)
const CM_CREDIT_CHOICES = new Set(['yes', 'no'] as const)

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

type SignupInput = {
  committeeEmails: boolean
  consent: true
  email: string
  eventNotifications: boolean
  name: string | null
  turnstileToken: string
}

type AttendanceMode =
  | 'in_person_full_event'
  | 'in_person_program_only'
  | 'virtual_program_only'
  | 'in_person_happy_hour_only'
type LabInterest = 'yes' | 'no' | 'unsure'
type CmCredit = 'yes' | 'no'

type EventRsvpInput = {
  attendanceMode: AttendanceMode
  cmCredit: CmCredit | null
  email: string
  eventSlug: typeof NOVEMBER_EVENT_SLUG
  fullName: string
  labInterest: LabInterest | null
  turnstileToken: string
}

type TurnstileResponse = {
  action?: string
  hostname?: string
  success?: boolean
}

function csvSet(value: string): Set<string> {
  return new Set(value.split(',').map((item) => item.trim()).filter(Boolean))
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('origin')
  return origin && csvSet(env.ALLOWED_ORIGINS).has(origin) ? origin : null
}

function responseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    vary: 'Origin',
  })
  if (origin) headers.set('access-control-allow-origin', origin)
  return headers
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = responseHeaders(origin)
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value)
  return Response.json(body, { headers, status })
}

function normalizeEmail(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase()
}

function normalizeName(value: string): string | null {
  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ')
  return normalized || null
}

function requiredTurnstileToken(body: Record<string, unknown>): string {
  const token = body.turnstileToken
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048) {
    throw new RequestError(400, 'Please check the form and try again.')
  }
  return token
}

function parseSignup(value: unknown): SignupInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(400, 'Please check the form and try again.')
  }

  const body = value as Record<string, unknown>
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const name = typeof body.name === 'string' ? normalizeName(body.name) : null
  const committeeEmails = body.committeeEmails
  const eventNotifications = body.eventNotifications

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (name?.length ?? 0) > 120 ||
    typeof committeeEmails !== 'boolean' ||
    typeof eventNotifications !== 'boolean' ||
    (!committeeEmails && !eventNotifications) ||
    body.consent !== true
  ) {
    throw new RequestError(400, 'Please check the form and try again.')
  }

  return {
    committeeEmails,
    consent: true,
    email,
    eventNotifications,
    name,
    turnstileToken: requiredTurnstileToken(body),
  }
}

function optionalChoice<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
): T | null | undefined {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' && allowed.has(value as T) ? value as T : undefined
}

function parseEventRsvp(value: unknown): EventRsvpInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(400, 'Please check the form and try again.')
  }

  const body = value as Record<string, unknown>
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const fullName = typeof body.fullName === 'string' ? normalizeName(body.fullName) : null
  const attendanceMode = body.attendanceMode
  const labInterest = optionalChoice(body.labInterest, LAB_INTEREST_CHOICES)
  const cmCredit = optionalChoice(body.cmCredit, CM_CREDIT_CHOICES)

  if (
    body.eventSlug !== NOVEMBER_EVENT_SLUG ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !fullName ||
    fullName.length < 2 ||
    fullName.length > 120 ||
    typeof attendanceMode !== 'string' ||
    !ATTENDANCE_MODES.has(attendanceMode as AttendanceMode) ||
    labInterest === undefined ||
    cmCredit === undefined
  ) {
    throw new RequestError(400, 'Please check the form and try again.')
  }

  if (attendanceMode.startsWith('in_person_') && Date.now() >= BUILDING_ENTRY_CUTOFF_UTC) {
    throw new RequestError(
      409,
      'The November 18 building-entry deadline has passed. Please select virtual program attendance.',
    )
  }

  return {
    attendanceMode: attendanceMode as AttendanceMode,
    cmCredit,
    email,
    eventSlug: NOVEMBER_EVENT_SLUG,
    fullName,
    labInterest,
    turnstileToken: requiredTurnstileToken(body),
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength) {
    const length = Number(declaredLength)
    if (!Number.isFinite(length) || length < 0) throw new RequestError(400, 'Invalid request.')
    if (length > MAX_BODY_BYTES) throw new RequestError(413, 'Request is too large.')
  }

  if (!request.body) throw new RequestError(400, 'Please check the form and try again.')

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new RequestError(413, 'Request is too large.')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes))
  } catch {
    throw new RequestError(400, 'Please check the form and try again.')
  }
}

async function anonymousRateLimitKey(request: Request): Promise<string> {
  const fingerprint = [
    new URL(request.url).pathname,
    request.headers.get('cf-connecting-ip') ?? 'local',
    request.headers.get('user-agent') ?? 'unknown',
  ].join('\n')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyTurnstile(
  token: string,
  expectedAction: string,
  request: Request,
  env: Env,
): Promise<boolean> {
  const payload = new FormData()
  payload.set('secret', env.TURNSTILE_SECRET)
  payload.set('response', token)
  payload.set('idempotency_key', crypto.randomUUID())

  const remoteIp = request.headers.get('cf-connecting-ip')
  if (remoteIp) payload.set('remoteip', remoteIp)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    body: payload,
    method: 'POST',
  })
  if (!response.ok) return false

  const result = (await response.json()) as TurnstileResponse
  return (
    result.success === true &&
    result.action === expectedAction &&
    typeof result.hostname === 'string' &&
    csvSet(env.TURNSTILE_HOSTNAMES).has(result.hostname)
  )
}

async function saveSignup(input: SignupInput, env: Env): Promise<void> {
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO signups (
      id,
      email_normalized,
      name,
      committee_emails,
      event_notifications,
      consent_at,
      consent_version,
      consent_source,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email_normalized) DO UPDATE SET
      name = excluded.name,
      committee_emails = excluded.committee_emails,
      event_notifications = excluded.event_notifications,
      consent_at = excluded.consent_at,
      consent_version = excluded.consent_version,
      consent_source = excluded.consent_source,
      status = CASE
        WHEN signups.status = 'suppressed' THEN signups.status
        ELSE excluded.status
      END,
      updated_at = excluded.updated_at`,
  )
    .bind(
      crypto.randomUUID(),
      input.email,
      input.name,
      Number(input.committeeEmails),
      Number(input.eventNotifications),
      now,
      env.CONSENT_VERSION,
      env.CONSENT_SOURCE,
      env.SIGNUP_STATUS,
      now,
      now,
    )
    .run()
}

async function saveEventRsvp(input: EventRsvpInput, env: Env): Promise<void> {
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO event_rsvps (
      id,
      event_slug,
      email_normalized,
      full_name,
      attendance_mode,
      lab_interest,
      cm_credit,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(event_slug, email_normalized) DO UPDATE SET
      full_name = excluded.full_name,
      attendance_mode = excluded.attendance_mode,
      lab_interest = excluded.lab_interest,
      cm_credit = excluded.cm_credit,
      updated_at = excluded.updated_at`,
  )
    .bind(
      crypto.randomUUID(),
      input.eventSlug,
      input.email,
      input.fullName,
      input.attendanceMode,
      input.labInterest,
      input.cmCredit,
      now,
      now,
    )
    .run()
}

async function rateLimit(request: Request, env: Env, origin: string): Promise<Response | null> {
  const result = await env.SIGNUP_RATE_LIMITER.limit({
    key: await anonymousRateLimitKey(request),
  })
  if (result.success) return null
  return jsonResponse(429, { message: 'Please wait before trying again.', ok: false }, origin, {
    'retry-after': '60',
  })
}

async function handleSignup(request: Request, env: Env, origin: string): Promise<Response> {
  const limited = await rateLimit(request, env, origin)
  if (limited) return limited

  const input = parseSignup(await readBoundedJson(request))
  if (!(await verifyTurnstile(input.turnstileToken, env.TURNSTILE_EXPECTED_ACTION, request, env))) {
    return jsonResponse(400, { message: 'Please refresh the verification and try again.', ok: false }, origin)
  }

  await saveSignup(input, env)
  console.log(JSON.stringify({ event: 'signup_saved', requestId: crypto.randomUUID() }))
  return jsonResponse(200, SIGNUP_SUCCESS_BODY, origin)
}

async function handleEventRsvp(request: Request, env: Env, origin: string): Promise<Response> {
  const limited = await rateLimit(request, env, origin)
  if (limited) return limited

  const input = parseEventRsvp(await readBoundedJson(request))
  if (!(await verifyTurnstile(input.turnstileToken, 'event-rsvp', request, env))) {
    return jsonResponse(400, { message: 'Please refresh the verification and try again.', ok: false }, origin)
  }

  await saveEventRsvp(input, env)
  console.log(JSON.stringify({ event: 'event_rsvp_saved', requestId: crypto.randomUUID() }))
  return jsonResponse(200, RSVP_SUCCESS_BODY, origin)
}

const worker = {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== SIGNUP_PATH && url.pathname !== EVENT_RSVP_PATH) {
      return jsonResponse(404, { message: 'Not found.', ok: false }, null)
    }

    const origin = allowedOrigin(request, env)
    if (request.method === 'OPTIONS') {
      if (!origin) return jsonResponse(403, { message: 'Origin not allowed.', ok: false }, null)
      return new Response(null, {
        headers: {
          'access-control-allow-headers': 'Content-Type',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-origin': origin,
          'access-control-max-age': '86400',
          vary: 'Origin',
        },
        status: 204,
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse(405, { message: 'Method not allowed.', ok: false }, origin, {
        allow: 'POST, OPTIONS',
      })
    }
    if (!origin) return jsonResponse(403, { message: 'Origin not allowed.', ok: false }, null)
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return jsonResponse(415, { message: 'Content-Type must be application/json.', ok: false }, origin)
    }

    try {
      return url.pathname === SIGNUP_PATH
        ? await handleSignup(request, env, origin)
        : await handleEventRsvp(request, env, origin)
    } catch (error) {
      if (error instanceof RequestError) {
        return jsonResponse(error.status, { message: error.message, ok: false }, origin)
      }
      console.error(JSON.stringify({ event: 'request_failed', requestId: crypto.randomUUID() }))
      return jsonResponse(500, { message: 'Please try again later.', ok: false }, origin)
    }
  },
} satisfies ExportedHandler<Env>

export default worker

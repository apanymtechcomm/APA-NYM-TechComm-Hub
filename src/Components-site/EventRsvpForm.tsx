'use client'

import React, { type FormEvent, useEffect, useRef, useState } from 'react'

type EventRsvpFormProps = {
  apiUrl: string
  turnstileSiteKey: string
}

type ApiResult = {
  message?: string
  ok?: boolean
}

type AttendanceMode =
  | 'in_person_full_event'
  | 'in_person_program_only'
  | 'virtual_program_only'
  | 'in_person_happy_hour_only'

type OptionalChoice = '' | 'yes' | 'no'
type LabInterest = OptionalChoice | 'unsure'

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

const ATTENDANCE_OPTIONS: Array<{ label: string; value: AttendanceMode }> = [
  { label: 'In person — full event (program and happy hour)', value: 'in_person_full_event' },
  { label: 'In person — program only', value: 'in_person_program_only' },
  { label: 'Virtual — program only', value: 'virtual_program_only' },
  { label: 'In person — happy hour only', value: 'in_person_happy_hour_only' },
]

export function EventRsvpForm({ apiUrl, turnstileSiteKey }: EventRsvpFormProps) {
  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode | ''>('')
  const [cmCredit, setCmCredit] = useState<OptionalChoice>('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [labInterest, setLabInterest] = useState<LabInterest>('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    if (!apiUrl || !turnstileSiteKey) return

    let disposed = false
    const renderWidget = () => {
      if (disposed || !window.turnstile || !widgetContainerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
        action: 'event-rsvp',
        callback: setTurnstileToken,
        'error-callback': () => setTurnstileToken(''),
        'expired-callback': () => setTurnstileToken(''),
        sitekey: turnstileSiteKey,
        theme: 'light',
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = TURNSTILE_SCRIPT_ID
        script.async = true
        script.defer = true
        script.src = TURNSTILE_SCRIPT_URL
        document.head.appendChild(script)
      }
      script.addEventListener('load', renderWidget)
    }

    return () => {
      disposed = true
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [apiUrl, turnstileSiteKey])

  function resetTurnstile() {
    setTurnstileToken('')
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!turnstileToken) {
      setStatus('error')
      setMessage('Please complete the verification and try again.')
      return
    }

    setStatus('submitting')
    try {
      const response = await fetch(apiUrl, {
        body: JSON.stringify({
          attendanceMode,
          cmCredit: cmCredit || null,
          email,
          eventSlug: '2026-11-19-tech-table',
          fullName,
          labInterest: labInterest || null,
          turnstileToken,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json().catch(() => ({}))) as ApiResult

      if (!response.ok || result.ok !== true) {
        setStatus('error')
        setMessage(result.message || 'Please try again.')
        resetTurnstile()
        return
      }

      setStatus('success')
      setMessage(result.message || 'Thanks — your RSVP has been saved.')
      setAttendanceMode('')
      setCmCredit('')
      setEmail('')
      setFullName('')
      setLabInterest('')
      resetTurnstile()
    } catch {
      setStatus('error')
      setMessage('The RSVP service is unavailable. Please try again later.')
      resetTurnstile()
    }
  }

  if (!apiUrl || !turnstileSiteKey) {
    return (
      <p className="signup-config-notice">
        Online RSVP is being configured. Please check back before the November 18 building-entry deadline.
      </p>
    )
  }

  return (
    <form className="signup-form event-rsvp-form" onSubmit={submit}>
      <div className="signup-field">
        <label htmlFor="event-rsvp-email">Email address</label>
        <input
          autoComplete="email"
          id="event-rsvp-email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="signup-field">
        <label htmlFor="event-rsvp-name">Full name exactly as it should appear for building entry</label>
        <input
          autoComplete="name"
          id="event-rsvp-name"
          maxLength={120}
          minLength={2}
          onChange={(event) => setFullName(event.target.value)}
          required
          type="text"
          value={fullName}
        />
      </div>

      <fieldset className="signup-preferences">
        <legend>Attendance mode (required)</legend>
        {ATTENDANCE_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              checked={attendanceMode === option.value}
              name="attendance-mode"
              onChange={() => setAttendanceMode(option.value)}
              required
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <div className="signup-field">
        <label htmlFor="event-rsvp-lab-interest">Interested in the hands-on lab? (optional)</label>
        <select
          id="event-rsvp-lab-interest"
          onChange={(event) => setLabInterest(event.target.value as LabInterest)}
          value={labInterest}
        >
          <option value="">No response</option>
          <option value="yes">Yes</option>
          <option value="no">Not this time</option>
          <option value="unsure">Not sure yet</option>
        </select>
      </div>

      <div className="signup-field">
        <label htmlFor="event-rsvp-cm-credit">Will you claim the 1 CM credit? (optional)</label>
        <select
          id="event-rsvp-cm-credit"
          onChange={(event) => setCmCredit(event.target.value as OptionalChoice)}
          value={cmCredit}
        >
          <option value="">No response</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <p className="signup-privacy-note">
        This RSVP is used for event planning and the confidential building-entry roster. It does not subscribe you to committee emails or event announcements.
      </p>

      <div aria-label="Spam verification" className="signup-turnstile" ref={widgetContainerRef} />

      <button className="signup-submit" disabled={status === 'submitting'} type="submit">
        {status === 'submitting' ? 'Saving…' : 'Submit RSVP'}
      </button>

      {message && (
        <p className={`signup-message ${status}`} role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </form>
  )
}

'use client'

import React, { type FormEvent, useEffect, useRef, useState } from 'react'

type SignupFormProps = {
  apiUrl: string
  turnstileSiteKey: string
}

type ApiResult = {
  message?: string
  ok?: boolean
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export function SignupForm({ apiUrl, turnstileSiteKey }: SignupFormProps) {
  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [committeeEmails, setCommitteeEmails] = useState(true)
  const [consent, setConsent] = useState(false)
  const [email, setEmail] = useState('')
  const [eventNotifications, setEventNotifications] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    if (!apiUrl || !turnstileSiteKey) return

    let disposed = false
    const renderWidget = () => {
      if (disposed || !window.turnstile || !widgetContainerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
        action: 'signup',
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
          committeeEmails,
          consent,
          email,
          eventNotifications,
          name,
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
      setMessage(result.message || 'Thanks — your preferences have been saved.')
      setEmail('')
      setName('')
      setConsent(false)
      resetTurnstile()
    } catch {
      setStatus('error')
      setMessage('The signup service is unavailable. Please try again later.')
      resetTurnstile()
    }
  }

  if (!apiUrl || !turnstileSiteKey) {
    return (
      <p className="signup-config-notice">
        Online signup is being configured. In the meantime, email{' '}
        <a href="mailto:apa.techcomm@gmail.com">apa.techcomm@gmail.com</a>.
      </p>
    )
  }

  return (
    <form className="signup-form" onSubmit={submit}>
      <div className="signup-field">
        <label htmlFor="signup-email">Email address</label>
        <input
          autoComplete="email"
          id="signup-email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="signup-field">
        <label htmlFor="signup-name">Name (optional)</label>
        <input
          autoComplete="name"
          id="signup-name"
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          type="text"
          value={name}
        />
      </div>

      <fieldset className="signup-preferences">
        <legend>What would you like to receive?</legend>
        <label>
          <input
            checked={committeeEmails}
            onChange={(event) => setCommitteeEmails(event.target.checked)}
            type="checkbox"
          />
          Committee emails
        </label>
        <label>
          <input
            checked={eventNotifications}
            onChange={(event) => setEventNotifications(event.target.checked)}
            type="checkbox"
          />
          Event notifications
        </label>
      </fieldset>

      <label className="signup-consent">
        <input checked={consent} onChange={(event) => setConsent(event.target.checked)} required type="checkbox" />
        I consent to the committee storing this information for these communications.
      </label>
      <p className="signup-privacy-note">
        Your details are stored in a confidential database and are not published on this site.
      </p>

      <div aria-label="Spam verification" className="signup-turnstile" ref={widgetContainerRef} />

      <button className="signup-submit" disabled={status === 'submitting'} type="submit">
        {status === 'submitting' ? 'Saving…' : 'Save my preferences'}
      </button>

      {message && (
        <p className={`signup-message ${status}`} role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </form>
  )
}

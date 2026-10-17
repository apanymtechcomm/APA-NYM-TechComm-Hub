import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EventRsvpForm } from '@/Components-site/EventRsvpForm'

type TurnstileOptions = {
  action: string
  callback: (token: string) => void
  'error-callback': () => void
  'expired-callback': () => void
  sitekey: string
}

let turnstileOptions: TurnstileOptions

afterEach(cleanup)

beforeEach(() => {
  vi.restoreAllMocks()
  turnstileOptions = undefined as unknown as TurnstileOptions
  Object.assign(window, {
    turnstile: {
      remove: vi.fn(),
      render: vi.fn((_element: HTMLElement, options: TurnstileOptions) => {
        turnstileOptions = options
        options.callback('turnstile-token')
        return 'widget-id'
      }),
      reset: vi.fn(),
    },
  })
})

describe('EventRsvpForm', () => {
  it('submits the required roster fields and optional event responses to the distinct endpoint', async () => {
    const request = vi.fn().mockResolvedValue(
      Response.json({ message: 'Thanks — your RSVP has been saved.', ok: true }),
    )
    vi.stubGlobal('fetch', request)

    render(
      <EventRsvpForm
        apiUrl="https://signup.example.test/v1/event-rsvps"
        turnstileSiteKey="public-site-key"
      />,
    )

    await waitFor(() => expect(turnstileOptions.action).toBe('event-rsvp'))
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'planner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Full name exactly as it should appear for building entry'), {
      target: { value: 'Ada Planner' },
    })
    fireEvent.click(screen.getByLabelText('In person — full event (program and happy hour)'))
    fireEvent.change(screen.getByLabelText('Interested in the hands-on lab? (optional)'), {
      target: { value: 'yes' },
    })
    fireEvent.change(screen.getByLabelText('Will you claim the 1 CM credit? (optional)'), {
      target: { value: 'no' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Submit RSVP' }).closest('form')!)

    await screen.findByText('Thanks — your RSVP has been saved.')
    expect(request).toHaveBeenCalledWith(
      'https://signup.example.test/v1/event-rsvps',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(String(request.mock.calls[0][1].body))
    expect(body).toEqual({
      attendanceMode: 'in_person_full_event',
      cmCredit: 'no',
      email: 'planner@example.com',
      eventSlug: '2026-11-19-tech-table',
      fullName: 'Ada Planner',
      labInterest: 'yes',
      turnstileToken: 'turnstile-token',
    })
    expect(JSON.stringify(body)).not.toContain('consent')
    expect(JSON.stringify(body)).not.toContain('committeeEmails')
    expect(JSON.stringify(body)).not.toContain('eventNotifications')
  })

  it('prominently labels every required attendance mode and does not require optional choices', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ ok: true }))
    vi.stubGlobal('fetch', request)
    render(
      <EventRsvpForm
        apiUrl="https://signup.example.test/v1/event-rsvps"
        turnstileSiteKey="public-site-key"
      />,
    )

    await waitFor(() => expect(turnstileOptions).toBeDefined())
    expect(screen.getByLabelText('In person — program only')).not.toBeNull()
    expect(screen.getByLabelText('Virtual — program only')).not.toBeNull()
    expect(screen.getByLabelText('In person — happy hour only')).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'a@example.com' } })
    fireEvent.change(screen.getByLabelText('Full name exactly as it should appear for building entry'), {
      target: { value: 'A Planner' },
    })
    fireEvent.click(screen.getByLabelText('Virtual — program only'))
    fireEvent.submit(screen.getByRole('button', { name: 'Submit RSVP' }).closest('form')!)

    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    const body = JSON.parse(String(request.mock.calls[0][1].body))
    expect(body.labInterest).toBeNull()
    expect(body.cmCredit).toBeNull()
  })

  it('renders a deadline-aware configuration notice when public settings are absent', () => {
    render(<EventRsvpForm apiUrl="" turnstileSiteKey="" />)
    expect(screen.getByText(/november 18 building-entry deadline/i)).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Submit RSVP' })).toBeNull()
  })
})

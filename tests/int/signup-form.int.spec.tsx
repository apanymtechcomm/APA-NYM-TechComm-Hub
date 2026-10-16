import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SignupForm } from '@/Components-site/SignupForm'

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

describe('SignupForm', () => {
  it('submits only the expected fields and shows generic success', async () => {
    const request = vi.fn().mockResolvedValue(
      Response.json({ message: 'Thanks — your preferences have been saved.', ok: true }),
    )
    vi.stubGlobal('fetch', request)

    render(
      <SignupForm
        apiUrl="https://signup.example.test/v1/signup"
        turnstileSiteKey="public-site-key"
      />,
    )

    await waitFor(() => expect(turnstileOptions.sitekey).toBe('public-site-key'))
    expect(turnstileOptions.action).toBe('signup')

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'planner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Name (optional)'), {
      target: { value: 'Ada Planner' },
    })
    fireEvent.click(screen.getByLabelText('Event notifications'))
    fireEvent.click(
      screen.getByLabelText('I consent to the committee storing this information for these communications.'),
    )
    fireEvent.submit(screen.getByRole('button', { name: 'Save my preferences' }).closest('form')!)

    await screen.findByText('Thanks — your preferences have been saved.')
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(
      'https://signup.example.test/v1/signup',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(String(request.mock.calls[0][1].body))
    expect(body).toEqual({
      committeeEmails: true,
      consent: true,
      email: 'planner@example.com',
      eventNotifications: true,
      name: 'Ada Planner',
      turnstileToken: 'turnstile-token',
    })
    expect(JSON.stringify(body)).not.toContain('consentVersion')
    expect(JSON.stringify(body)).not.toContain('status')
  })

  it('renders a deployment-safe configuration notice when public settings are absent', () => {
    render(<SignupForm apiUrl="" turnstileSiteKey="" />)
    expect(screen.getByText(/online signup is being configured/i)).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Save my preferences' })).toBeNull()
  })

  it('keeps the submitted details after an API error and resets Turnstile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ message: 'Please try again.' }, { status: 400 })),
    )
    render(
      <SignupForm
        apiUrl="https://signup.example.test/v1/signup"
        turnstileSiteKey="public-site-key"
      />,
    )

    await waitFor(() => expect(turnstileOptions).toBeDefined())
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'planner@example.com' },
    })
    fireEvent.click(
      screen.getByLabelText('I consent to the committee storing this information for these communications.'),
    )
    fireEvent.submit(screen.getByRole('button', { name: 'Save my preferences' }).closest('form')!)

    await screen.findByText('Please try again.')
    expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('planner@example.com')
    expect(window.turnstile?.reset).toHaveBeenCalledWith('widget-id')
  })
})

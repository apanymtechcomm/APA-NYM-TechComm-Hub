export {}

declare global {
  type TurnstileRenderOptions = {
    action: string
    callback: (token: string) => void
    'error-callback': () => void
    'expired-callback': () => void
    sitekey: string
    theme?: 'auto' | 'light' | 'dark'
  }

  interface Window {
    turnstile?: {
      remove: (widgetId: string) => void
      render: (element: HTMLElement, options: TurnstileRenderOptions) => string
      reset: (widgetId: string) => void
    }
  }
}

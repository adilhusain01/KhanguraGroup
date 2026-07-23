import { useEffect, useState } from 'react'
import { readAnalyticsConsent, saveAnalyticsConsent } from '../lib/analytics'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as
  string | undefined
export function AnalyticsConsent() {
  const [consent, setConsent] = useState(readAnalyticsConsent)
  useEffect(() => {
    const sync = () => setConsent(readAnalyticsConsent())
    window.addEventListener('kg-analytics-consent', sync)
    return () => window.removeEventListener('kg-analytics-consent', sync)
  }, [])
  useEffect(() => {
    if (
      !measurementId ||
      consent !== 'granted' ||
      document.getElementById('ga4-script')
    )
      return
    const script = document.createElement('script')
    script.id = 'ga4-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.appendChild(script)
    window.gtag = (...args: unknown[]) => {
      const analyticsWindow = window as Window & { dataLayer?: unknown[] }
      analyticsWindow.dataLayer ??= []
      analyticsWindow.dataLayer.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      send_page_view: true,
      anonymize_ip: true,
    })
  }, [consent])
  if (!measurementId || consent) return null
  return (
    <aside
      className="consent-banner"
      role="dialog"
      aria-label="Analytics preference"
    >
      <p>
        We use optional, privacy-safe analytics to understand site usage. It
        never receives enquiry or application details.
      </p>
      <div>
        <button
          className="button light"
          onClick={() => saveAnalyticsConsent('denied')}
        >
          Decline
        </button>
        <button
          className="button orange"
          onClick={() => saveAnalyticsConsent('granted')}
        >
          Accept analytics
        </button>
      </div>
    </aside>
  )
}

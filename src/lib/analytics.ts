const consentKey = 'kg-analytics-consent'
export type AnalyticsConsent = 'granted' | 'denied' | null
export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(consentKey)
  return value === 'granted' || value === 'denied' ? value : null
}
export function saveAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  localStorage.setItem(consentKey, value)
  window.dispatchEvent(new Event('kg-analytics-consent'))
}
export function track(
  event: string,
  parameters: Record<string, string | number | boolean | undefined> = {},
) {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'granted')
    return
  window.gtag?.('event', event, parameters)
}
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

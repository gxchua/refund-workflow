// Add a country here when the back office goes live there.
const COUNTRY_LOCALES: Record<string, string> = {
  MY: 'en-MY',
}

const DEFAULT_LOCALE = 'en'

export function getLocale(country: string): string {
  return COUNTRY_LOCALES[country] ?? DEFAULT_LOCALE
}

export function getCountryName(country: string, locale: string): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(country) ?? country
}

/** Times come from the API in UTC and are shown in the device's own timezone. */
export function formatDateTime(isoTime: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTime))
}

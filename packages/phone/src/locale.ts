import { isSupportedCountry } from 'libphonenumber-js/min'
import type { CountryCode } from './countries'

const LAST_RESORT_LOCALE = 'en'

export function resolveLocale(candidates: ReadonlyArray<string | null | undefined>): string {
  for (const candidate of candidates) {
    const locale = canonicalLocale(candidate)
    if (locale) return locale
  }
  return LAST_RESORT_LOCALE
}

export interface DefaultCountryOptions {
  defaultCountry?: string | null
  navigatorLanguage?: string | null
  onlyCountries?: readonly string[]
  preferredCountries?: readonly string[]
}

export function resolveDefaultCountry(options: DefaultCountryOptions): CountryCode | '' {
  const onlyCountries = normalizeCountryList(options.onlyCountries)
  const isAllowed = (code: CountryCode): boolean =>
    onlyCountries.length === 0 || onlyCountries.includes(code)

  const candidate =
    toCountryCode(options.defaultCountry) || regionOfLanguage(options.navigatorLanguage)

  if (!candidate) return ''
  if (isAllowed(candidate)) return candidate

  return normalizeCountryList(options.preferredCountries).find(isAllowed) ?? ''
}

function canonicalLocale(candidate: string | null | undefined): string | undefined {
  if (!candidate?.trim()) return undefined
  try {
    return Intl.getCanonicalLocales(candidate.trim())[0]
  } catch {
    return undefined
  }
}

function regionOfLanguage(language: string | null | undefined): CountryCode | '' {
  const locale = canonicalLocale(language)
  if (!locale) return ''
  const parsed = new Intl.Locale(locale)
  return toCountryCode(parsed.region ?? parsed.maximize().region)
}

function toCountryCode(value: string | null | undefined): CountryCode | '' {
  const code = value?.trim().toUpperCase() ?? ''
  return isSupportedCountry(code) ? code : ''
}

function normalizeCountryList(values: readonly string[] | undefined): CountryCode[] {
  return (values ?? []).map(toCountryCode).filter((code): code is CountryCode => code !== '')
}

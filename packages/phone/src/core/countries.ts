import {
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
} from 'libphonenumber-js/min'

export type { CountryCode }

export interface Country {
  code: CountryCode
  callingCode: string
  name: string
}

export interface ParsedCountryCodes {
  codes: CountryCode[]
  invalid: string[]
}

export function parseCountryCodes(value: string | null | undefined): ParsedCountryCodes {
  const parsed: ParsedCountryCodes = { codes: [], invalid: [] }

  for (const token of (value ?? '').split(/[\s,]+/).filter(Boolean)) {
    const code = token.toUpperCase()
    if (!isSupportedCountry(code)) parsed.invalid.push(token)
    else if (!parsed.codes.includes(code)) parsed.codes.push(code)
  }

  return parsed
}

export function describeCountry(code: CountryCode, locale: string): string {
  const name = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' }).of(code) ?? code
  return `${name} +${getCountryCallingCode(code)}`
}

export function listCountries(locale: string): Country[] {
  const regionNames = new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' })
  const byLocalizedName = new Intl.Collator(locale).compare

  return getCountries()
    .map((code) => ({
      code,
      callingCode: getCountryCallingCode(code),
      name: regionNames.of(code) ?? code,
    }))
    .sort((a, b) => byLocalizedName(a.name, b.name))
}

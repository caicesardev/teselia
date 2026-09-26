import { type CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js/min'

export type { CountryCode }

export interface Country {
  code: CountryCode
  callingCode: string
  name: string
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

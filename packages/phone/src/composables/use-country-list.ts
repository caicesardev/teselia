import { type ComputedRef, computed, watchEffect } from 'vue'
import { type Country, type CountryCode, listCountries, parseCountryCodes } from '../core/countries'
import type { ResolvedTesPhoneProps } from '../props'

export interface CountryList {
  countries: ComputedRef<Country[]>
  suggestedCountries: ComputedRef<Country[]>
  allowedCodes: ComputedRef<CountryCode[]>
  preferredCodes: ComputedRef<CountryCode[]>
  isAllowed: (code: CountryCode) => boolean
}

export function useCountryList(props: ResolvedTesPhoneProps, locale: ComputedRef<string>): CountryList {
  const onlyCountries = computed(() => parseCountryCodes(props.onlyCountries))
  const preferredCountries = computed(() => parseCountryCodes(props.preferredCountries))

  if (import.meta.env.DEV) warnAboutUnsupportedCodes(onlyCountries, preferredCountries)

  const allowedCodes = computed(() => onlyCountries.value.codes)
  const isAllowed = (code: CountryCode): boolean =>
    allowedCodes.value.length === 0 || allowedCodes.value.includes(code)

  const countries = computed(() => listCountries(locale.value).filter((country) => isAllowed(country.code)))

  const suggestedCountries = computed(() =>
    preferredCountries.value.codes
      .map((code) => countries.value.find((country) => country.code === code))
      .filter((country): country is Country => country !== undefined),
  )

  return {
    countries,
    suggestedCountries,
    allowedCodes,
    preferredCodes: computed(() => preferredCountries.value.codes),
    isAllowed,
  }
}

function warnAboutUnsupportedCodes(
  onlyCountries: ComputedRef<{ invalid: string[] }>,
  preferredCountries: ComputedRef<{ invalid: string[] }>,
): void {
  watchEffect(() => {
    for (const [attribute, parsed] of [
      ['only-countries', onlyCountries.value],
      ['preferred-countries', preferredCountries.value],
    ] as const) {
      if (parsed.invalid.length > 0) {
        console.warn(`[tes-phone] Ignoring unsupported codes in \`${attribute}\`: ${parsed.invalid.join(', ')}`)
      }
    }
  })
}

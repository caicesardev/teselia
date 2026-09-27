export interface TesPhoneProps {
  label?: string
  required?: boolean
  readonly?: boolean
  hint?: string
  defaultCountry?: string
  autocomplete?: string
  preferredCountries?: string
  onlyCountries?: string
  textCountry?: string
  textSuggested?: string
  textResults?: string
  textNoResults?: string
  textRequired?: string
  textInvalid?: string
  textCountryRequired?: string
  textCountryChanged?: string
  textNotAllowed?: string
}

export const TES_PHONE_DEFAULTS = {
  autocomplete: 'tel',
  textCountry: 'Country code',
  textSuggested: 'Suggested',
  textResults: 'Countries available: {count}',
  textNoResults: 'No countries found',
  textRequired: 'Enter a phone number',
  textInvalid: 'Enter a valid phone number for {country}',
  textCountryRequired: 'Select a country code',
  textCountryChanged: 'Country set to {country}',
  textNotAllowed: 'Numbers from {country} are not accepted',
}

export type ResolvedTesPhoneProps = Readonly<TesPhoneProps & typeof TES_PHONE_DEFAULTS>

import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import type { CountryCode } from './countries'

export interface InterpretedPhoneNumber {
  e164: string
  nationalNumber: string
  valid: boolean
  detectedCountry: CountryCode | ''
}

export function interpretPhoneNumber(input: string, country: CountryCode | ''): InterpretedPhoneNumber {
  const parsed = parsePhoneNumberFromString(input, country || undefined)
  if (!parsed) {
    return { e164: '', nationalNumber: input.trim(), valid: false, detectedCountry: '' }
  }

  return {
    e164: parsed.number,
    nationalNumber: parsed.formatNational(),
    valid: parsed.isValid(),
    detectedCountry: parsed.country ?? '',
  }
}

export interface SplitE164 {
  country: CountryCode
  nationalNumber: string
}

export function splitE164(value: string): SplitE164 | null {
  const parsed = parsePhoneNumberFromString(value)
  if (!parsed?.country) return null
  return { country: parsed.country, nationalNumber: parsed.formatNational() }
}

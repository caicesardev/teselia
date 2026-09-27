import { isSupportedCountry } from 'libphonenumber-js/min'
import type { CountryCode } from './countries'

function isRestorableCountry(country: string): boolean {
  return country === '' || isSupportedCountry(country)
}

export interface SavedFormState {
  nationalInput: string
  country: CountryCode | ''
}

export function serializeFormState(state: SavedFormState): string {
  return JSON.stringify({ nationalInput: state.nationalInput, country: state.country })
}

export function parseSavedFormState(saved: string): SavedFormState | null {
  try {
    const parsed: unknown = JSON.parse(saved)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as SavedFormState).nationalInput === 'string' &&
      typeof (parsed as SavedFormState).country === 'string' &&
      isRestorableCountry((parsed as SavedFormState).country)
    ) {
      return parsed as SavedFormState
    }
  } catch {
    return null
  }
  return null
}

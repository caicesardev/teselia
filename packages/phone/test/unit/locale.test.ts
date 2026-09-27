import { describe, expect, it } from 'vitest'
import { resolveDefaultCountry, resolveLocale } from '../../src/core/locale'

describe('resolveLocale', () => {
  it('uses the first candidate that is a valid language tag', () => {
    expect(resolveLocale(['pt-BR', 'es', 'en'])).toBe('pt-BR')
  })

  it('skips missing, empty and blank candidates', () => {
    expect(resolveLocale([undefined, null, '', '   ', 'fr'])).toBe('fr')
  })

  it('skips malformed language tags', () => {
    expect(resolveLocale(['not a locale!', 'de-AT'])).toBe('de-AT')
  })

  it('canonicalizes the chosen tag', () => {
    expect(resolveLocale(['EN-gb'])).toBe('en-GB')
  })

  it('falls back to English when no candidate is usable', () => {
    expect(resolveLocale([])).toBe('en')
    expect(resolveLocale(['', 'not a locale!'])).toBe('en')
  })
})

describe('resolveDefaultCountry', () => {
  it('prefers the default-country attribute, case-insensitively', () => {
    expect(resolveDefaultCountry({ defaultCountry: 'pt', navigatorLanguage: 'es-ES' })).toBe('PT')
  })

  it('ignores an unsupported default-country and uses the browser language', () => {
    expect(resolveDefaultCountry({ defaultCountry: 'XX', navigatorLanguage: 'fr-CA' })).toBe('CA')
  })

  it('uses the explicit region of the browser language', () => {
    expect(resolveDefaultCountry({ navigatorLanguage: 'en-GB' })).toBe('GB')
  })

  it('infers the likely region when the browser language has none', () => {
    expect(resolveDefaultCountry({ navigatorLanguage: 'es' })).toBe('ES')
    expect(resolveDefaultCountry({ navigatorLanguage: 'en' })).toBe('US')
    expect(resolveDefaultCountry({ navigatorLanguage: 'ja' })).toBe('JP')
  })

  it('returns no country when nothing can be resolved', () => {
    expect(resolveDefaultCountry({})).toBe('')
    expect(resolveDefaultCountry({ navigatorLanguage: 'not a locale!' })).toBe('')
  })

  it('returns no country for a language whose region has no phone metadata', () => {
    expect(resolveDefaultCountry({ navigatorLanguage: 'en-001' })).toBe('')
  })

  it('keeps the resolved country when only-countries allows it', () => {
    expect(
      resolveDefaultCountry({ navigatorLanguage: 'es-ES', onlyCountries: ['ES', 'PT'] }),
    ).toBe('ES')
  })

  it('falls back to the first allowed preferred country when the resolved one is excluded', () => {
    expect(
      resolveDefaultCountry({
        navigatorLanguage: 'en-US',
        onlyCountries: ['es', 'pt', 'fr'],
        preferredCountries: ['DE', 'pt', 'fr'],
      }),
    ).toBe('PT')
  })

  it('returns no country when the resolved one is excluded and no preferred country is allowed', () => {
    expect(resolveDefaultCountry({ navigatorLanguage: 'en-US', onlyCountries: ['ES'] })).toBe('')
    expect(
      resolveDefaultCountry({
        navigatorLanguage: 'en-US',
        onlyCountries: ['ES'],
        preferredCountries: ['FR'],
      }),
    ).toBe('')
  })

  it('ignores unsupported codes in only-countries', () => {
    expect(resolveDefaultCountry({ navigatorLanguage: 'es-ES', onlyCountries: ['XX'] })).toBe('ES')
  })
})

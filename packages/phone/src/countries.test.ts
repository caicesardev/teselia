import { getCountries } from 'libphonenumber-js/min'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listCountries } from './countries'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listCountries', () => {
  it('lists every region supported by the phone metadata exactly once', () => {
    const codes = listCountries('en').map((country) => country.code)

    expect(codes).toHaveLength(getCountries().length)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('pairs each region with its calling code and English name', () => {
    const countries = listCountries('en')

    expect(countries).toContainEqual({ code: 'ES', callingCode: '34', name: 'Spain' })
    expect(countries).toContainEqual({ code: 'US', callingCode: '1', name: 'United States' })
    expect(countries).toContainEqual({ code: 'GB', callingCode: '44', name: 'United Kingdom' })
  })

  it('localizes names to the requested locale', () => {
    const countries = listCountries('es')

    expect(countries).toContainEqual({ code: 'ES', callingCode: '34', name: 'España' })
    expect(countries).toContainEqual({ code: 'DE', callingCode: '49', name: 'Alemania' })
  })

  it('sorts by localized name with locale collation, not by code points', () => {
    const names = listCountries('en').map((country) => country.name)
    const indexOf = (name: string): number => names.indexOf(name)

    expect(indexOf('Åland Islands')).toBeLessThan(indexOf('Albania'))
    expect(indexOf('Åland Islands')).toBeLessThan(indexOf('Zimbabwe'))
  })

  it('sorts differently for different locales', () => {
    const firstIn = (locale: string): string | undefined => listCountries(locale)[0]?.name

    expect(firstIn('en')).toBe('Afghanistan')
    expect(firstIn('es')).toBe('Afganistán')
  })

  it('falls back to the region code when the platform has no name for it', () => {
    const originalOf = Intl.DisplayNames.prototype.of
    vi.spyOn(Intl.DisplayNames.prototype, 'of').mockImplementation(function (
      this: Intl.DisplayNames,
      code: string,
    ) {
      return code === 'XK' ? undefined : originalOf.call(this, code)
    })

    expect(listCountries('en')).toContainEqual({ code: 'XK', callingCode: '383', name: 'XK' })
  })
})

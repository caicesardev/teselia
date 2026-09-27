import { describe, expect, it } from 'vitest'
import { listCountries } from '../../src/core/countries'
import { filterCountries } from '../../src/core/filter'

const english = listCountries('en')
const spanish = listCountries('es')

const codes = (countries: ReturnType<typeof filterCountries>): string[] =>
  countries.map((country) => country.code)

describe('filterCountries', () => {
  it('returns every country, in the same order, for an empty or blank query', () => {
    expect(filterCountries(english, '')).toEqual(english)
    expect(filterCountries(english, '   ')).toEqual(english)
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterCountries(english, 'qqq')).toEqual([])
  })

  describe('by name', () => {
    it('matches the beginning of the localized name', () => {
      expect(codes(filterCountries(spanish, 'esp', 'es'))).toContain('ES')
    })

    it('ignores case and diacritics in both directions', () => {
      expect(codes(filterCountries(spanish, 'espana', 'es'))).toEqual(['ES'])
      expect(codes(filterCountries(spanish, 'ESPAÑA', 'es'))).toEqual(['ES'])
      expect(codes(filterCountries(english, 'aland'))).toContain('AX')
    })

    it('matches any word of the name', () => {
      expect(codes(filterCountries(english, 'kingdom'))).toContain('GB')
    })

    it('matches text inside the name', () => {
      expect(codes(filterCountries(english, 'erman'))).toContain('DE')
    })

    it('ranks name starts before word starts before inner matches', () => {
      const results = codes(filterCountries(english, 'ir'))

      expect(results.indexOf('IE')).toBeLessThan(results.indexOf('KI'))
      expect(results.slice(0, 3)).toEqual(['IR', 'IQ', 'IE'])
    })

    it('keeps alphabetical order within the same rank', () => {
      expect(codes(filterCountries(english, 'united'))).toEqual(['AE', 'GB', 'US'])
    })
  })

  describe('by ISO code', () => {
    it('puts the exact ISO code match first, case-insensitively', () => {
      expect(codes(filterCountries(english, 'es'))[0]).toBe('ES')
      expect(codes(filterCountries(english, 'US'))[0]).toBe('US')
    })
  })

  describe('by calling code', () => {
    it('matches with or without the plus sign', () => {
      expect(codes(filterCountries(english, '34'))).toEqual(['ES'])
      expect(codes(filterCountries(english, '+34'))).toEqual(['ES'])
      expect(codes(filterCountries(english, '+ 34'))).toEqual(['ES'])
    })

    it('narrows progressively by calling code prefix', () => {
      const startingWithThree = filterCountries(english, '3')

      expect(startingWithThree.length).toBeGreaterThan(1)
      expect(startingWithThree.every((country) => country.callingCode.startsWith('3'))).toBe(true)
    })

    it('lists every country that shares a calling code', () => {
      const plusOne = codes(filterCountries(english, '+1'))

      expect(plusOne).toEqual(expect.arrayContaining(['US', 'CA', 'JM']))
    })
  })
})

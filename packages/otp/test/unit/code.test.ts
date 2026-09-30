import { describe, expect, it } from 'vitest'
import { type CodeOptions, normalizeCode, resolveCodeOptions, resolveLength, resolveType } from '../../src/core/code'

const numeric: CodeOptions = { length: 6, type: 'numeric' }
const alphanumeric: CodeOptions = { length: 6, type: 'alphanumeric' }

describe('normalizeCode', () => {
  it('keeps digits', () => {
    expect(normalizeCode('123456', numeric)).toEqual({ value: '123456', rejectedCharacters: false })
  })

  it('removes spaces, hyphens and dots without reporting them as rejected', () => {
    expect(normalizeCode(' 123 456 ', numeric)).toEqual({ value: '123456', rejectedCharacters: false })
    expect(normalizeCode('123-456', numeric)).toEqual({ value: '123456', rejectedCharacters: false })
    expect(normalizeCode('12.34.56', numeric)).toEqual({ value: '123456', rejectedCharacters: false })
  })

  it('drops letters from a numeric code and reports them', () => {
    expect(normalizeCode('12a3', numeric)).toEqual({ value: '123', rejectedCharacters: true })
  })

  it('converts full-width digits typed with Japanese and Chinese input methods', () => {
    expect(normalizeCode('１２３４５６', numeric).value).toBe('123456')
  })

  it('converts Arabic-Indic and Extended Arabic-Indic digits', () => {
    expect(normalizeCode('٠١٢٣٤٥٦٧٨٩', { length: 10, type: 'numeric' }).value).toBe('0123456789')
    expect(normalizeCode('۰۱۲۳۴۵۶۷۸۹', { length: 10, type: 'numeric' }).value).toBe('0123456789')
  })

  it('cuts the code at its length', () => {
    expect(normalizeCode('12345678', numeric).value).toBe('123456')
  })

  it('upper-cases letters in an alphanumeric code', () => {
    expect(normalizeCode('ab-12c', alphanumeric)).toEqual({ value: 'AB12C', rejectedCharacters: false })
  })

  it('converts full-width letters in an alphanumeric code', () => {
    expect(normalizeCode('ＡｂＣ１', alphanumeric).value).toBe('ABC1')
  })

  it('drops accented letters and symbols from an alphanumeric code and reports them', () => {
    expect(normalizeCode('ñé#A1', alphanumeric)).toEqual({ value: 'A1', rejectedCharacters: true })
  })

  it('does not turn a German sharp s into two letters', () => {
    expect(normalizeCode('ß1', alphanumeric)).toEqual({ value: '1', rejectedCharacters: true })
  })
})

describe('resolveLength', () => {
  it('accepts integers from 1 to 12, including numeric strings', () => {
    expect(resolveLength(1)).toBe(1)
    expect(resolveLength('8')).toBe(8)
    expect(resolveLength(12)).toBe(12)
  })

  it('falls back to 6 for anything else', () => {
    for (const value of [0, 13, 4.5, 'abc', '', null, Number.NaN]) {
      expect(resolveLength(value)).toBe(6)
    }
  })
})

describe('resolveType', () => {
  it('accepts alphanumeric and falls back to numeric', () => {
    expect(resolveType('alphanumeric')).toBe('alphanumeric')
    expect(resolveType('numeric')).toBe('numeric')
    expect(resolveType('letters')).toBe('numeric')
    expect(resolveType(undefined)).toBe('numeric')
  })
})

describe('resolveCodeOptions', () => {
  it('uses the defaults when nothing is set', () => {
    expect(resolveCodeOptions({})).toEqual({ length: 6, type: 'numeric' })
  })
})

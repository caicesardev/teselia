import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MIN_LENGTH,
  characterLength,
  checkRequirements,
  isTooLong,
  passwordRules,
  requirementsMet,
  resolveRuleOptions,
} from '../../src/core/rules'

describe('resolveRuleOptions', () => {
  it('defaults to a minimum length of 8, no maximum and no character classes', () => {
    expect(resolveRuleOptions({})).toEqual({ minLength: DEFAULT_MIN_LENGTH, maxLength: null, classes: [], unknown: [] })
    expect(DEFAULT_MIN_LENGTH).toBe(8)
  })

  it('reads lengths from attribute strings and numbers', () => {
    expect(resolveRuleOptions({ minlength: '15', maxlength: 64 })).toMatchObject({ minLength: 15, maxLength: 64 })
  })

  it.each([['0'], ['-3'], ['2.5'], ['abc'], [''], [null]])('falls back to the default minimum for %j', (minlength) => {
    expect(resolveRuleOptions({ minlength }).minLength).toBe(DEFAULT_MIN_LENGTH)
  })

  it('ignores a maximum that is not a whole number or is below the minimum', () => {
    expect(resolveRuleOptions({ maxlength: 'abc' }).maxLength).toBeNull()
    expect(resolveRuleOptions({ maxlength: '7.5' }).maxLength).toBeNull()
    expect(resolveRuleOptions({ minlength: '12', maxlength: '10' }).maxLength).toBeNull()
    expect(resolveRuleOptions({ minlength: '12', maxlength: '12' }).maxLength).toBe(12)
  })

  it('parses requirements separated by spaces or commas, in a fixed order, without duplicates', () => {
    expect(resolveRuleOptions({ requirements: 'symbol, digit  uppercase digit' }).classes).toEqual([
      'uppercase',
      'digit',
      'symbol',
    ])
    expect(resolveRuleOptions({ requirements: 'LOWERCASE' }).classes).toEqual(['lowercase'])
  })

  it('reports unknown requirement names', () => {
    expect(resolveRuleOptions({ requirements: 'digit numbers special' })).toMatchObject({
      classes: ['digit'],
      unknown: ['numbers', 'special'],
    })
  })
})

describe('characterLength', () => {
  it('counts Unicode code points, so emoji and astral characters count once', () => {
    expect(characterLength('abc')).toBe(3)
    expect(characterLength('ñandú')).toBe(5)
    expect(characterLength('🔒🔑')).toBe(2)
    expect(characterLength('𝒜b')).toBe(2)
  })
})

describe('checkRequirements', () => {
  const all = resolveRuleOptions({ minlength: '8', requirements: 'lowercase uppercase digit symbol' })

  it('lists the length first and then the classes, each with its state', () => {
    expect(checkRequirements('Abcdefg1!', all)).toEqual([
      { requirement: 'length', met: true },
      { requirement: 'lowercase', met: true },
      { requirement: 'uppercase', met: true },
      { requirement: 'digit', met: true },
      { requirement: 'symbol', met: true },
    ])
  })

  it('checks only the length by default', () => {
    expect(checkRequirements('short', resolveRuleOptions({}))).toEqual([{ requirement: 'length', met: false }])
  })

  it('meets the length at exactly the minimum, counted in code points', () => {
    const options = resolveRuleOptions({ minlength: '4' })
    expect(checkRequirements('🔒🔒🔒', options)[0]?.met).toBe(false)
    expect(checkRequirements('🔒🔒🔒🔒', options)[0]?.met).toBe(true)
  })

  it('accepts letters with accents and from other cased alphabets', () => {
    const cases = resolveRuleOptions({ requirements: 'lowercase uppercase' })
    const states = (value: string) => checkRequirements(value, cases).slice(1).map((check) => check.met)

    expect(states('ñ')).toEqual([true, false])
    expect(states('É')).toEqual([false, true])
    expect(states('ΣΩ')).toEqual([false, true])
    expect(states('жд')).toEqual([true, false])
    expect(states('ǅ')).toEqual([false, true])
  })

  it('counts digits from any script', () => {
    const digits = resolveRuleOptions({ requirements: 'digit' })

    expect(checkRequirements('a7', digits)[1]?.met).toBe(true)
    expect(checkRequirements('a٧', digits)[1]?.met).toBe(true)
    expect(checkRequirements('a７', digits)[1]?.met).toBe(true)
    expect(checkRequirements('abc', digits)[1]?.met).toBe(false)
  })

  it('treats any character that is not a letter, a number or a space as a symbol', () => {
    const symbols = resolveRuleOptions({ requirements: 'symbol' })
    const hasSymbol = (value: string) => checkRequirements(value, symbols)[1]?.met

    expect(hasSymbol('pass!')).toBe(true)
    expect(hasSymbol('pass€')).toBe(true)
    expect(hasSymbol('pass🔒')).toBe(true)
    expect(hasSymbol('pass、')).toBe(true)
    expect(hasSymbol('pass word')).toBe(false)
    expect(hasSymbol('密码通行证')).toBe(false)
  })

  it('does not count letters without case as lowercase or uppercase', () => {
    const cases = resolveRuleOptions({ requirements: 'lowercase uppercase' })

    expect(checkRequirements('密码通行证', cases).slice(1).map((check) => check.met)).toEqual([false, false])
  })
})

describe('requirementsMet', () => {
  it('is true only when every requirement is met', () => {
    const options = resolveRuleOptions({ requirements: 'digit' })

    expect(requirementsMet('longenough', options)).toBe(false)
    expect(requirementsMet('longenough1', options)).toBe(true)
    expect(requirementsMet('short1', options)).toBe(false)
  })
})

describe('isTooLong', () => {
  it('is true only above the maximum, counted in code points', () => {
    const options = resolveRuleOptions({ minlength: '2', maxlength: '3' })

    expect(isTooLong('abc', options)).toBe(false)
    expect(isTooLong('🔒🔒🔒', options)).toBe(false)
    expect(isTooLong('abcd', options)).toBe(true)
  })

  it('is never true without a maximum', () => {
    expect(isTooLong('a'.repeat(1000), resolveRuleOptions({}))).toBe(false)
  })
})

describe('passwordRules', () => {
  it('describes the minimum length and allows every printable class by default', () => {
    expect(passwordRules(resolveRuleOptions({}))).toBe('minlength: 8; allowed: lower, upper, digit, special;')
  })

  it('adds the maximum and the required classes in Apple syntax', () => {
    const options = resolveRuleOptions({ minlength: '12', maxlength: '64', requirements: 'symbol lowercase uppercase digit' })

    expect(passwordRules(options)).toBe(
      'minlength: 12; maxlength: 64; required: lower; required: upper; required: digit; required: special; allowed: lower, upper, digit, special;',
    )
  })
})

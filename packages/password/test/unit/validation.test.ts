import { describe, expect, it } from 'vitest'
import { resolveRuleOptions } from '../../src/core/rules'
import { validatePassword } from '../../src/core/validation'

const texts = {
  required: 'Enter a password',
  unmet: 'Your password does not meet all the requirements',
  tooLong: 'Use {maxlength} characters or fewer',
}

const newPassword = resolveRuleOptions({ minlength: 8, maxlength: 12, requirements: 'digit' })

describe('validatePassword', () => {
  it('accepts an empty optional field, even for a new password with rules', () => {
    expect(validatePassword({ value: '', required: false, ruleOptions: newPassword, customError: '' }, texts)).toBeNull()
  })

  it('reports a missing value when required', () => {
    expect(validatePassword({ value: '', required: true, ruleOptions: null, customError: '' }, texts)).toEqual({
      flag: 'valueMissing',
      message: 'Enter a password',
    })
  })

  it('accepts any password when signing in, because rules do not apply', () => {
    expect(validatePassword({ value: 'a', required: true, ruleOptions: null, customError: '' }, texts)).toBeNull()
  })

  it('reports unmet rules for a new password', () => {
    expect(validatePassword({ value: 'abcdefgh', required: false, ruleOptions: newPassword, customError: '' }, texts)).toEqual({
      flag: 'unmet',
      message: 'Your password does not meet all the requirements',
    })
    expect(validatePassword({ value: 'abcdefg1', required: false, ruleOptions: newPassword, customError: '' }, texts)).toBeNull()
  })

  it('reports a password over the maximum before unmet rules, with the number in the message', () => {
    expect(validatePassword({ value: 'abcdefghijklm', required: false, ruleOptions: newPassword, customError: '' }, texts)).toEqual({
      flag: 'tooLong',
      message: 'Use 12 characters or fewer',
    })
  })

  it('puts a custom error first', () => {
    expect(validatePassword({ value: '', required: true, ruleOptions: newPassword, customError: 'Too common' }, texts)).toEqual({
      flag: 'customError',
      message: 'Too common',
    })
  })
})

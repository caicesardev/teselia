import { describe, expect, it } from 'vitest'
import { type CodeValidityInput, validateCode } from '../../src/core/validation'

const texts = { required: 'Enter the code', incomplete: 'Enter all {length} digits' }
const valid: CodeValidityInput = { value: '123456', length: 6, required: false, customError: '' }

describe('validateCode', () => {
  it('accepts a complete code', () => {
    expect(validateCode(valid, texts)).toBeNull()
  })

  it('accepts an empty field that is not required', () => {
    expect(validateCode({ ...valid, value: '' }, texts)).toBeNull()
  })

  it('reports a missing value when the field is required', () => {
    expect(validateCode({ ...valid, value: '', required: true }, texts)).toEqual({
      flag: 'valueMissing',
      message: 'Enter the code',
    })
  })

  it('reports a partial code even when the field is not required, with the length in the message', () => {
    expect(validateCode({ ...valid, value: '123', length: 4 }, texts)).toEqual({
      flag: 'tooShort',
      message: 'Enter all 4 digits',
    })
  })

  it('puts a custom error first, whatever the value', () => {
    expect(validateCode({ ...valid, customError: 'That code has expired' }, texts)).toEqual({
      flag: 'customError',
      message: 'That code has expired',
    })
    expect(validateCode({ ...valid, value: '', required: true, customError: 'Expired' }, texts)?.flag).toBe('customError')
  })
})

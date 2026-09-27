import { describe, expect, it } from 'vitest'
import { interpretPhoneNumber, splitE164 } from './phone-number'

describe('interpretPhoneNumber', () => {
  it('converts a national number to E.164 for the selected country', () => {
    expect(interpretPhoneNumber('612345678', 'ES')).toEqual({
      e164: '+34612345678',
      nationalNumber: '612 34 56 78',
      valid: true,
      detectedCountry: 'ES',
    })
  })

  it('ignores spaces and punctuation typed by the user', () => {
    expect(interpretPhoneNumber('612 34-56.78', 'ES').e164).toBe('+34612345678')
  })

  it('accepts the international call prefix 00', () => {
    expect(interpretPhoneNumber('0034612345678', 'ES').e164).toBe('+34612345678')
  })

  it('keeps an incomplete number as E.164 but marks it invalid', () => {
    expect(interpretPhoneNumber('612', 'ES')).toMatchObject({ e164: '+34612', valid: false })
  })

  it('marks a complete number with an unassigned prefix as invalid', () => {
    expect(interpretPhoneNumber('112345678', 'ES')).toMatchObject({ e164: '+34112345678', valid: false })
  })

  it('returns an empty value for empty or unparseable input', () => {
    expect(interpretPhoneNumber('', 'ES')).toMatchObject({ e164: '', valid: false })
    expect(interpretPhoneNumber('abc', 'ES')).toMatchObject({ e164: '', nationalNumber: 'abc' })
    expect(interpretPhoneNumber('6', 'ES').e164).toBe('')
  })

  it('needs a country to interpret a national number', () => {
    expect(interpretPhoneNumber('612345678', '').e164).toBe('')
  })

  it('interprets an international number regardless of the selected country', () => {
    expect(interpretPhoneNumber('+44 20 7946 0958', 'ES')).toMatchObject({
      e164: '+442079460958',
      detectedCountry: 'GB',
    })
  })
})

describe('splitE164', () => {
  it('splits an E.164 value into country and national number', () => {
    expect(splitE164('+34612345678')).toEqual({ country: 'ES', nationalNumber: '612345678' })
    expect(splitE164('+442079460958')).toEqual({ country: 'GB', nationalNumber: '2079460958' })
  })

  it('returns nothing when the country cannot be determined', () => {
    expect(splitE164('+44207946')).toBeNull()
    expect(splitE164('612345678')).toBeNull()
    expect(splitE164('')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { formatForDisplay, formatWhileTyping } from './format'

function typeAtEnd(previous: string, typed: string, country: 'ES' | 'US' | 'GB' | '' = 'ES') {
  const raw = previous + typed
  return formatWhileTyping({ previous, raw, caret: raw.length, inputType: 'insertText', country })
}

describe('formatWhileTyping: typing at the end', () => {
  it('groups digits as the national format of the selected country', () => {
    expect(typeAtEnd('612', '3')).toEqual({ text: '612 3', caret: 5 })
    expect(typeAtEnd('612 34 56 7', '8')).toEqual({ text: '612 34 56 78', caret: 12 })
  })

  it('uses the conventions of each country', () => {
    expect(typeAtEnd('(201) 555-012', '3', 'US').text).toBe('(201) 555-0123')
    expect(typeAtEnd('020 7946 095', '8', 'GB').text).toBe('020 7946 0958')
  })

  it('formats international input regardless of the selected country', () => {
    expect(typeAtEnd('+44 20 794', '6').text).toBe('+44 20 7946')
  })
})

describe('formatWhileTyping: caret', () => {
  it('keeps the caret after the same digit when inserting in the middle', () => {
    const result = formatWhileTyping({ previous: '612 34 5', raw: '612 934 5', caret: 5, inputType: 'insertText', country: 'ES' })

    expect(result.text).toBe('612 93 45')
    expect(result.text.slice(0, result.caret).replace(/\D/g, '')).toBe('6129')
  })

  it('keeps the caret in place when deleting a digit in the middle', () => {
    const result = formatWhileTyping({
      previous: '612 34 56 78',
      raw: '612 4 56 78',
      caret: 4,
      inputType: 'deleteContentBackward',
      country: 'ES',
    })

    expect(result.text).toBe('612 45 67 8')
    expect(result.text.slice(0, result.caret).replace(/\D/g, '')).toBe('612')
  })

  it('deletes the digit before a separator when Backspace only removed the separator', () => {
    const result = formatWhileTyping({ previous: '612 34', raw: '61234', caret: 3, inputType: 'deleteContentBackward', country: 'ES' })

    expect(result.text).toBe('613 4')
    expect(result.caret).toBe(2)
  })

  it('deletes the digit after a separator when Delete only removed the separator', () => {
    const result = formatWhileTyping({ previous: '612 34', raw: '61234', caret: 3, inputType: 'deleteContentForward', country: 'ES' })

    expect(result.text).toBe('612 4')
    expect(result.caret).toBe(3)
  })

  it('places the caret after the leading + when there are no digits before it', () => {
    expect(formatWhileTyping({ previous: '', raw: '+', caret: 1, inputType: 'insertText', country: 'ES' })).toEqual({
      text: '+',
      caret: 1,
    })
  })
})

describe('formatWhileTyping: input it does not touch', () => {
  it('leaves text with letters or unexpected symbols as typed', () => {
    expect(typeAtEnd('abc', 'd')).toEqual({ text: 'abcd', caret: 4 })
    expect(typeAtEnd('612#', '3')).toEqual({ text: '612#3', caret: 5 })
  })

  it('returns an empty field when every digit is deleted', () => {
    expect(formatWhileTyping({ previous: '6', raw: '', caret: 0, inputType: 'deleteContentBackward', country: 'ES' })).toEqual({
      text: '',
      caret: 0,
    })
  })
})

describe('formatForDisplay', () => {
  it('formats a complete national number', () => {
    expect(formatForDisplay('612345678', 'ES')).toBe('612 34 56 78')
    expect(formatForDisplay('020 7946 0958', 'GB')).toBe('020 7946 0958')
  })

  it('is idempotent', () => {
    expect(formatForDisplay(formatForDisplay('2015550123', 'US'), 'US')).toBe('(201) 555-0123')
  })
})

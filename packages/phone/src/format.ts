import { AsYouType } from 'libphonenumber-js/min'
import type { CountryCode } from './countries'

export interface FormattedInput {
  text: string
  caret: number
}

export interface EditedInput {
  previous: string
  raw: string
  caret: number
  inputType?: string
  country: CountryCode | ''
}

const FORMATTABLE = /^\s*\+?[\d\s\-().]*$/

export function formatWhileTyping({ previous, raw, caret, inputType, country }: EditedInput): FormattedInput {
  if (!FORMATTABLE.test(raw)) return { text: raw, caret }

  const international = raw.trim().startsWith('+')
  let digits = digitsOf(raw)
  let digitsBeforeCaret = digitsOf(raw.slice(0, caret)).length

  const removedOnlyFormatting = inputType?.startsWith('delete') && digits === digitsOf(previous)
  if (removedOnlyFormatting) {
    const removeIndex = inputType === 'deleteContentForward' ? digitsBeforeCaret : digitsBeforeCaret - 1
    if (removeIndex >= 0 && removeIndex < digits.length) {
      digits = digits.slice(0, removeIndex) + digits.slice(removeIndex + 1)
      digitsBeforeCaret = removeIndex
    }
  }

  const prefix = international ? '+' : ''
  if (digits === '') return { text: prefix, caret: prefix.length }

  const formatter = country && !international ? new AsYouType(country) : new AsYouType()
  const text = formatter.input(prefix + digits)
  return { text, caret: caretAfterDigits(text, digitsBeforeCaret) }
}

export function formatForDisplay(input: string, country: CountryCode | ''): string {
  const caret = input.length
  return formatWhileTyping({ previous: input, raw: input, caret, country }).text
}

function digitsOf(text: string): string {
  return text.replace(/\D/g, '')
}

function caretAfterDigits(text: string, digitCount: number): number {
  if (digitCount === 0) return text.startsWith('+') ? 1 : 0

  let seen = 0
  for (let index = 0; index < text.length; index++) {
    if (/\d/.test(text[index] ?? '')) seen++
    if (seen === digitCount) return index + 1
  }
  return text.length
}

import type { CodeType } from './core/code'

export interface TesOtpProps {
  label?: string
  hint?: string
  length?: number
  type?: CodeType
  required?: boolean
  readonly?: boolean
  autosubmit?: boolean
  autocomplete?: string
  textRequired?: string
  textIncomplete?: string
  textAutosubmit?: string
  textLength?: string
  textInvalidCharacter?: string
}

export const TES_OTP_DEFAULTS = {
  required: false,
  readonly: false,
  autosubmit: false,
  autocomplete: 'one-time-code',
  textRequired: 'Enter the code',
}

export const TEXT_INCOMPLETE_DEFAULTS = {
  numeric: 'Enter all {length} digits',
  alphanumeric: 'Enter all {length} characters',
} satisfies Record<CodeType, string>

export const TEXT_AUTOSUBMIT_DEFAULTS = {
  numeric: 'The code is sent when you enter the last digit',
  alphanumeric: 'The code is sent when you enter the last character',
} satisfies Record<CodeType, string>

export const TEXT_LENGTH_DEFAULTS = {
  numeric: '{length}-digit code',
  alphanumeric: '{length}-character code',
} satisfies Record<CodeType, string>

export const TEXT_INVALID_CHARACTER_DEFAULTS = {
  numeric: 'Only digits are allowed',
  alphanumeric: 'Only letters and digits are allowed',
} satisfies Record<CodeType, string>

export type ResolvedTesOtpProps = Readonly<TesOtpProps & typeof TES_OTP_DEFAULTS>

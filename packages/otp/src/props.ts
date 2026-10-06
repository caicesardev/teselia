import type { CodeType } from './core/code'

export interface TesOtpProps {
  label?: string
  length?: number
  type?: CodeType
  required?: boolean
  autocomplete?: string
  textRequired?: string
  textIncomplete?: string
}

export const TES_OTP_DEFAULTS = {
  required: false,
  autocomplete: 'one-time-code',
  textRequired: 'Enter the code',
}

export const TEXT_INCOMPLETE_DEFAULTS = {
  numeric: 'Enter all {length} digits',
  alphanumeric: 'Enter all {length} characters',
} satisfies Record<CodeType, string>

export type ResolvedTesOtpProps = Readonly<TesOtpProps & typeof TES_OTP_DEFAULTS>

export interface TesOtpProps {
  label?: string
  autocomplete?: string
}

export const TES_OTP_DEFAULTS = {
  autocomplete: 'one-time-code',
}

export const DEFAULT_LENGTH = 6

export type ResolvedTesOtpProps = Readonly<TesOtpProps & typeof TES_OTP_DEFAULTS>

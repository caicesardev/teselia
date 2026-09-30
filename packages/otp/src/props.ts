export interface TesOtpProps {
  label?: string
  autocomplete?: string
}

export const TES_OTP_DEFAULTS = {
  autocomplete: 'one-time-code',
}

export type ResolvedTesOtpProps = Readonly<TesOtpProps & typeof TES_OTP_DEFAULTS>

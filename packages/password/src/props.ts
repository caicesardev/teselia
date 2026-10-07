import type { Purpose } from './core/purpose'

export interface TesPasswordProps {
  label?: string
  name?: string
  purpose?: Purpose
  minlength?: number
  maxlength?: number
  requirements?: string
  autocomplete?: string
  textShow?: string
  textHide?: string
  textShowLabel?: string
  textHideLabel?: string
  textShown?: string
  textHidden?: string
}

export const TES_PASSWORD_DEFAULTS = {
  textShow: 'Show',
  textHide: 'Hide',
  textShowLabel: 'Show password',
  textHideLabel: 'Hide password',
  textShown: 'Your password is shown',
  textHidden: 'Your password is hidden',
}

export type ResolvedTesPasswordProps = Readonly<TesPasswordProps & typeof TES_PASSWORD_DEFAULTS>

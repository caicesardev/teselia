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
  textRequirements?: string
  textRuleLength?: string
  textRuleLowercase?: string
  textRuleUppercase?: string
  textRuleDigit?: string
  textRuleSymbol?: string
  textRuleMet?: string
  textRuleUnmet?: string
  textAllMet?: string
}

export const TES_PASSWORD_DEFAULTS = {
  textShow: 'Show',
  textHide: 'Hide',
  textShowLabel: 'Show password',
  textHideLabel: 'Hide password',
  textShown: 'Your password is shown',
  textHidden: 'Your password is hidden',
  textRequirements: 'Your password must have:',
  textRuleLength: 'At least {minlength} characters',
  textRuleLowercase: 'A lowercase letter',
  textRuleUppercase: 'An uppercase letter',
  textRuleDigit: 'A number',
  textRuleSymbol: 'A symbol, like ! or #',
  textRuleMet: 'done',
  textRuleUnmet: 'not yet',
  textAllMet: 'All requirements met',
}

export type ResolvedTesPasswordProps = Readonly<TesPasswordProps & typeof TES_PASSWORD_DEFAULTS>

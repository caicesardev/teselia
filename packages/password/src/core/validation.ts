import { type RuleOptions, isTooLong, requirementsMet } from './rules'

export interface PasswordValidationInput {
  value: string
  required: boolean
  ruleOptions: RuleOptions | null
  customError: string
}

export interface PasswordValidationTexts {
  required: string
  unmet: string
  tooLong: string
}

export interface PasswordValidationError {
  flag: 'customError' | 'valueMissing' | 'tooLong' | 'unmet'
  message: string
}

export function validatePassword(
  { value, required, ruleOptions, customError }: PasswordValidationInput,
  texts: PasswordValidationTexts,
): PasswordValidationError | null {
  if (customError) return { flag: 'customError', message: customError }
  if (value === '') return required ? { flag: 'valueMissing', message: texts.required } : null
  if (!ruleOptions) return null
  if (isTooLong(value, ruleOptions)) {
    return { flag: 'tooLong', message: texts.tooLong.replaceAll('{maxlength}', String(ruleOptions.maxLength)) }
  }
  if (!requirementsMet(value, ruleOptions)) return { flag: 'unmet', message: texts.unmet }
  return null
}

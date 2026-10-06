export type CodeValidityFlag = 'customError' | 'valueMissing' | 'tooShort'

export interface CodeError {
  flag: CodeValidityFlag
  message: string
}

export interface CodeValidityInput {
  value: string
  length: number
  required: boolean
  customError: string
}

export interface CodeErrorTexts {
  required: string
  incomplete: string
}

export function validateCode(input: CodeValidityInput, texts: CodeErrorTexts): CodeError | null {
  if (input.customError) return { flag: 'customError', message: input.customError }
  if (input.value === '') return input.required ? { flag: 'valueMissing', message: texts.required } : null
  if (input.value.length < input.length) {
    return { flag: 'tooShort', message: texts.incomplete.replaceAll('{length}', String(input.length)) }
  }
  return null
}

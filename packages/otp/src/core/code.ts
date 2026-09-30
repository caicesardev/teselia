export type CodeType = 'numeric' | 'alphanumeric'

export interface CodeOptions {
  length: number
  type: CodeType
}

export interface NormalizedCode {
  value: string
  rejectedCharacters: boolean
}

export const DEFAULT_LENGTH = 6
export const MIN_LENGTH = 1
export const MAX_LENGTH = 12

const ALLOWED = { numeric: /^[0-9]$/, alphanumeric: /^[A-Z0-9]$/ } satisfies Record<CodeType, RegExp>
const SEPARATOR = /[\s.-]/
const ARABIC_INDIC_ZERO = 0x0660
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0

export function resolveLength(value: unknown): number {
  const length = Number(value)
  return isValidLength(length) ? length : DEFAULT_LENGTH
}

export function isValidLength(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= MIN_LENGTH && (value as number) <= MAX_LENGTH
}

export function resolveType(value: unknown): CodeType {
  return value === 'alphanumeric' ? 'alphanumeric' : 'numeric'
}

export function resolveCodeOptions(raw: { length?: unknown; type?: unknown }): CodeOptions {
  return { length: resolveLength(raw.length), type: resolveType(raw.type) }
}

export function normalizeCode(raw: string, options: CodeOptions): NormalizedCode {
  let value = ''
  let rejectedCharacters = false

  for (const character of toAsciiDigits(raw.normalize('NFKC'))) {
    const candidate = options.type === 'alphanumeric' ? character.toUpperCase() : character
    if (ALLOWED[options.type].test(candidate)) value += candidate
    else if (!SEPARATOR.test(character)) rejectedCharacters = true
  }

  return { value: value.slice(0, options.length), rejectedCharacters }
}

function toAsciiDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => {
    const codePoint = digit.codePointAt(0) as number
    const zero = codePoint >= EXTENDED_ARABIC_INDIC_ZERO ? EXTENDED_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO
    return String(codePoint - zero)
  })
}

export type CharacterClass = 'lowercase' | 'uppercase' | 'digit' | 'symbol'
export type Requirement = 'length' | CharacterClass

export interface RuleOptions {
  minLength: number
  maxLength: number | null
  classes: CharacterClass[]
  unknown: string[]
}

export interface RequirementCheck {
  requirement: Requirement
  met: boolean
}

export const DEFAULT_MIN_LENGTH = 8

const CHARACTER_CLASSES: readonly CharacterClass[] = ['lowercase', 'uppercase', 'digit', 'symbol']

const CLASS_PATTERNS: Record<CharacterClass, RegExp> = {
  lowercase: /\p{Ll}/u,
  uppercase: /[\p{Lu}\p{Lt}]/u,
  digit: /\p{Nd}/u,
  symbol: /[^\p{L}\p{N}\s]/u,
}

const APPLE_CLASS_NAMES: Record<CharacterClass, string> = {
  lowercase: 'lower',
  uppercase: 'upper',
  digit: 'digit',
  symbol: 'special',
}

function positiveInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function isCharacterClass(name: string): name is CharacterClass {
  return (CHARACTER_CLASSES as readonly string[]).includes(name)
}

export function resolveRuleOptions(raw: { minlength?: unknown; maxlength?: unknown; requirements?: unknown }): RuleOptions {
  const minLength = positiveInteger(raw.minlength) ?? DEFAULT_MIN_LENGTH
  const maxLength = positiveInteger(raw.maxlength)
  const names = String(raw.requirements ?? '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)

  return {
    minLength,
    maxLength: maxLength !== null && maxLength >= minLength ? maxLength : null,
    classes: CHARACTER_CLASSES.filter((name) => names.includes(name)),
    unknown: [...new Set(names.filter((name) => !isCharacterClass(name)))],
  }
}

export function characterLength(value: string): number {
  return [...value].length
}

export function checkRequirements(value: string, options: RuleOptions): RequirementCheck[] {
  return [
    { requirement: 'length', met: characterLength(value) >= options.minLength },
    ...options.classes.map((name) => ({ requirement: name, met: CLASS_PATTERNS[name].test(value) })),
  ]
}

export function requirementsMet(value: string, options: RuleOptions): boolean {
  return checkRequirements(value, options).every((check) => check.met)
}

export function isTooLong(value: string, options: RuleOptions): boolean {
  return options.maxLength !== null && characterLength(value) > options.maxLength
}

export function passwordRules(options: RuleOptions): string {
  const rules = [
    `minlength: ${options.minLength};`,
    options.maxLength !== null && `maxlength: ${options.maxLength};`,
    ...options.classes.map((name) => `required: ${APPLE_CLASS_NAMES[name]};`),
    'allowed: lower, upper, digit, special;',
  ]
  return rules.filter(Boolean).join(' ')
}

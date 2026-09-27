import type { Country } from './countries'

const enum MatchRank {
  ExactCode,
  NameStart,
  WordStart,
  NameContains,
}

const CALLING_CODE_QUERY = /^\+?\d+$/
const DIACRITICS = /\p{M}/gu
const WORD_SEPARATORS = /[\s\-'’(),.&]+/

export function filterCountries(
  countries: readonly Country[],
  query: string,
  locale = 'en',
): Country[] {
  const compactQuery = query.replace(/\s+/g, '')
  if (compactQuery === '') return [...countries]

  if (CALLING_CODE_QUERY.test(compactQuery)) {
    const digits = compactQuery.replace('+', '')
    return countries.filter((country) => country.callingCode.startsWith(digits))
  }

  const needle = foldForSearch(query.trim(), locale)

  return countries
    .map((country) => ({ country, rank: rankMatch(country, needle, locale) }))
    .filter((match): match is { country: Country; rank: MatchRank } => match.rank !== undefined)
    .sort((a, b) => a.rank - b.rank)
    .map((match) => match.country)
}

function rankMatch(country: Country, needle: string, locale: string): MatchRank | undefined {
  if (country.code.toLowerCase() === needle) return MatchRank.ExactCode

  const name = foldForSearch(country.name, locale)
  if (name.startsWith(needle)) return MatchRank.NameStart
  if (name.split(WORD_SEPARATORS).some((word) => word.startsWith(needle))) return MatchRank.WordStart
  if (name.includes(needle)) return MatchRank.NameContains

  return undefined
}

function foldForSearch(text: string, locale: string): string {
  return text.normalize('NFD').replace(DIACRITICS, '').toLocaleLowerCase(locale)
}

export type Purpose = 'current' | 'new'

const AUTOCOMPLETE: Record<Purpose, string> = {
  current: 'current-password',
  new: 'new-password',
}

export function isPurpose(value: unknown): value is Purpose {
  return value === 'current' || value === 'new'
}

export function resolvePurpose(value: unknown): Purpose {
  return isPurpose(value) ? value : 'current'
}

export function autocompleteFor(purpose: Purpose, explicit: string | undefined): string {
  return explicit?.trim() ? explicit : AUTOCOMPLETE[purpose]
}

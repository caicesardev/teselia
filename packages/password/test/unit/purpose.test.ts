import { describe, expect, it } from 'vitest'
import { autocompleteFor, isPurpose, resolvePurpose } from '../../src/core/purpose'

describe('resolvePurpose', () => {
  it('accepts current and new, and falls back to current for anything else', () => {
    expect(resolvePurpose('current')).toBe('current')
    expect(resolvePurpose('new')).toBe('new')
    expect(resolvePurpose('NEW')).toBe('current')
    expect(resolvePurpose('signup')).toBe('current')
    expect(resolvePurpose(undefined)).toBe('current')
  })

  it('tells valid values apart for warnings', () => {
    expect(isPurpose('new')).toBe(true)
    expect(isPurpose('sign-up')).toBe(false)
  })
})

describe('autocompleteFor', () => {
  it('uses the token that tells password managers to fill or to generate', () => {
    expect(autocompleteFor('current', undefined)).toBe('current-password')
    expect(autocompleteFor('new', undefined)).toBe('new-password')
  })

  it('keeps an explicit value, and ignores an empty one', () => {
    expect(autocompleteFor('new', 'section-signup new-password')).toBe('section-signup new-password')
    expect(autocompleteFor('current', 'off')).toBe('off')
    expect(autocompleteFor('new', '')).toBe('new-password')
    expect(autocompleteFor('new', '  ')).toBe('new-password')
  })
})

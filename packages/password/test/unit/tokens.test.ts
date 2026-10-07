import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function customProperties(css: string, selector: string): string[] {
  const start = css.indexOf(`${selector} {`)
  const block = css.slice(start, css.indexOf('}', start))
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('--_'))
}

describe('shared tokens', () => {
  it('declares the same tokens and defaults as @teselia/shared, which only targets :host', () => {
    const shared = readFileSync(new URL('../../../shared/src/base.css', import.meta.url), 'utf8')
    const password = readFileSync(new URL('../../src/tes-password.css', import.meta.url), 'utf8')

    const sharedTokens = customProperties(shared, ':host')
    expect(sharedTokens.length).toBeGreaterThan(5)
    expect(customProperties(password, ':where(tes-password)')).toEqual(sharedTokens)
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function selectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...withoutComments.matchAll(/([^{}]+)\{/g)]
    .map((match) => match[1]?.trim() ?? '')
    .filter((prelude) => !prelude.startsWith('@'))
    .flatMap((prelude) => prelude.split(',').map((selector) => selector.trim()))
}

describe('component stylesheet', () => {
  it('wraps every selector in :where(), so any page style can override it', () => {
    const css = readFileSync(new URL('../../src/tes-password.css', import.meta.url), 'utf8')
    const all = selectors(css)

    expect(all.length).toBeGreaterThan(20)
    expect(all.filter((selector) => !/^:where\(.+\)$/.test(selector))).toEqual([])
  })
})

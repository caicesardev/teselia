import { describe, expect, it } from 'vitest'

describe('@teselia/phone in a non-browser environment', () => {
  it('can be imported without a DOM (SSR safety)', async () => {
    const mod = await import('../../src/index')

    expect(mod.TAG_NAME).toBe('tes-phone')
    expect(() => mod.define()).not.toThrow()
    expect(() => mod.define('my-phone')).not.toThrow()
  })
})

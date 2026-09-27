import { describe, expect, it } from 'vitest'
import { nextHighlight } from './highlight'

const items = ['a', 'b', 'c']

describe('nextHighlight', () => {
  it('starts at the first item going down and at the last going up', () => {
    expect(nextHighlight(items, null, 1)).toBe('a')
    expect(nextHighlight(items, null, -1)).toBe('c')
  })

  it('moves one step in the given direction', () => {
    expect(nextHighlight(items, 'a', 1)).toBe('b')
    expect(nextHighlight(items, 'c', -1)).toBe('b')
  })

  it('wraps around at both ends', () => {
    expect(nextHighlight(items, 'c', 1)).toBe('a')
    expect(nextHighlight(items, 'a', -1)).toBe('c')
  })

  it('restarts from an end when the current item is no longer in the list', () => {
    expect(nextHighlight(items, 'z', 1)).toBe('a')
    expect(nextHighlight(items, 'z', -1)).toBe('c')
  })

  it('returns nothing for an empty list', () => {
    expect(nextHighlight([], 'a', 1)).toBeNull()
  })
})

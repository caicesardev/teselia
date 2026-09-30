import { describe, expect, it } from 'vitest'
import { isCellActive, overwriteSelection, selectionAfterArrowLeft } from '../../src/core/selection'

describe('overwriteSelection', () => {
  it('selects the character after a caret placed on a filled cell', () => {
    expect(overwriteSelection({ start: 1, end: 1 }, 3, 6)).toEqual({ start: 1, end: 2 })
  })

  it('keeps a collapsed caret at the end of a partial value', () => {
    expect(overwriteSelection({ start: 3, end: 3 }, 3, 6)).toEqual({ start: 3, end: 3 })
  })

  it('pulls a caret beyond the value back to its end', () => {
    expect(overwriteSelection({ start: 5, end: 5 }, 3, 6)).toEqual({ start: 3, end: 3 })
  })

  it('selects the last character when the code is complete and the caret is at the end', () => {
    expect(overwriteSelection({ start: 6, end: 6 }, 6, 6)).toEqual({ start: 5, end: 6 })
  })

  it('leaves a range selection alone', () => {
    expect(overwriteSelection({ start: 0, end: 4 }, 6, 6)).toEqual({ start: 0, end: 4 })
  })
})

describe('selectionAfterArrowLeft', () => {
  it('moves a one-character selection to the previous character', () => {
    expect(selectionAfterArrowLeft({ start: 3, end: 4 })).toEqual({ start: 2, end: 3 })
  })

  it('stays on the first character', () => {
    expect(selectionAfterArrowLeft({ start: 0, end: 1 })).toEqual({ start: 0, end: 1 })
  })

  it('leaves collapsed carets and ranges to the browser', () => {
    expect(selectionAfterArrowLeft({ start: 3, end: 3 })).toBeNull()
    expect(selectionAfterArrowLeft({ start: 1, end: 4 })).toBeNull()
  })
})

describe('isCellActive', () => {
  it('marks the caret cell of a collapsed selection', () => {
    expect([0, 1, 2, 3].map((index) => isCellActive(index, { start: 2, end: 2 }))).toEqual([false, false, true, false])
  })

  it('marks every cell inside a range', () => {
    expect([0, 1, 2, 3].map((index) => isCellActive(index, { start: 1, end: 3 }))).toEqual([false, true, true, false])
  })
})

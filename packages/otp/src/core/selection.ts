export interface TextSelection {
  start: number
  end: number
}

export function overwriteSelection(selection: TextSelection, valueLength: number, length: number): TextSelection {
  if (selection.start !== selection.end) return selection

  const position = Math.min(selection.start, valueLength)
  if (position < valueLength) return { start: position, end: position + 1 }
  if (valueLength >= length) return { start: length - 1, end: length }
  return { start: position, end: position }
}

export function selectionAfterArrowLeft(selection: TextSelection): TextSelection | null {
  if (selection.end - selection.start !== 1) return null
  const start = Math.max(0, selection.start - 1)
  return { start, end: start + 1 }
}

export function isCellActive(index: number, selection: TextSelection): boolean {
  if (selection.start === selection.end) return index === selection.start
  return index >= selection.start && index < selection.end
}

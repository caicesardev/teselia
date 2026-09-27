export type Direction = 1 | -1

export function nextHighlight<T>(items: readonly T[], current: T | null, direction: Direction): T | null {
  if (items.length === 0) return null

  const index = current === null ? -1 : items.indexOf(current)
  if (index === -1) return direction === 1 ? (items[0] ?? null) : (items.at(-1) ?? null)

  return items[(index + direction + items.length) % items.length] ?? null
}

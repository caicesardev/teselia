import axe from 'axe-core'
import { expect } from 'vitest'

export type { EmulatedMedia } from './commands'

export async function expectNoAxeViolations(element: HTMLElement): Promise<void> {
  const results = await axe.run(element.parentElement as HTMLElement)
  expect(results.violations).toEqual([])
}

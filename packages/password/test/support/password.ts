import { expect } from 'vitest'
import type { TesPasswordElement } from '../../src/index'
import '../../src/index'

export { expectNoAxeViolations } from '@teselia/shared/test'

export async function renderPassword(attributes: string, wrapperTag = 'main'): Promise<TesPasswordElement> {
  const container = document.createElement(wrapperTag)
  container.innerHTML = `<tes-password label="Password" ${attributes}></tes-password>`
  document.body.append(container)

  const el = container.querySelector('tes-password') as TesPasswordElement
  await expect.poll(() => el.querySelector('input')).toBeTruthy()
  return el
}

export function passwordInput(el: HTMLElement): HTMLInputElement {
  return el.querySelector('.tes-password__input') as HTMLInputElement
}

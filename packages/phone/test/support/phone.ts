import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from '../../src/index'
import '../../src/index'

export { expectNoAxeViolations } from '@teselia/shared/test'

export async function renderPhone(attributes: string, wrapperTag = 'main'): Promise<TesPhoneElement> {
  const container = document.createElement(wrapperTag)
  container.innerHTML = `<tes-phone label="Phone number" ${attributes}></tes-phone>`
  document.body.append(container)

  const el = container.querySelector('tes-phone') as TesPhoneElement
  await expect.poll(() => el.shadowRoot?.querySelector('[role="combobox"]')).toBeTruthy()
  return el
}

export function combobox(el: TesPhoneElement): HTMLInputElement {
  return el.shadowRoot?.querySelector('[role="combobox"]') as HTMLInputElement
}

export function numberInput(el: TesPhoneElement): HTMLInputElement {
  return el.shadowRoot?.querySelector('#number') as HTMLInputElement
}

export function chevron(el: TesPhoneElement): HTMLElement {
  return el.shadowRoot?.querySelector('.toggle') as HTMLElement
}

export function listbox(el: TesPhoneElement): HTMLElement {
  return el.shadowRoot?.querySelector('[role="listbox"]') as HTMLElement
}

export function popup(el: TesPhoneElement): HTMLElement {
  return el.shadowRoot?.querySelector('[popover]') as HTMLElement
}

export function liveRegion(el: TesPhoneElement): HTMLElement {
  return el.shadowRoot?.querySelector('[role="status"]') as HTMLElement
}

export function options(el: TesPhoneElement): HTMLElement[] {
  return Array.from(listbox(el).querySelectorAll<HTMLElement>('[role="option"]'))
}

export function isExpanded(el: TesPhoneElement): boolean {
  return combobox(el).getAttribute('aria-expanded') === 'true' && popup(el).matches(':popover-open')
}

export function activeDescendant(el: TesPhoneElement): string | null {
  return combobox(el).getAttribute('aria-activedescendant')
}

export async function typeInCombobox(el: TesPhoneElement, text: string): Promise<void> {
  combobox(el).focus()
  await userEvent.keyboard(text)
}

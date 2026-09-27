import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import {
  activeDescendant,
  combobox,
  expectNoAxeViolations,
  isExpanded,
  listbox,
  numberInput,
  options,
  popup,
  renderPhone,
  typeInCombobox,
} from './testing/phone'

function option(el: TesPhoneElement, code: string): HTMLElement {
  return el.shadowRoot?.getElementById(`option-${code}`) as HTMLElement
}

function chevron(el: TesPhoneElement): HTMLElement {
  return el.shadowRoot?.querySelector('.toggle') as HTMLElement
}

async function renderWithOutsideButton(): Promise<{ el: TesPhoneElement; outside: HTMLButtonElement }> {
  const el = await renderPhone('default-country="ES" lang="en"')
  const outside = document.createElement('button')
  outside.textContent = 'Outside'
  el.parentElement?.prepend(outside)
  return { el, outside }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('country combobox pointer: opening', () => {
  it('opens on click, highlighting and revealing the selected country', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await userEvent.click(combobox(el))

    expect(isExpanded(el)).toBe(true)
    expect(activeDescendant(el)).toBe('option-ES')
    const list = listbox(el).getBoundingClientRect()
    const selected = option(el, 'ES').getBoundingClientRect()
    expect(selected.top).toBeGreaterThanOrEqual(list.top)
    expect(selected.bottom).toBeLessThanOrEqual(list.bottom)
  })

  it('selects the text on the focusing click, so typing replaces the country', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await userEvent.click(combobox(el))
    await userEvent.keyboard('germ')

    expect(combobox(el).value).toBe('germ')
  })

  it('toggles the listbox from the chevron and keeps focus in the combobox', async () => {
    const el = await renderPhone('default-country="ES"')

    await userEvent.click(chevron(el))
    expect(isExpanded(el)).toBe(true)
    expect(el.shadowRoot?.activeElement).toBe(combobox(el))

    await userEvent.click(chevron(el))
    expect(isExpanded(el)).toBe(false)
  })

  it('keeps the chevron out of the tab order and hidden from assistive technology', async () => {
    const el = await renderPhone('default-country="ES"')

    expect(chevron(el).getAttribute('aria-hidden')).toBe('true')
    expect(chevron(el).tabIndex).toBe(-1)
  })
})

describe('country combobox pointer: selecting', () => {
  it('selects the clicked option, closes and keeps focus in the combobox', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await typeInCombobox(el, 'united')

    await userEvent.click(option(el, 'GB'))

    expect(el.country).toBe('GB')
    expect(combobox(el).value).toBe('United Kingdom +44')
    expect(isExpanded(el)).toBe(false)
    expect(el.shadowRoot?.activeElement).toBe(combobox(el))
  })

  it('keeps the typed number when the country changes', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await userEvent.type(numberInput(el), '612345678')

    await typeInCombobox(el, 'portugal')
    await userEvent.click(option(el, 'PT'))

    expect(el.country).toBe('PT')
    expect(numberInput(el).value).toBe('612345678')
  })

  it('stays open when the popup padding (not an option) is pressed', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.click(combobox(el))

    await userEvent.click(popup(el), { position: { x: 2, y: 2 } })

    expect(isExpanded(el)).toBe(true)
    expect(el.shadowRoot?.activeElement).toBe(combobox(el))
  })

  it('renders options above the 24 × 24 px minimum target size', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.click(combobox(el))

    const { width, height } = option(el, 'ES').getBoundingClientRect()

    expect(width).toBeGreaterThanOrEqual(24)
    expect(height).toBeGreaterThanOrEqual(24)
  })

  it('shows hover feedback on options', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await typeInCombobox(el, 'united')
    const [hovered, other] = options(el)

    await userEvent.hover(hovered as HTMLElement)

    expect(getComputedStyle(hovered as HTMLElement).backgroundColor).not.toBe(
      getComputedStyle(other as HTMLElement).backgroundColor,
    )
  })
})

describe('country combobox pointer: clicking outside', () => {
  it('closes without changing the selected country', async () => {
    const { el, outside } = await renderWithOutsideButton()
    await typeInCombobox(el, 'germ')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.click(outside)

    expect(isExpanded(el)).toBe(false)
    expect(el.country).toBe('ES')
    expect(combobox(el).value).toBe('Spain +34')
  })

  it('has no axe violations after opening with the pointer', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.click(combobox(el))

    await expectNoAxeViolations(el)
  })
})

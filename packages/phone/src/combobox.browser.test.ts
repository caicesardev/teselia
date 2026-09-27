import { getCountries } from 'libphonenumber-js/min'
import type { TesPhoneElement } from './index'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  combobox,
  expectNoAxeViolations,
  listbox,
  options,
  renderPhone,
  typeInCombobox,
} from './testing/phone'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('country combobox: structure and naming', () => {
  it('groups both controls under the field label', async () => {
    await renderPhone('default-country="ES"')

    const group = page.getByRole('group', { name: 'Phone number' })
    await expect.element(group).toBeVisible()
    await expect.element(group.getByRole('combobox', { name: 'Country code' })).toBeVisible()
    await expect.element(group.getByRole('textbox', { name: 'Phone number' })).toBeVisible()
  })

  it('takes its accessible name from text-country', async () => {
    await renderPhone('default-country="ES" text-country="Prefijo del país"')

    await expect.element(page.getByRole('combobox', { name: 'Prefijo del país' })).toBeVisible()
  })

  it('declares list autocomplete and controls a listbox in the same shadow root', async () => {
    const el = await renderPhone('default-country="ES"')
    const input = combobox(el)

    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    const controlled = el.shadowRoot?.getElementById(input.getAttribute('aria-controls') ?? '')
    expect(controlled).toBe(listbox(el))
    expect(listbox(el).getAttribute('aria-label')).toBe('Country code')
  })

  it('opts out of browser autofill and text correction on the combobox', async () => {
    const input = combobox(await renderPhone('default-country="ES"'))

    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.getAttribute('spellcheck')).toBe('false')
  })
})

describe('country combobox: collapsed state', () => {
  it('shows the selected country as "Name +code" and is collapsed', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    expect(combobox(el).value).toBe('Spain +34')
    expect(combobox(el).getAttribute('aria-expanded')).toBe('false')
    expect(listbox(el).matches(':popover-open')).toBe(false)
    expect(el.country).toBe('ES')
  })

  it('localizes the country name from the lang attribute', async () => {
    const el = await renderPhone('default-country="DE" lang="es"')

    expect(combobox(el).value).toBe('Alemania +49')
  })

  it('exposes every supported country as an option, marking only the selected one', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    const all = options(el)
    const selected = all.filter((option) => option.getAttribute('aria-selected') === 'true')

    expect(all).toHaveLength(getCountries().length)
    expect(selected).toHaveLength(1)
    expect(selected[0]?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Spain +34')
    expect(all.every((option) => option.hasAttribute('aria-selected'))).toBe(true)
  })

  it('has no active descendant while nothing is highlighted', async () => {
    const el = await renderPhone('default-country="ES"')

    expect(combobox(el).hasAttribute('aria-activedescendant')).toBe(false)
  })

  it('has no axe violations when collapsed', async () => {
    await expectNoAxeViolations(await renderPhone('default-country="ES"'))
  })
})

describe('country combobox: expanded by typing', () => {
  it('selects its text on focus so typing replaces the selected country', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    combobox(el).focus()

    expect(combobox(el).selectionStart).toBe(0)
    expect(combobox(el).selectionEnd).toBe('Spain +34'.length)
  })

  it('opens the listbox and filters options while typing', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await typeInCombobox(el, 'united')

    expect(combobox(el).getAttribute('aria-expanded')).toBe('true')
    expect(listbox(el).matches(':popover-open')).toBe(true)
    expect(options(el).map((option) => option.id)).toEqual([
      'option-AE',
      'option-GB',
      'option-US',
    ])
  })

  it('keeps focus in the combobox while open', async () => {
    const el = await renderPhone('default-country="ES"')

    await typeInCombobox(el, 'fr')

    expect(el.shadowRoot?.activeElement).toBe(combobox(el))
  })

  it('closes and restores the selected country when focus leaves', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await typeInCombobox(el, 'fr')

    await userEvent.tab()

    expect(combobox(el).getAttribute('aria-expanded')).toBe('false')
    expect(listbox(el).matches(':popover-open')).toBe(false)
    expect(combobox(el).value).toBe('Spain +34')
  })

  it('has no axe violations when expanded', async () => {
    const el = await renderPhone('default-country="ES"')
    await typeInCombobox(el, 'a')

    await expectNoAxeViolations(el)
  })
})

describe('country combobox: form reset', () => {
  it('restores the default country on reset', async () => {
    const container = document.createElement('form')
    container.innerHTML = '<tes-phone label="Phone number" default-country="PT"></tes-phone>'
    document.body.append(container)
    const el = container.querySelector('tes-phone') as TesPhoneElement
    await expect.poll(() => el.shadowRoot?.querySelector('[role="combobox"]')).toBeTruthy()

    el.state.country = 'FR'
    container.reset()

    expect(el.country).toBe('PT')
  })
})

describe('country combobox: language changes after mounting', () => {
  afterEach(() => {
    document.documentElement.setAttribute('lang', 'en')
  })

  it('follows a lang change on the document', async () => {
    document.documentElement.setAttribute('lang', 'en')
    const el = await renderPhone('default-country="DE"')
    expect(combobox(el).value).toBe('Germany +49')

    document.documentElement.setAttribute('lang', 'es')

    await expect.poll(() => combobox(el).value).toBe('Alemania +49')
  })

  it('follows a lang change on the element itself', async () => {
    const el = await renderPhone('default-country="DE" lang="en"')

    el.setAttribute('lang', 'fr')

    await expect.poll(() => combobox(el).value).toBe('Allemagne +49')
  })
})

describe('country combobox: narrow layouts', () => {
  it('fits a 288px wide container (320px viewport minus page padding) without overflow', async () => {
    const el = await renderPhone('default-country="ES"')
    const container = el.parentElement as HTMLElement
    container.style.inlineSize = '288px'

    const hostRect = el.getBoundingClientRect()
    const controls = Array.from(el.shadowRoot?.querySelectorAll('input') ?? [])

    expect(hostRect.width).toBeLessThanOrEqual(288)
    for (const control of controls) {
      expect(control.getBoundingClientRect().right).toBeLessThanOrEqual(hostRect.right + 0.5)
    }
  })
})

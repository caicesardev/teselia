import { getCountries } from 'libphonenumber-js/min'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import {
  activeDescendant,
  combobox,
  expectNoAxeViolations,
  listbox,
  options,
  renderPhone,
  typeInCombobox,
} from './testing/phone'

function optionCodes(el: TesPhoneElement): string[] {
  return options(el).map((option) => option.id.replace('option-', ''))
}

function suggestedGroup(el: TesPhoneElement): HTMLElement | null {
  return listbox(el).querySelector('[role="group"]')
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('preferred-countries', () => {
  it('lists preferred countries first, in the given order, inside a "Suggested" group', async () => {
    const el = await renderPhone('default-country="ES" preferred-countries="PT, es" lang="en"')
    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}')

    const group = page.getByRole('group', { name: 'Suggested' })
    await expect.element(group).toBeVisible()
    expect(Array.from(suggestedGroup(el)?.querySelectorAll('[role="option"]') ?? []).map((o) => o.id)).toEqual([
      'option-PT',
      'option-ES',
    ])
    expect(optionCodes(el).slice(0, 2)).toEqual(['PT', 'ES'])
  })

  it('does not repeat preferred countries in the full list', async () => {
    const el = await renderPhone('default-country="ES" preferred-countries="PT,ES"')

    const codes = optionCodes(el)

    expect(codes).toHaveLength(getCountries().length)
    expect(codes.filter((code) => code === 'ES')).toHaveLength(1)
  })

  it('names the group with text-suggested', async () => {
    const el = await renderPhone('default-country="ES" preferred-countries="PT" text-suggested="Sugeridos"')
    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}')

    await expect.element(page.getByRole('group', { name: 'Sugeridos' })).toBeVisible()
  })

  it('drops the group and ranks preferred countries normally while filtering', async () => {
    const el = await renderPhone('default-country="ES" preferred-countries="US" lang="en"')

    await typeInCombobox(el, 'united')

    expect(suggestedGroup(el)).toBeNull()
    expect(optionCodes(el)).toEqual(['AE', 'GB', 'US'])
  })

  it('navigates across the group boundary with the arrow keys', async () => {
    const el = await renderPhone('default-country="PT" preferred-countries="ES,PT" lang="en"')
    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(activeDescendant(el)).toBe('option-PT')

    await userEvent.keyboard('{ArrowDown}')

    expect(activeDescendant(el)).toBe(`option-${optionCodes(el)[2]}`)
  })

  it('warns about and ignores unsupported codes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const el = await renderPhone('default-country="ES" preferred-countries="ES,XX"')

    expect(optionCodes(el)[0]).toBe('ES')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('preferred-countries'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('XX'))
  })

  it('has no axe violations with a suggested group', async () => {
    const el = await renderPhone('default-country="ES" preferred-countries="PT,ES"')
    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}')

    await expectNoAxeViolations(el)
  })
})

describe('only-countries', () => {
  it('restricts the list to the allowed countries', async () => {
    const el = await renderPhone('default-country="ES" only-countries="ES,PT,FR" lang="en"')

    expect(optionCodes(el).sort()).toEqual(['ES', 'FR', 'PT'])
  })

  it('restricts filtering results too', async () => {
    const el = await renderPhone('default-country="ES" only-countries="ES,PT,FR" lang="en"')

    await typeInCombobox(el, 'united')

    expect(optionCodes(el)).toEqual([])
  })

  it('ignores preferred countries that are not allowed', async () => {
    const el = await renderPhone('default-country="ES" only-countries="ES,PT" preferred-countries="US,PT"')

    expect(Array.from(suggestedGroup(el)?.querySelectorAll('[role="option"]') ?? []).map((o) => o.id)).toEqual([
      'option-PT',
    ])
  })

  it('falls back to the first allowed preferred country when the default is excluded', async () => {
    const el = await renderPhone('default-country="DE" only-countries="ES,PT" preferred-countries="PT" lang="en"')

    expect(el.country).toBe('PT')
    expect(combobox(el).value).toBe('Portugal +351')
  })

  it('warns about and ignores unsupported codes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const el = await renderPhone('default-country="ES" only-countries="ES,Spain"')

    expect(optionCodes(el)).toEqual(['ES'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only-countries'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Spain'))
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import type { TesPhoneElement } from '../../src/index'
import { systemColor } from '@teselia/shared/test'
import { chevron, combobox, numberInput, renderPhone } from '../support/phone'

function option(el: TesPhoneElement, code: string): HTMLElement {
  return el.shadowRoot?.getElementById(`option-${code}`) as HTMLElement
}

function allShadowElements(el: TesPhoneElement): Element[] {
  return Array.from(el.shadowRoot?.querySelectorAll('*') ?? [])
}

afterEach(async () => {
  document.body.innerHTML = ''
  await commands.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
})

describe('forced colors (Windows High Contrast)', () => {
  it('keeps the highlighted and selected options distinguishable', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderPhone('default-country="ES" lang="en" preferred-countries="ES,PT"')
    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')

    const highlighted = getComputedStyle(option(el, 'PT'))
    const selected = getComputedStyle(option(el, 'ES'))
    const plain = getComputedStyle(option(el, 'FR'))
    expect(highlighted.outlineStyle).toBe('solid')
    expect(plain.outlineStyle).toBe('none')
    expect(selected.backgroundColor).not.toBe(plain.backgroundColor)
  })

  it('keeps a visible focus indicator and field borders', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderPhone('default-country="ES"')
    await userEvent.click(numberInput(el))

    const style = getComputedStyle(numberInput(el))
    expect(style.outlineStyle).toBe('solid')
    expect(style.borderTopStyle).toBe('solid')
    expect(style.borderTopWidth).not.toBe('0px')
  })

  it('greys out a disabled field with the system GrayText color', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderPhone('value="+34612345678" lang="en" disabled')
    await expect.poll(() => numberInput(el).disabled).toBe(true)

    const grayText = systemColor('GrayText')
    expect(getComputedStyle(combobox(el)).color).toBe(grayText)
    expect(getComputedStyle(numberInput(el)).color).toBe(grayText)
    expect(getComputedStyle(chevron(el)).color).toBe(grayText)
  })
})

describe('reduced motion', () => {
  it('uses no transitions or animations at all', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' })
    const el = await renderPhone('default-country="ES"')
    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}')

    for (const element of allShadowElements(el)) {
      const style = getComputedStyle(element)
      expect(style.animationName).toBe('none')
      expect(style.transitionDuration.split(',').every((duration) => parseFloat(duration) === 0)).toBe(true)
    }
  })
})

describe('right-to-left layouts', () => {
  async function renderRtl(): Promise<TesPhoneElement> {
    const el = await renderPhone('default-country="ES" lang="ar"')
    ;(el.parentElement as HTMLElement).dir = 'rtl'
    return el
  }

  it('keeps the phone number left-to-right', async () => {
    const el = await renderRtl()

    expect(getComputedStyle(numberInput(el)).direction).toBe('ltr')
  })

  it('mirrors the layout: country first on the right, chevron at its inline end', async () => {
    const el = await renderRtl()
    const country = combobox(el).getBoundingClientRect()
    const number = numberInput(el).getBoundingClientRect()
    const toggle = chevron(el).getBoundingClientRect()

    expect(country.left).toBeGreaterThan(number.left)
    expect(toggle.left - country.left).toBeLessThan(country.right - toggle.right)
  })
})

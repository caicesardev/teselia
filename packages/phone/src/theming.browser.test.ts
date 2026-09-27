import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import { combobox, numberInput, renderPhone } from './testing/phone'

const addedStyles: HTMLStyleElement[] = []

function addPageStyles(css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  addedStyles.push(style)
}

function part(el: TesPhoneElement, name: string): HTMLElement | null {
  return el.shadowRoot?.querySelector(`[part~="${name}"]`) ?? null
}

const REQUIRED_PARTS = ['label', 'group', 'country', 'listbox', 'option', 'option-selected', 'number', 'hint', 'error']

afterEach(() => {
  document.body.innerHTML = ''
  for (const style of addedStyles.splice(0)) style.remove()
})

describe('parts', () => {
  it('exposes every documented part', async () => {
    const el = await renderPhone('default-country="ES" hint="Mobile or landline"')

    for (const name of REQUIRED_PARTS) {
      expect(part(el, name), name).not.toBeNull()
    }
  })

  it('lets page styles reach inner elements through ::part()', async () => {
    addPageStyles('tes-phone::part(number) { background-color: rgb(1, 2, 3); }')
    const el = await renderPhone('default-country="ES"')

    expect(getComputedStyle(numberInput(el)).backgroundColor).toBe('rgb(1, 2, 3)')
  })

  it('marks only the selected option with option-selected', async () => {
    addPageStyles('tes-phone::part(option-selected) { color: rgb(4, 5, 6); }')
    const el = await renderPhone('default-country="ES"')

    const selected = el.shadowRoot?.getElementById('option-ES') as HTMLElement
    const other = el.shadowRoot?.getElementById('option-PT') as HTMLElement
    expect(getComputedStyle(selected).color).toBe('rgb(4, 5, 6)')
    expect(getComputedStyle(other).color).not.toBe('rgb(4, 5, 6)')
  })
})

describe('custom states', () => {
  it('is :state(empty) until a number is typed', async () => {
    const el = await renderPhone('default-country="ES"')
    expect(el.matches(':state(empty)')).toBe(true)

    await userEvent.type(numberInput(el), '6')

    expect(el.matches(':state(empty)')).toBe(false)
  })

  it('is :state(open) while the country list is open', async () => {
    const el = await renderPhone('default-country="ES"')
    combobox(el).focus()

    await userEvent.keyboard('{ArrowDown}')
    expect(el.matches(':state(open)')).toBe(true)

    await userEvent.keyboard('{Escape}')
    expect(el.matches(':state(open)')).toBe(false)
  })

  it('is :state(invalid) only while an error is shown, like :user-invalid', async () => {
    const el = await renderPhone('default-country="ES" required')
    expect(el.matches(':state(invalid)')).toBe(false)

    await userEvent.type(numberInput(el), '612')
    numberInput(el).blur()
    await expect.poll(() => el.matches(':state(invalid)')).toBe(true)

    await userEvent.type(numberInput(el), '345678')
    await expect.poll(() => el.matches(':state(invalid)')).toBe(false)
  })

  it('lets page styles combine :state() with ::part()', async () => {
    addPageStyles('tes-phone:state(invalid)::part(number) { outline: 3px solid rgb(7, 8, 9); }')
    const el = await renderPhone('default-country="ES"')

    await userEvent.type(numberInput(el), '612')
    numberInput(el).blur()

    await expect.poll(() => getComputedStyle(numberInput(el)).outlineColor).toBe('rgb(7, 8, 9)')
  })
})

describe('design tokens on the element', () => {
  it('apply radius, spacing and font tokens set on the element', async () => {
    const el = await renderPhone('default-country="ES"')

    el.style.setProperty('--tes-radius', '12px')
    el.style.setProperty('--tes-font-family', 'monospace')

    expect(getComputedStyle(numberInput(el)).borderTopLeftRadius).toBe('12px')
    expect(getComputedStyle(numberInput(el)).fontFamily).toContain('monospace')
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from '../../src/index'
import { combobox, liveRegion, numberInput, renderPhone, typeInCombobox } from '../support/phone'

async function focusNumberWithCaretAt(el: TesPhoneElement, position: number): Promise<HTMLInputElement> {
  const input = numberInput(el)
  input.focus()
  input.setSelectionRange(position, position)
  return input
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('format as you type: typing', () => {
  it('formats the number for the selected country while typing', async () => {
    const el = await renderPhone('default-country="ES"')

    await userEvent.type(numberInput(el), '612345678')

    expect(numberInput(el).value).toBe('612 34 56 78')
    expect(numberInput(el).selectionStart).toBe('612 34 56 78'.length)
  })

  it('follows the conventions of the selected country', async () => {
    const el = await renderPhone('default-country="US"')

    await userEvent.type(numberInput(el), '2015550123')

    expect(numberInput(el).value).toBe('(201) 555-0123')
  })

  it('keeps submitting E.164', async () => {
    const el = await renderPhone('default-country="ES"')

    await userEvent.type(numberInput(el), '612345678')

    expect(el.value).toBe('+34612345678')
  })

  it('reformats the digits when the country changes', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await userEvent.type(numberInput(el), '612345678')

    await typeInCombobox(el, 'portugal')
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(combobox(el).value).toBe('Portugal +351')
    expect(numberInput(el).value).toBe('612 345 678')
  })

  it('does not announce anything while reformatting', async () => {
    const el = await renderPhone('default-country="ES"')

    await userEvent.type(numberInput(el), '612345678')
    await new Promise((resolve) => setTimeout(resolve, 700))

    expect(liveRegion(el).textContent?.trim()).toBe('')
  })
})

describe('format as you type: caret', () => {
  it('keeps the caret after the inserted digit when typing in the middle', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.type(numberInput(el), '61234')
    await focusNumberWithCaretAt(el, 3)

    await userEvent.keyboard('9')
    expect(numberInput(el).value).toBe('612 93 4')
    expect(numberInput(el).selectionStart).toBe(5)

    await userEvent.keyboard('8')
    expect(numberInput(el).value).toBe('612 98 34')
  })

  it('keeps the caret in place when deleting a digit in the middle', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.type(numberInput(el), '612345678')
    await focusNumberWithCaretAt(el, 6)

    await userEvent.keyboard('{Backspace}')

    expect(numberInput(el).value).toBe('612 35 67 8')
    expect(numberInput(el).selectionStart).toBe(5)
  })

  it('deletes the digit before a separator on Backspace instead of getting stuck', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.type(numberInput(el), '61234')
    await focusNumberWithCaretAt(el, 4)

    await userEvent.keyboard('{Backspace}')

    expect(numberInput(el).value).toBe('613 4')
    expect(numberInput(el).selectionStart).toBe(2)
  })

  it('deletes the digit after a separator on Delete instead of getting stuck', async () => {
    const el = await renderPhone('default-country="ES"')
    await userEvent.type(numberInput(el), '61234')
    await focusNumberWithCaretAt(el, 3)

    await userEvent.keyboard('{Delete}')

    expect(numberInput(el).value).toBe('612 4')
    expect(numberInput(el).selectionStart).toBe(3)
  })
})

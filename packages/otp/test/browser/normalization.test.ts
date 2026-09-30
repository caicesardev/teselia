import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, renderOtp } from '../support/otp'

function cellCount(el: TesOtpElement): number {
  return el.shadowRoot?.querySelectorAll('.cell').length ?? 0
}

function insertLikeTheBrowser(el: TesOtpElement, text: string, inputType: string): void {
  const input = codeInput(el)
  input.focus()
  input.value = text
  input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType, data: text }))
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('numeric codes', () => {
  it('asks phones for the numeric keypad', async () => {
    const el = await renderOtp('')

    expect(codeInput(el).getAttribute('inputmode')).toBe('numeric')
  })

  it('ignores letters and symbols typed between digits', async () => {
    const el = await renderOtp('')

    await userEvent.type(codeInput(el), '1a2#3')

    expect(el.value).toBe('123')
    expect(codeInput(el).value).toBe('123')
  })

  it('keeps every digit of a pasted code with spaces or hyphens', async () => {
    const el = await renderOtp('')

    insertLikeTheBrowser(el, '123 456', 'insertFromPaste')
    expect(el.value).toBe('123456')

    insertLikeTheBrowser(el, '654-321', 'insertFromPaste')
    expect(el.value).toBe('654321')
  })

  it('keeps every digit of a real clipboard paste longer than the code', async () => {
    const el = await renderOtp('')
    const source = document.createElement('input')
    source.value = '123 456'
    document.body.append(source)
    source.select()
    await userEvent.copy()

    codeInput(el).focus()
    await userEvent.paste()

    expect(el.value).toBe('123456')
  })

  it('converts full-width and Arabic-Indic digits', async () => {
    const el = await renderOtp('')

    insertLikeTheBrowser(el, '١٢٣٤٥٦', 'insertFromPaste')
    expect(el.value).toBe('123456')

    insertLikeTheBrowser(el, '１２３４５６', 'insertReplacementText')
    expect(el.value).toBe('123456')
  })

  it('cuts a longer paste at the length', async () => {
    const el = await renderOtp('')

    insertLikeTheBrowser(el, '123456789', 'insertFromPaste')

    expect(el.value).toBe('123456')
  })

  it('keeps the caret where it was when a character in the middle is dropped', async () => {
    const el = await renderOtp('')
    const input = codeInput(el)
    input.focus()

    input.value = '1-23'
    input.setSelectionRange(2, 2)
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: '-' }))

    expect(input.value).toBe('123')
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 2])
  })
})

describe('alphanumeric codes', () => {
  it('upper-cases letters and asks for the text keyboard in capitals', async () => {
    const el = await renderOtp('type="alphanumeric"')

    await userEvent.type(codeInput(el), 'ab1c')

    expect(el.value).toBe('AB1C')
    expect(codeInput(el).getAttribute('inputmode')).toBe('text')
    expect(codeInput(el).getAttribute('autocapitalize')).toBe('characters')
  })
})

describe('length', () => {
  it('draws one cell per character of the length attribute', async () => {
    const el = await renderOtp('length="4"')

    expect(cellCount(el)).toBe(4)

    insertLikeTheBrowser(el, '123456', 'insertFromPaste')
    expect(el.value).toBe('1234')
  })

  it('falls back to 6 with a warning for an invalid length', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const el = await renderOtp('length="20"')

    expect(cellCount(el)).toBe(6)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`length` must be an integer from 1 to 12'))
  })

  it('warns about an unknown type and treats the code as numeric', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const el = await renderOtp('type="letters"')
    await userEvent.type(codeInput(el), 'a1')

    expect(el.value).toBe('1')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`type` must be "numeric" or "alphanumeric"'))
  })

  it('re-normalizes the value when the length or the type changes', async () => {
    const el = await renderOtp('type="alphanumeric" value="AB1234"')

    el.setAttribute('length', '4')
    await expect.poll(() => el.value).toBe('AB12')

    el.setAttribute('type', 'numeric')
    await expect.poll(() => el.value).toBe('12')
  })
})

describe('values set from code', () => {
  it('uses the type set as a property, as frameworks do', async () => {
    const el = await renderOtp('')

    el.type = 'alphanumeric'
    el.value = 'ab12'

    expect(el.value).toBe('AB12')
  })

  it('normalizes the value property, the value attribute and the reset value', async () => {
    const el = await renderOtp('name="code" value="12 34 56"', 'form')
    expect(el.value).toBe('123456')

    el.value = '65-43-21'
    expect(el.value).toBe('654321')

    el.closest('form')?.reset()
    expect(el.value).toBe('123456')
  })
})

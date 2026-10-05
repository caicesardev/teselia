import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, renderOtp } from '../support/otp'

async function copyToClipboard(text: string): Promise<void> {
  const source = document.createElement('input')
  source.value = text
  document.body.append(source)
  source.select()
  await userEvent.copy()
  source.remove()
}

async function pasteInto(el: TesOtpElement, text: string): Promise<void> {
  await copyToClipboard(text)
  codeInput(el).focus()
  await userEvent.paste()
}

function compose(input: HTMLInputElement, steps: string[]): void {
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }))
  for (const text of steps) {
    input.value = text
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertCompositionText', data: text, isComposing: true }))
  }
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: steps.at(-1) }))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('typing', () => {
  it('fills the cells one by one and never grows past the length', async () => {
    const el = await renderOtp('')

    await userEvent.type(codeInput(el), '12345678')

    expect(el.value).toBe('123458')
  })

  it('replaces the character of a filled cell', async () => {
    const el = await renderOtp('')
    codeInput(el).focus()
    await userEvent.keyboard('123456{Home}{ArrowRight}9')

    expect(el.value).toBe('193456')
  })
})

describe('pasting', () => {
  it('fills an empty field with a pasted code', async () => {
    const el = await renderOtp('')

    await pasteInto(el, 'Your code: 123 456')

    expect(el.value).toBe('123456')
  })

  it('replaces the whole code when a complete code is pasted over another one', async () => {
    const el = await renderOtp('value="111111"')
    codeInput(el).focus()
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}')

    await pasteInto(el, '987654')

    expect(el.value).toBe('987654')
  })

  it('replaces a partial code when a complete code is pasted', async () => {
    const el = await renderOtp('value="12"')

    await pasteInto(el, '987-654')

    expect(el.value).toBe('987654')
  })

  it('inserts a shorter paste at the caret', async () => {
    const el = await renderOtp('value="12"')
    await copyToClipboard('34')
    codeInput(el).focus()
    await userEvent.keyboard('{End}')

    await userEvent.paste()

    expect(el.value).toBe('1234')
  })

  it('leaves the code alone when the pasted text has no valid characters, even over a selected cell', async () => {
    const el = await renderOtp('value="12"')
    await copyToClipboard('hello')
    codeInput(el).focus()
    await userEvent.keyboard('{Home}')

    await userEvent.paste()

    expect(el.value).toBe('12')
  })

  it('puts the caret on the last cell after a complete paste', async () => {
    const el = await renderOtp('')

    await pasteInto(el, '123456')

    expect([codeInput(el).selectionStart, codeInput(el).selectionEnd]).toEqual([5, 6])
  })
})

describe('autofill', () => {
  it('replaces a partial code with an autofilled one', async () => {
    const el = await renderOtp('value="12"')
    const input = codeInput(el)
    input.focus()

    input.value = '654321'
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertReplacementText', data: '654321' }))

    expect(el.value).toBe('654321')
  })
})

describe('input method composition', () => {
  it('does not rewrite the field while a composition is in progress', async () => {
    const el = await renderOtp('type="alphanumeric"')
    const input = codeInput(el)
    input.focus()
    const valuesDuringComposition: string[] = []
    input.addEventListener('input', () => valuesDuringComposition.push(input.value))

    compose(input, ['a', 'ab'])

    expect(valuesDuringComposition).toEqual(['a', 'ab'])
  })

  it('normalizes the composed text when the composition ends', async () => {
    const el = await renderOtp('type="alphanumeric"')
    const input = codeInput(el)
    input.focus()

    compose(input, ['a', 'ab'])

    expect(el.value).toBe('AB')
    expect(input.value).toBe('AB')
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

function errorText(el: TesOtpElement): string {
  return el.shadowRoot?.querySelector('#error')?.textContent?.trim() ?? ''
}

function formOf(el: TesOtpElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

async function renderInForm(attributes: string) {
  const el = await renderOtp(`name="code" ${attributes}`, 'form')
  const submissions: string[] = []
  formOf(el).addEventListener('submit', (event) => {
    event.preventDefault()
    submissions.push(String(new FormData(formOf(el)).get('code')))
  })
  formOf(el).append(Object.assign(document.createElement('button'), { textContent: 'Send' }))
  return { el, submissions }
}

async function typeThenLeave(el: TesOtpElement, text: string): Promise<void> {
  codeInput(el).focus()
  await userEvent.keyboard(text)
  await userEvent.tab()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('validity', () => {
  it('is valid when empty and not required', async () => {
    const el = await renderOtp('')

    expect(el.checkValidity()).toBe(true)
  })

  it('reports a missing value when required', async () => {
    const el = await renderOtp('required')

    expect(el.validity.valueMissing).toBe(true)
    expect(el.validationMessage).toBe('Enter the code')
  })

  it('reports a partial code as too short even when not required', async () => {
    const el = await renderOtp('value="123"')

    expect(el.validity.tooShort).toBe(true)
    expect(el.validationMessage).toBe('Enter all 6 digits')
  })

  it('names characters instead of digits for alphanumeric codes, and uses the length', async () => {
    const el = await renderOtp('type="alphanumeric" length="8" value="AB"')

    expect(el.validationMessage).toBe('Enter all 8 characters')
  })

  it('uses custom texts, with the length placeholder', async () => {
    const el = await renderOtp('required text-required="Introduce el código" text-incomplete="Faltan cifras: {length}"')
    expect(el.validationMessage).toBe('Introduce el código')

    el.value = '12'
    await expect.poll(() => el.validationMessage).toBe('Faltan cifras: 6')
  })

  it('is valid once the code is complete', async () => {
    const el = await renderOtp('required value="123456"')

    expect(el.checkValidity()).toBe(true)
  })
})

describe('error timing', () => {
  it('shows nothing on page load or while typing', async () => {
    const el = await renderOtp('required')
    codeInput(el).focus()
    await userEvent.keyboard('12')

    expect(errorText(el)).toBe('')
    expect(codeInput(el).hasAttribute('aria-invalid')).toBe(false)
  })

  it('shows nothing when the user tabs through without typing', async () => {
    const el = await renderOtp('required')

    codeInput(el).focus()
    await userEvent.tab()

    expect(errorText(el)).toBe('')
  })

  it('shows the error when the user leaves a partial code, linked to the field', async () => {
    const el = await renderOtp('')

    await typeThenLeave(el, '12')

    expect(errorText(el)).toBe('Enter all 6 digits')
    expect(codeInput(el).getAttribute('aria-invalid')).toBe('true')
    expect(codeInput(el).getAttribute('aria-describedby')).toBe('length error')
  })

  it('updates live after it is shown, and clears when the code is complete', async () => {
    const el = await renderOtp('')
    await typeThenLeave(el, '12')

    codeInput(el).focus()
    await userEvent.keyboard('{End}3456')

    expect(errorText(el)).toBe('')
    expect(codeInput(el).hasAttribute('aria-invalid')).toBe(false)
  })

  it('blocks submission, shows the error and focuses the field', async () => {
    const { el, submissions } = await renderInForm('required')

    await userEvent.click(formOf(el).querySelector('button') as HTMLButtonElement)

    expect(submissions).toEqual([])
    expect(errorText(el)).toBe('Enter the code')
    expect(el.shadowRoot?.activeElement).toBe(codeInput(el))
  })

  it('clears the errors on form reset', async () => {
    const { el } = await renderInForm('required')
    el.reportValidity()

    formOf(el).reset()

    await expect.poll(() => errorText(el)).toBe('')
  })
})

describe('custom validity', () => {
  it('shows a server error at once and blocks submission', async () => {
    const { el, submissions } = await renderInForm('value="123456"')

    el.setCustomValidity('That code has expired')

    await expect.poll(() => errorText(el)).toBe('That code has expired')
    expect(el.validity.customError).toBe(true)
    await userEvent.click(formOf(el).querySelector('button') as HTMLButtonElement)
    expect(submissions).toEqual([])
  })

  it('clears the server error as soon as the user edits the code', async () => {
    const { el, submissions } = await renderInForm('value="123456"')
    el.setCustomValidity('That code has expired')

    codeInput(el).focus()
    await userEvent.keyboard('{End}7')

    expect(el.validity.customError).toBe(false)
    expect(errorText(el)).toBe('')
    await userEvent.click(formOf(el).querySelector('button') as HTMLButtonElement)
    expect(submissions).toEqual(['123457'])
  })

  it('can be cleared from code, like a native input', async () => {
    const el = await renderOtp('value="123456"')
    el.setCustomValidity('That code has expired')

    el.setCustomValidity('')

    expect(el.checkValidity()).toBe(true)
  })
})

describe('error appearance', () => {
  it('draws 2px error borders, so the state does not rely on color alone', async () => {
    const el = await renderOtp('')
    await typeThenLeave(el, '1')

    const cell = el.shadowRoot?.querySelector('.cell') as HTMLElement
    expect(getComputedStyle(cell).borderTopWidth).toBe('2px')
  })

  it('has no axe violations while showing an error', async () => {
    const el = await renderOtp('required')
    el.reportValidity()

    await expect.poll(() => errorText(el)).toBe('Enter the code')
    await expectNoAxeViolations(el)
  })
})

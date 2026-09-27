import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import type { TesPhoneElement } from '../../src/index'
import { combobox, expectNoAxeViolations, numberInput, renderPhone } from '../support/phone'

async function renderInForm(attributes: string): Promise<{ el: TesPhoneElement; form: HTMLFormElement }> {
  const el = await renderPhone(`name="phone" lang="en" ${attributes}`, 'form')
  return { el, form: el.closest('form') as HTMLFormElement }
}

function errorText(el: TesPhoneElement): string {
  return el.shadowRoot?.querySelector('#error')?.textContent?.trim() ?? ''
}

function describedBy(input: HTMLInputElement): string[] {
  return (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
}

async function typeNumberAndLeave(el: TesPhoneElement, digits: string): Promise<void> {
  await userEvent.type(numberInput(el), digits)
  numberInput(el).blur()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('validity', () => {
  it('reports valueMissing with text-required when required and empty', async () => {
    const { el } = await renderInForm('default-country="ES" required')

    await expect.poll(() => el.validity.valueMissing).toBe(true)
    expect(el.validationMessage).toBe('Enter a phone number')
  })

  it('is valid when optional and empty', async () => {
    const { el } = await renderInForm('default-country="ES"')

    await expect.poll(() => el.validity.valid).toBe(true)
  })

  it('reports typeMismatch with the country in text-invalid for an invalid number', async () => {
    const { el, form } = await renderInForm('default-country="ES"')

    await userEvent.type(numberInput(el), '612')

    expect(el.validity.typeMismatch).toBe(true)
    expect(el.validationMessage).toBe('Enter a valid phone number for Spain +34')
    expect(form.checkValidity()).toBe(false)
  })

  it('becomes valid when the number is complete', async () => {
    const { el, form } = await renderInForm('default-country="ES" required')

    await userEvent.type(numberInput(el), '612345678')

    await expect.poll(() => el.validity.valid).toBe(true)
    expect(form.checkValidity()).toBe(true)
  })

  it('asks for a country when none is selected and the number is not international', async () => {
    const { el } = await renderInForm('only-countries="ES" default-country="FR"')

    await typeNumberAndLeave(el, '612345678')

    expect(el.validity.valueMissing).toBe(true)
    expect(errorText(el)).toBe('Select a country code')
    expect(combobox(el).getAttribute('aria-invalid')).toBe('true')
    expect(describedBy(combobox(el))).toContain('error')
  })
})

describe('when errors are shown', () => {
  it('does not show an error while the user is typing', async () => {
    const { el } = await renderInForm('default-country="ES" required')

    await userEvent.type(numberInput(el), '612')

    expect(errorText(el)).toBe('')
    expect(numberInput(el).hasAttribute('aria-invalid')).toBe(false)
  })

  it('shows the error when leaving the field after editing it', async () => {
    const { el } = await renderInForm('default-country="ES"')

    await typeNumberAndLeave(el, '612')

    expect(errorText(el)).toBe('Enter a valid phone number for Spain +34')
    expect(numberInput(el).getAttribute('aria-invalid')).toBe('true')
    expect(describedBy(numberInput(el))).toContain('error')
  })

  it('does not show an error when leaving an untouched field', async () => {
    const { el } = await renderInForm('default-country="ES" required')

    numberInput(el).focus()
    numberInput(el).blur()
    await nextTick()

    expect(errorText(el)).toBe('')
  })

  it('shows the error and blocks submission when the form is submitted', async () => {
    const { el, form } = await renderInForm('default-country="ES" required')
    let submitted = false
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      submitted = true
    })

    form.requestSubmit()

    expect(submitted).toBe(false)
    await expect.poll(() => errorText(el)).toBe('Enter a phone number')
  })

  it('shows the error on reportValidity()', async () => {
    const { el } = await renderInForm('default-country="ES" required')

    expect(el.reportValidity()).toBe(false)

    await expect.poll(() => errorText(el)).toBe('Enter a phone number')
  })

  it('updates the shown error live and clears it once the number is valid', async () => {
    const { el } = await renderInForm('default-country="ES" required')
    await typeNumberAndLeave(el, '612')

    await userEvent.clear(numberInput(el))
    expect(errorText(el)).toBe('Enter a phone number')

    await userEvent.type(numberInput(el), '612345678')
    expect(errorText(el)).toBe('')
    expect(numberInput(el).hasAttribute('aria-invalid')).toBe(false)
    expect(describedBy(numberInput(el))).not.toContain('error')
  })

  it('hides errors after a form reset', async () => {
    const { el, form } = await renderInForm('default-country="ES" required')
    await typeNumberAndLeave(el, '612')

    form.reset()

    await expect.poll(() => errorText(el)).toBe('')
    expect(numberInput(el).hasAttribute('aria-invalid')).toBe(false)
  })

  it('announces errors politely', async () => {
    const { el } = await renderInForm('default-country="ES"')

    expect(el.shadowRoot?.querySelector('#error')?.getAttribute('aria-live')).toBe('polite')
  })
})

describe('messages and hint', () => {
  it('uses text-required, text-invalid and text-country-required', async () => {
    const { el } = await renderInForm(
      'default-country="ES" required text-required="Introduce un teléfono" text-invalid="Número no válido para {country}"',
    )

    expect(el.validationMessage).toBe('Introduce un teléfono')
    await typeNumberAndLeave(el, '612')
    expect(errorText(el)).toBe('Número no válido para Spain +34')
  })

  it('renders the hint and describes the number field with it', async () => {
    const { el } = await renderInForm('default-country="ES" hint="Mobile or landline"')

    expect(el.shadowRoot?.querySelector('#hint')?.textContent?.trim()).toBe('Mobile or landline')
    expect(describedBy(numberInput(el))).toEqual(['hint'])
  })

  it('describes the number field with both the hint and the error', async () => {
    const { el } = await renderInForm('default-country="ES" hint="Mobile or landline"')

    await typeNumberAndLeave(el, '612')

    expect(describedBy(numberInput(el))).toEqual(['hint', 'error'])
  })

  it('has no axe violations while showing an error', async () => {
    const { el } = await renderInForm('default-country="ES" hint="Mobile or landline"')
    await typeNumberAndLeave(el, '612')

    await expectNoAxeViolations(el)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import { numberInput, renderPhone, typeInCombobox } from './testing/phone'

async function renderInForm(attributes: string): Promise<{ el: TesPhoneElement; form: HTMLFormElement }> {
  const el = await renderPhone(`name="phone" ${attributes}`, 'form')
  return { el, form: el.closest('form') as HTMLFormElement }
}

function submitted(form: HTMLFormElement): FormDataEntryValue | null {
  return new FormData(form).get('phone')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('national number field', () => {
  it('is a left-to-right telephone input with a numeric keypad', async () => {
    const input = numberInput(await renderPhone('default-country="ES"'))

    expect(input.type).toBe('tel')
    expect(input.inputMode).toBe('tel')
    expect(input.dir).toBe('ltr')
  })

  it('autocompletes as a phone number by default', async () => {
    const input = numberInput(await renderPhone('default-country="ES"'))

    expect(input.getAttribute('autocomplete')).toBe('tel')
  })

  it('forwards the autocomplete attribute', async () => {
    const input = numberInput(await renderPhone('default-country="ES" autocomplete="work tel"'))

    expect(input.getAttribute('autocomplete')).toBe('work tel')
  })
})

describe('E.164 form value', () => {
  it('submits the national number as E.164 for the selected country', async () => {
    const { el, form } = await renderInForm('default-country="ES"')

    await userEvent.type(numberInput(el), '612 34 56 78')

    expect(submitted(form)).toBe('+34612345678')
    expect(el.value).toBe('+34612345678')
  })

  it('submits an empty value when the field is empty', async () => {
    const { form } = await renderInForm('default-country="ES"')

    expect(submitted(form)).toBe('')
  })

  it('submits an empty value when the input cannot be parsed', async () => {
    const { el, form } = await renderInForm('default-country="ES"')

    await userEvent.type(numberInput(el), 'abc')

    expect(submitted(form)).toBe('')
  })

  it('recomputes the value when the country changes, keeping the digits', async () => {
    const { el, form } = await renderInForm('default-country="ES" lang="en"')
    await userEvent.type(numberInput(el), '912345678')

    await typeInCombobox(el, 'portugal')
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(numberInput(el).value).toBe('912345678')
    expect(submitted(form)).toBe('+351912345678')
  })
})

describe('read-only number properties', () => {
  it('expose country, calling code, formatted national number and validity', async () => {
    const el = await renderPhone('default-country="ES"')

    await userEvent.type(numberInput(el), '612345678')

    expect(el.country).toBe('ES')
    expect(el.callingCode).toBe('34')
    expect(el.nationalNumber).toBe('612 34 56 78')
    expect(el.valid).toBe(true)
  })

  it('report an incomplete number as not valid', async () => {
    const el = await renderPhone('default-country="ES"')

    await userEvent.type(numberInput(el), '612')

    expect(el.value).toBe('+34612')
    expect(el.valid).toBe(false)
  })

  it('report no calling code when no country is selected', async () => {
    const el = await renderPhone('only-countries="ES" default-country="FR"')

    expect(el.country).toBe('')
    expect(el.callingCode).toBe('')
  })
})

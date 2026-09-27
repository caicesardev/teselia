import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import { combobox, liveRegion, numberInput, renderPhone } from './testing/phone'

const ANNOUNCEMENT = { timeout: 3000 }

function errorText(el: TesPhoneElement): string {
  return el.shadowRoot?.querySelector('#error')?.textContent?.trim() ?? ''
}

function simulateBrowserAutofill(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertReplacementText' }))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('international numbers in the number field', () => {
  it('selects the country of a pasted number and shows it in national format', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await userEvent.fill(numberInput(el), '+44 20 7946 0958')

    expect(el.country).toBe('GB')
    expect(numberInput(el).value).toBe('020 7946 0958')
    expect(el.value).toBe('+442079460958')
    expect(combobox(el).value).toBe('United Kingdom +44')
  })

  it('announces the country change', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await userEvent.fill(numberInput(el), '+44 20 7946 0958')

    await expect.poll(() => liveRegion(el).textContent?.trim(), ANNOUNCEMENT).toBe('Country set to United Kingdom +44')
  })

  it('follows a number typed with a leading +', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await userEvent.type(numberInput(el), '+442079460958')

    expect(el.country).toBe('GB')
    expect(el.value).toBe('+442079460958')
    expect(numberInput(el).value).toBe('020 7946 0958')
  })

  it('treats a leading 00 as the international prefix', async () => {
    const el = await renderPhone('default-country="US" lang="en"')

    await userEvent.fill(numberInput(el), '0044 20 7946 0958')

    expect(el.country).toBe('GB')
    expect(el.value).toBe('+442079460958')
  })

  it('handles browser autofill of a full international number', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    simulateBrowserAutofill(numberInput(el), '+1 201 555 0123')

    await expect.poll(() => el.country).toBe('US')
    expect(el.value).toBe('+12015550123')
  })

  it('strips the prefix without announcing when the country is already selected', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await userEvent.fill(numberInput(el), '+34 612 34 56 78')
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(el.country).toBe('ES')
    expect(numberInput(el).value).toBe('612 34 56 78')
    expect(liveRegion(el).textContent?.trim()).toBe('')
  })

  it('uses text-country-changed for the announcement', async () => {
    const el = await renderPhone('default-country="ES" lang="en" text-country-changed="País: {country}"')

    await userEvent.fill(numberInput(el), '+44 20 7946 0958')

    await expect.poll(() => liveRegion(el).textContent?.trim(), ANNOUNCEMENT).toBe('País: United Kingdom +44')
  })
})

describe('international numbers from excluded countries', () => {
  it('keeps the country and reports text-not-allowed', async () => {
    const el = await renderPhone('default-country="ES" only-countries="ES,PT" lang="en"')

    await userEvent.fill(numberInput(el), '+44 20 7946 0958')
    numberInput(el).blur()

    expect(el.country).toBe('ES')
    expect(el.validity.typeMismatch).toBe(true)
    await expect.poll(() => errorText(el)).toBe('Numbers from United Kingdom +44 are not accepted')
  })

  it('clears the error once an allowed number is entered', async () => {
    const el = await renderPhone('default-country="ES" only-countries="ES,PT" lang="en"')
    await userEvent.fill(numberInput(el), '+44 20 7946 0958')
    numberInput(el).blur()

    await userEvent.fill(numberInput(el), '+351 912 345 678')

    expect(el.country).toBe('PT')
    expect(el.validity.valid).toBe(true)
    await expect.poll(() => errorText(el)).toBe('')
  })

  it('uses text-not-allowed', async () => {
    const el = await renderPhone(
      'default-country="ES" only-countries="ES" lang="en" text-not-allowed="{country} no está permitido"',
    )

    await userEvent.fill(numberInput(el), '+44 20 7946 0958')

    expect(el.validationMessage).toBe('United Kingdom +44 no está permitido')
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { TesOtpElement, define } from '../../src/index'
import { codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

function formOf(el: TesOtpElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('<tes-otp> registration', () => {
  it('auto-registers as a form-associated custom element', () => {
    expect(customElements.get('tes-otp')).toBe(TesOtpElement)
    expect(TesOtpElement.formAssociated).toBe(true)
  })

  it('can be registered under a custom tag name too', () => {
    define('my-otp')

    expect(customElements.get('my-otp')?.prototype).toBeInstanceOf(TesOtpElement)
  })
})

describe('<tes-otp> accessibility', () => {
  it('exposes a textbox named by the label attribute', async () => {
    await renderOtp('')

    await expect.element(page.getByRole('textbox', { name: 'Verification code' })).toBeVisible()
  })

  it('asks the browser for one-time code autofill by default', async () => {
    const el = await renderOtp('')

    expect(codeInput(el).getAttribute('autocomplete')).toBe('one-time-code')
  })

  it('focuses the inner input from focus() and from the label', async () => {
    const el = await renderOtp('')

    el.focus()
    expect(el.shadowRoot?.activeElement).toBe(codeInput(el))

    codeInput(el).blur()
    await userEvent.click(el.shadowRoot?.querySelector('label') as HTMLLabelElement)
    expect(el.shadowRoot?.activeElement).toBe(codeInput(el))
  })

  it('has no axe violations', async () => {
    await expectNoAxeViolations(await renderOtp(''))
  })
})

describe('<tes-otp> form value', () => {
  it('submits what the user types under its name', async () => {
    const el = await renderOtp('name="code"', 'form')

    await userEvent.type(codeInput(el), '123456')

    expect(el.value).toBe('123456')
    expect(new FormData(formOf(el)).get('code')).toBe('123456')
  })

  it('starts from the value attribute and restores it on reset', async () => {
    const el = await renderOtp('name="code" value="111111"', 'form')
    expect(codeInput(el).value).toBe('111111')

    await userEvent.clear(codeInput(el))
    await userEvent.type(codeInput(el), '222222')
    formOf(el).reset()

    await expect.poll(() => codeInput(el).value).toBe('111111')
    expect(new FormData(formOf(el)).get('code')).toBe('111111')
  })

  it('follows the value attribute only until the value is edited, like a native input', async () => {
    const el = await renderOtp('value="111111"')

    el.setAttribute('value', '222222')
    expect(el.value).toBe('222222')

    el.value = '333333'
    el.setAttribute('value', '444444')

    expect(el.value).toBe('333333')
    expect(el.defaultValue).toBe('444444')
  })

  it('is disabled by a disabled fieldset and then not submitted', async () => {
    const form = document.createElement('form')
    form.innerHTML = '<fieldset disabled><tes-otp label="Verification code" name="code" value="123456"></tes-otp></fieldset>'
    document.body.append(form)
    const el = form.querySelector('tes-otp') as TesOtpElement

    await expect.poll(() => codeInput(el)?.disabled).toBe(true)
    expect(new FormData(form).has('code')).toBe(false)
  })
})

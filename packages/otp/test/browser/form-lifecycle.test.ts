import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { cellElements, codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

async function renderInForm(attributes: string): Promise<{ el: TesOtpElement; form: HTMLFormElement }> {
  const el = await renderOtp(`name="code" ${attributes}`, 'form')
  return { el, form: el.closest('form') as HTMLFormElement }
}

async function copyToClipboard(text: string): Promise<void> {
  const source = document.createElement('input')
  source.value = text
  document.body.append(source)
  source.select()
  await userEvent.copy()
  source.remove()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('readonly', () => {
  it('blocks typing but still submits the value', async () => {
    const { el, form } = await renderInForm('value="123456" readonly')

    await userEvent.type(codeInput(el), '9')

    expect(codeInput(el).readOnly).toBe(true)
    expect(el.value).toBe('123456')
    expect(new FormData(form).get('code')).toBe('123456')
  })

  it('blocks pasting a complete code too', async () => {
    const { el } = await renderInForm('value="123456" readonly')
    await copyToClipboard('987654')
    codeInput(el).focus()

    await userEvent.paste()

    expect(el.value).toBe('123456')
  })

  it('is barred from constraint validation, like a native readonly input', async () => {
    const { el, form } = await renderInForm('readonly required')

    expect(el.willValidate).toBe(false)
    expect(form.checkValidity()).toBe(true)
  })

  it('reflects the readOnly property to the attribute', async () => {
    const { el } = await renderInForm('')

    el.readOnly = true

    expect(el.hasAttribute('readonly')).toBe(true)
    await expect.poll(() => codeInput(el).readOnly).toBe(true)
  })

  it('has no axe violations', async () => {
    const { el } = await renderInForm('value="123456" readonly')

    await expectNoAxeViolations(el)
  })
})

describe('disabled', () => {
  it('disables the field and excludes the value from submission', async () => {
    const { el, form } = await renderInForm('value="123456" disabled')

    await expect.poll(() => codeInput(el).disabled).toBe(true)
    expect(new FormData(form).has('code')).toBe(false)
  })

  it('follows the disabled property in both directions', async () => {
    const { el, form } = await renderInForm('value="123456"')

    el.disabled = true
    await expect.poll(() => codeInput(el).disabled).toBe(true)

    el.disabled = false
    await expect.poll(() => codeInput(el).disabled).toBe(false)
    expect(new FormData(form).get('code')).toBe('123456')
  })

  it.each([
    ['the disabled attribute', (el: TesOtpElement) => (el.disabled = true)],
    ['a disabled fieldset', (el: TesOtpElement) => ((el.parentElement as HTMLFieldSetElement).disabled = true)],
  ])('looks disabled through %s: muted characters and filled cells', async (_, disable) => {
    const enabled = await renderOtp('value="123"', 'fieldset')
    const disabled = await renderOtp('value="123"', 'fieldset')

    disable(disabled)
    await expect.poll(() => codeInput(disabled).disabled).toBe(true)

    const [enabledFilled, , , enabledEmpty] = cellElements(enabled).map((cell) => getComputedStyle(cell))
    const [disabledFilled, , , disabledEmpty] = cellElements(disabled).map((cell) => getComputedStyle(cell))
    expect(disabledFilled?.color).not.toBe(enabledFilled?.color)
    expect(disabledEmpty?.backgroundColor).not.toBe(enabledEmpty?.backgroundColor)
    expect(getComputedStyle(codeInput(disabled)).cursor).toBe('not-allowed')
  })

  it('has no axe violations', async () => {
    const { el } = await renderInForm('value="123" disabled')
    await expect.poll(() => codeInput(el).disabled).toBe(true)

    await expectNoAxeViolations(el)
  })
})

describe('form state restore', () => {
  it('restores the code the user had typed', async () => {
    const { el } = await renderInForm('')

    el.formStateRestoreCallback('123456', 'restore')

    expect(el.value).toBe('123456')
    await expect.poll(() => codeInput(el).value).toBe('123456')
  })

  it('normalizes a value from browser autocomplete', async () => {
    const { el } = await renderInForm('')

    el.formStateRestoreCallback('123 456', 'autocomplete')

    expect(el.value).toBe('123456')
  })

  it('ignores restored data that is not text', async () => {
    const { el } = await renderInForm('value="111111"')

    el.formStateRestoreCallback(new FormData(), 'restore')

    expect(el.value).toBe('111111')
  })

  it('does not submit or fire complete for a restored code, even with autosubmit', async () => {
    const { el, form } = await renderInForm('autosubmit')
    const fired: string[] = []
    el.addEventListener('complete', () => fired.push('complete'))
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      fired.push('submit')
    })

    el.formStateRestoreCallback('123456', 'restore')

    expect(fired).toEqual([])
  })

  it('keeps a restored value when the value attribute changes later', async () => {
    const { el } = await renderInForm('value="111111"')

    el.formStateRestoreCallback('222222', 'restore')
    el.setAttribute('value', '333333')

    expect(el.value).toBe('222222')
  })
})

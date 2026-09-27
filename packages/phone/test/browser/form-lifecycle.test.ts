import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from '../../src/index'
import { combobox, expectNoAxeViolations, isExpanded, numberInput, renderPhone } from '../support/phone'

async function renderInForm(attributes: string): Promise<{ el: TesPhoneElement; form: HTMLFormElement }> {
  const el = await renderPhone(`name="phone" lang="en" ${attributes}`, 'form')
  return { el, form: el.closest('form') as HTMLFormElement }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('readonly', () => {
  it('blocks editing the number but still submits the value', async () => {
    const { el, form } = await renderInForm('value="+34612345678" readonly')

    await userEvent.type(numberInput(el), '9')

    expect(numberInput(el).readOnly).toBe(true)
    expect(el.value).toBe('+34612345678')
    expect(new FormData(form).get('phone')).toBe('+34612345678')
  })

  it('keeps the country combobox closed', async () => {
    const { el } = await renderInForm('value="+34612345678" readonly')

    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(combobox(el))

    expect(combobox(el).readOnly).toBe(true)
    expect(isExpanded(el)).toBe(false)
    expect(el.country).toBe('ES')
  })

  it('is barred from constraint validation, like a native readonly input', async () => {
    const { el, form } = await renderInForm('default-country="ES" readonly required')

    expect(el.willValidate).toBe(false)
    expect(form.checkValidity()).toBe(true)
  })

  it('reflects the readOnly property to the attribute', async () => {
    const { el } = await renderInForm('default-country="ES"')

    el.readOnly = true

    expect(el.hasAttribute('readonly')).toBe(true)
    await expect.poll(() => numberInput(el).readOnly).toBe(true)
  })

  it('has no axe violations', async () => {
    const { el } = await renderInForm('value="+34612345678" hint="Mobile only" readonly')

    await expectNoAxeViolations(el)
  })
})

describe('disabled', () => {
  it('disables both controls and excludes the value from submission', async () => {
    const { el, form } = await renderInForm('value="+34612345678" disabled')

    await expect.poll(() => numberInput(el).disabled).toBe(true)
    expect(combobox(el).disabled).toBe(true)
    expect(new FormData(form).has('phone')).toBe(false)
  })

  it('follows the disabled property in both directions', async () => {
    const { el, form } = await renderInForm('value="+34612345678"')

    el.disabled = true
    await expect.poll(() => combobox(el).disabled).toBe(true)
    expect(numberInput(el).disabled).toBe(true)

    el.disabled = false
    await expect.poll(() => combobox(el).disabled).toBe(false)
    expect(new FormData(form).get('phone')).toBe('+34612345678')
  })

  it('has no axe violations', async () => {
    const { el } = await renderInForm('value="+34612345678" hint="Mobile only" disabled')
    await expect.poll(() => numberInput(el).disabled).toBe(true)

    await expectNoAxeViolations(el)
  })
})

describe('form state restore', () => {
  it('saves the typed number and country as form state and restores both', async () => {
    const setFormValue = vi.spyOn(ElementInternals.prototype, 'setFormValue')
    const { el: source } = await renderInForm('default-country="ES"')
    await userEvent.type(numberInput(source), '612345678')
    const savedState = setFormValue.mock.calls.at(-1)?.[1]
    expect(typeof savedState).toBe('string')

    const { el: restored } = await renderInForm('default-country="FR"')
    restored.formStateRestoreCallback(savedState as string, 'restore')

    await expect.poll(() => restored.value).toBe('+34612345678')
    expect(restored.country).toBe('ES')
    expect(numberInput(restored).value).toBe('612 34 56 78')
  })

  it('treats an autocomplete restore as a value', async () => {
    const { el } = await renderInForm('default-country="ES"')

    el.formStateRestoreCallback('+442079460958', 'autocomplete')

    await expect.poll(() => el.country).toBe('GB')
    expect(el.value).toBe('+442079460958')
  })

  it('ignores malformed saved state', async () => {
    const { el } = await renderInForm('default-country="ES" value="+34612345678"')

    el.formStateRestoreCallback('not json', 'restore')
    el.formStateRestoreCallback(JSON.stringify({ nationalInput: '1', country: 'XX' }), 'restore')

    expect(el.value).toBe('+34612345678')
  })
})

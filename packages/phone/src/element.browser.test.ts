import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { TesPhoneElement, define } from './index'

function render(html: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  return container
}

async function mounted(container: HTMLElement): Promise<TesPhoneElement> {
  const el = container.querySelector('tes-phone')
  if (!el) throw new Error('tes-phone not found')
  await waitForVueAsyncMount(el)
  return el
}

async function waitForVueAsyncMount(el: TesPhoneElement): Promise<void> {
  await expect.poll(() => el.shadowRoot?.querySelector<HTMLInputElement>('#number')).toBeTruthy()
}

function innerInput(el: TesPhoneElement): HTMLInputElement {
  const input = el.shadowRoot?.querySelector<HTMLInputElement>('#number')
  if (!input) throw new Error('inner input not found')
  return input
}

function formOf(container: HTMLElement): HTMLFormElement {
  const form = container.querySelector('form')
  if (!form) throw new Error('form not found')
  return form
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('<tes-phone> registration', () => {
  it('auto-registers as a form-associated custom element', () => {
    expect(customElements.get('tes-phone')).toBe(TesPhoneElement)
    expect(TesPhoneElement.formAssociated).toBe(true)
  })

  it('can be registered under a custom tag name too', () => {
    define('my-phone')
    const ctor = customElements.get('my-phone')
    expect(ctor).toBeDefined()
    expect(ctor?.prototype).toBeInstanceOf(TesPhoneElement)
  })
})

describe('<tes-phone> accessibility', () => {
  it('exposes a textbox named by the label attribute', async () => {
    await mounted(render('<tes-phone label="Phone number" default-country="ES"></tes-phone>'))

    await expect.element(page.getByRole('textbox', { name: 'Phone number' })).toBeVisible()
  })

  it('moves focus to the number field when focused', async () => {
    const el = await mounted(render('<tes-phone label="Phone number" default-country="ES"></tes-phone>'))

    el.focus()

    expect(el.shadowRoot?.activeElement).toBe(innerInput(el))
  })

  it('has no axe violations', async () => {
    const container = render('<main><tes-phone label="Phone number" default-country="ES"></tes-phone></main>')
    await mounted(container)

    const results = await axe.run(container)

    expect(results.violations).toEqual([])
  })

  it('does not leak host attributes into the shadow root', async () => {
    const el = await mounted(
      render('<tes-phone name="phone" value="+34612345678" label="Phone number"></tes-phone>'),
    )

    expect(el.shadowRoot?.querySelector('[name], .field[value]')).toBeNull()
  })
})

describe('<tes-phone> value semantics', () => {
  it('uses the E.164 value attribute as the initial country and number', async () => {
    const el = await mounted(render('<tes-phone value="+34612345678" label="Phone number"></tes-phone>'))

    expect(el.value).toBe('+34612345678')
    expect(el.defaultValue).toBe('+34612345678')
    expect(el.country).toBe('ES')
    expect(innerInput(el).value).toBe('612345678')
  })

  it('returns the live value typed by the user, not the attribute', async () => {
    const el = await mounted(render('<tes-phone value="+34612" label="Phone number"></tes-phone>'))

    await userEvent.type(innerInput(el), '345678')

    expect(el.value).toBe('+34612345678')
    expect(el.getAttribute('value')).toBe('+34612')
  })

  it('selects the country and fills the number when value is set', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" default-country="ES"></tes-phone></form>',
    )
    const el = await mounted(container)

    el.value = '+442079460958'

    await expect.poll(() => innerInput(el).value).toBe('2079460958')
    expect(el.country).toBe('GB')
    expect(new FormData(formOf(container)).get('phone')).toBe('+442079460958')
    expect(el.getAttribute('value')).toBeNull()
  })

  it('accepts a value set before the element is connected', async () => {
    const el = document.createElement('tes-phone')
    el.setAttribute('label', 'Phone number')
    el.value = '+351912345678'

    const container = render('')
    container.append(el)
    await waitForVueAsyncMount(el)

    expect(innerInput(el).value).toBe('912345678')
    expect(el.country).toBe('PT')
  })

  it('follows value attribute changes until the value is edited', async () => {
    const el = await mounted(render('<tes-phone value="+34612345678" label="Phone number"></tes-phone>'))

    el.setAttribute('value', '+33612345678')
    await expect.poll(() => el.country).toBe('FR')

    await userEvent.clear(innerInput(el))
    await userEvent.type(innerInput(el), '698765432')
    el.setAttribute('value', '+4915112345678')

    expect(el.value).toBe('+33698765432')
    expect(el.defaultValue).toBe('+4915112345678')
  })

  it('reflects defaultValue to the value attribute', async () => {
    const el = await mounted(render('<tes-phone label="Phone number" default-country="ES"></tes-phone>'))

    el.defaultValue = '+393123456789'

    expect(el.getAttribute('value')).toBe('+393123456789')
    await expect.poll(() => el.value).toBe('+393123456789')
  })

  it('restores defaultValue on reset and follows the attribute again', async () => {
    const container = render(
      '<form><tes-phone name="phone" value="+34612345678" label="Phone number"></tes-phone></form>',
    )
    const el = await mounted(container)

    el.value = '+34699999999'
    formOf(container).reset()

    await expect.poll(() => el.value).toBe('+34612345678')
    expect(innerInput(el).value).toBe('612345678')

    el.setAttribute('value', '+34611111111')
    await expect.poll(() => el.value).toBe('+34611111111')
  })
})

describe('<tes-phone> form integration', () => {
  it('submits the typed number as E.164 under its name', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" default-country="ES"></tes-phone></form>',
    )
    const el = await mounted(container)

    await userEvent.type(page.getByRole('textbox', { name: 'Phone number' }), '612 34 56 78')

    expect(new FormData(formOf(container)).get('phone')).toBe('+34612345678')
    expect(el.form).toBe(formOf(container))
  })

  it('reports valueMissing when required and empty', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" default-country="ES" required></tes-phone></form>',
    )
    const el = await mounted(container)

    await expect.poll(() => el.validity.valueMissing).toBe(true)
    expect(formOf(container).checkValidity()).toBe(false)

    await userEvent.type(innerInput(el), '612345678')

    await expect.poll(() => el.validity.valid).toBe(true)
    expect(formOf(container).checkValidity()).toBe(true)
  })

  it('restores the initial value on form reset', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" value="+34612"></tes-phone></form>',
    )
    const el = await mounted(container)

    await userEvent.type(innerInput(el), '345678')
    expect(new FormData(formOf(container)).get('phone')).toBe('+34612345678')

    formOf(container).reset()

    await expect.poll(() => innerInput(el).value).toBe('612')
    expect(new FormData(formOf(container)).get('phone')).toBe('+34612')
  })

  it('is disabled by a disabled fieldset and excluded from submission', async () => {
    const container = render(
      '<form><fieldset><tes-phone name="phone" label="Phone number" value="+34612345678"></tes-phone></fieldset></form>',
    )
    const el = await mounted(container)
    const fieldset = container.querySelector('fieldset') as HTMLFieldSetElement

    fieldset.disabled = true

    await expect.poll(() => innerInput(el).disabled).toBe(true)
    expect(new FormData(formOf(container)).has('phone')).toBe(false)
  })
})

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
  await expect.poll(() => el.shadowRoot?.querySelector('input')).toBeTruthy()
}

function innerInput(el: TesPhoneElement): HTMLInputElement {
  const input = el.shadowRoot?.querySelector('input')
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
    await mounted(render('<tes-phone label="Phone number"></tes-phone>'))

    await expect.element(page.getByRole('textbox', { name: 'Phone number' })).toBeVisible()
  })

  it('delegates focus to the inner input', async () => {
    const el = await mounted(render('<tes-phone label="Phone number"></tes-phone>'))

    el.focus()

    expect(el.shadowRoot?.activeElement).toBe(innerInput(el))
  })

  it('has no axe violations', async () => {
    const container = render('<main><tes-phone label="Phone number"></tes-phone></main>')
    await mounted(container)

    const results = await axe.run(container)

    expect(results.violations).toEqual([])
  })

  it('does not leak host attributes into the shadow root', async () => {
    const el = await mounted(
      render('<tes-phone name="phone" value="+34" label="Phone number"></tes-phone>'),
    )

    expect(el.shadowRoot?.querySelector('[name], .field[value]')).toBeNull()
  })
})

describe('<tes-phone> value semantics', () => {
  it('uses the value attribute as the initial value', async () => {
    const el = await mounted(render('<tes-phone value="+34" label="Phone number"></tes-phone>'))

    expect(el.value).toBe('+34')
    expect(el.defaultValue).toBe('+34')
    expect(innerInput(el).value).toBe('+34')
  })

  it('returns the live value typed by the user, not the attribute', async () => {
    const el = await mounted(render('<tes-phone value="+34" label="Phone number"></tes-phone>'))

    await userEvent.type(innerInput(el), '612')

    expect(el.value).toBe('+34612')
    expect(el.getAttribute('value')).toBe('+34')
  })

  it('updates the field and the form value when value is set', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number"></tes-phone></form>',
    )
    const el = await mounted(container)

    el.value = '+44207946'

    await expect.poll(() => innerInput(el).value).toBe('+44207946')
    expect(new FormData(formOf(container)).get('phone')).toBe('+44207946')
    expect(el.getAttribute('value')).toBeNull()
  })

  it('accepts a value set before the element is connected', async () => {
    const el = document.createElement('tes-phone')
    el.setAttribute('label', 'Phone number')
    el.value = '+351'

    const container = render('')
    container.append(el)
    await waitForVueAsyncMount(el)

    expect(innerInput(el).value).toBe('+351')
  })

  it('follows value attribute changes until the value is edited', async () => {
    const el = await mounted(render('<tes-phone value="+34" label="Phone number"></tes-phone>'))

    el.setAttribute('value', '+33')
    await expect.poll(() => innerInput(el).value).toBe('+33')

    await userEvent.type(innerInput(el), '6')
    el.setAttribute('value', '+49')

    expect(el.value).toBe('+336')
    expect(el.defaultValue).toBe('+49')
  })

  it('reflects defaultValue to the value attribute', async () => {
    const el = await mounted(render('<tes-phone label="Phone number"></tes-phone>'))

    el.defaultValue = '+39'

    expect(el.getAttribute('value')).toBe('+39')
    await expect.poll(() => el.value).toBe('+39')
  })

  it('restores defaultValue on reset and follows the attribute again', async () => {
    const container = render(
      '<form><tes-phone name="phone" value="+34" label="Phone number"></tes-phone></form>',
    )
    const el = await mounted(container)

    el.value = '+34999'
    formOf(container).reset()

    await expect.poll(() => innerInput(el).value).toBe('+34')
    expect(el.value).toBe('+34')

    el.setAttribute('value', '+52')
    await expect.poll(() => el.value).toBe('+52')
  })
})

describe('<tes-phone> form integration', () => {
  it('submits the typed value under its name', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number"></tes-phone></form>',
    )
    const el = await mounted(container)

    await userEvent.type(page.getByRole('textbox', { name: 'Phone number' }), '612345678')

    expect(new FormData(formOf(container)).get('phone')).toBe('612345678')
    expect(el.form).toBe(formOf(container))
  })

  it('reports valueMissing when required and empty', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" required></tes-phone></form>',
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
      '<form><tes-phone name="phone" label="Phone number" value="+34"></tes-phone></form>',
    )
    const el = await mounted(container)

    await userEvent.type(innerInput(el), '612')
    expect(new FormData(formOf(container)).get('phone')).toBe('+34612')

    formOf(container).reset()

    await expect.poll(() => innerInput(el).value).toBe('+34')
    expect(new FormData(formOf(container)).get('phone')).toBe('+34')
  })

  it('is disabled by a disabled fieldset and excluded from submission', async () => {
    const container = render(
      '<form><fieldset><tes-phone name="phone" label="Phone number" value="1"></tes-phone></fieldset></form>',
    )
    const el = await mounted(container)
    const fieldset = container.querySelector('fieldset') as HTMLFieldSetElement

    fieldset.disabled = true

    await expect.poll(() => innerInput(el).disabled).toBe(true)
    expect(new FormData(formOf(container)).has('phone')).toBe(false)
  })
})

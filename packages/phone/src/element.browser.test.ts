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
})

describe('<tes-phone> form integration', () => {
  it('submits the typed value under its name', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number"></tes-phone></form>',
    )
    const el = await mounted(container)
    const form = container.querySelector('form') as HTMLFormElement

    await userEvent.type(page.getByRole('textbox', { name: 'Phone number' }), '612345678')

    expect(new FormData(form).get('phone')).toBe('612345678')
    expect(el.form).toBe(form)
  })

  it('reports valueMissing when required and empty', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" required></tes-phone></form>',
    )
    const el = await mounted(container)
    const form = container.querySelector('form') as HTMLFormElement

    await expect.poll(() => el.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)

    await userEvent.type(innerInput(el), '612345678')

    await expect.poll(() => el.validity.valid).toBe(true)
    expect(form.checkValidity()).toBe(true)
  })

  it('restores the initial value on form reset', async () => {
    const container = render(
      '<form><tes-phone name="phone" label="Phone number" value="+34"></tes-phone></form>',
    )
    const el = await mounted(container)
    const form = container.querySelector('form') as HTMLFormElement

    await userEvent.type(innerInput(el), '612')
    expect(new FormData(form).get('phone')).toBe('+34612')

    form.reset()

    await expect.poll(() => innerInput(el).value).toBe('+34')
    expect(new FormData(form).get('phone')).toBe('+34')
  })

  it('is disabled by a disabled fieldset and excluded from submission', async () => {
    const container = render(
      '<form><fieldset><tes-phone name="phone" label="Phone number" value="1"></tes-phone></fieldset></form>',
    )
    const el = await mounted(container)
    const form = container.querySelector('form') as HTMLFormElement
    const fieldset = container.querySelector('fieldset') as HTMLFieldSetElement

    fieldset.disabled = true

    await expect.poll(() => innerInput(el).disabled).toBe(true)
    expect(new FormData(form).has('phone')).toBe(false)
  })
})

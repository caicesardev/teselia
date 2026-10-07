import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { TesPasswordElement, define } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

const addedStyles: HTMLStyleElement[] = []

function addPageStyles(css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  addedStyles.push(style)
}

function control(el: HTMLElement): HTMLElement {
  return el.querySelector('.tes-password__control') as HTMLElement
}

function formOf(el: TesPasswordElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

afterEach(() => {
  document.body.innerHTML = ''
  for (const style of addedStyles.splice(0)) style.remove()
})

describe('<tes-password> registration', () => {
  it('auto-registers, without being form-associated', () => {
    expect(customElements.get('tes-password')).toBe(TesPasswordElement)
    expect('formAssociated' in TesPasswordElement).toBe(false)
  })

  it('can be registered under a custom tag name, with its own styles', async () => {
    define('my-password')
    document.body.innerHTML = '<main><my-password label="Password"></my-password></main>'
    const el = document.querySelector('my-password') as TesPasswordElement

    await expect.poll(() => el.querySelector('input')).toBeTruthy()

    expect(el).toBeInstanceOf(TesPasswordElement)
    expect(getComputedStyle(el).display).toBe('inline-block')
    expect(control(el).getBoundingClientRect().height).toBe(44)
  })
})

describe('<tes-password> light DOM field', () => {
  it('renders a labelled native password input in the light DOM', async () => {
    const el = await renderPassword('')

    expect(el.shadowRoot).toBeNull()
    expect(passwordInput(el).type).toBe('password')
    await expect.element(page.getByLabelText('Password')).toBe(passwordInput(el))
  })

  it('gives every instance its own ids', async () => {
    const first = await renderPassword('')
    const second = await renderPassword('')

    expect(passwordInput(first).id).not.toBe(passwordInput(second).id)
    expect(first.querySelector('label')?.htmlFor).toBe(passwordInput(first).id)
    expect(second.querySelector('label')?.htmlFor).toBe(passwordInput(second).id)
  })

  it('keeps other attributes off the inner elements', async () => {
    const el = await renderPassword('value="secret" class="wide" data-test="x"')

    expect(el.querySelector('[data-test]')).toBeNull()
    expect(el.querySelector('.wide')).toBeNull()
  })

  it('focuses the input from focus() and from the label', async () => {
    const el = await renderPassword('')

    el.focus()
    expect(document.activeElement).toBe(passwordInput(el))

    passwordInput(el).blur()
    await userEvent.click(el.querySelector('label') as HTMLLabelElement)
    expect(document.activeElement).toBe(passwordInput(el))
  })

  it('has no axe violations', async () => {
    await expectNoAxeViolations(await renderPassword(''))
  })
})

describe('<tes-password> native form control', () => {
  it('submits what the user types under its name, once', async () => {
    const el = await renderPassword('name="password"', 'form')

    await userEvent.type(passwordInput(el), 'correct horse')

    expect(new FormData(formOf(el)).getAll('password')).toEqual(['correct horse'])
    expect(el.value).toBe('correct horse')
    expect(el.form).toBe(formOf(el))
  })

  it('follows a name set later', async () => {
    const el = await renderPassword('', 'form')

    el.setAttribute('name', 'new-password')
    await expect.poll(() => passwordInput(el).name).toBe('new-password')
  })

  it('starts from the value attribute and restores it on reset', async () => {
    const el = await renderPassword('name="password" value="initial"', 'form')
    expect(el.value).toBe('initial')

    passwordInput(el).focus()
    await userEvent.keyboard('{End}!')
    expect(el.value).toBe('initial!')

    formOf(el).reset()
    expect(el.value).toBe('initial')
  })

  it('sets the value from code, before and after it is connected', async () => {
    const detached = document.createElement('tes-password')
    detached.setAttribute('label', 'Password')
    detached.value = 'set early'
    expect(detached.value).toBe('set early')

    document.body.append(detached)
    await expect.poll(() => passwordInput(detached)?.value).toBe('set early')

    detached.value = 'set later'
    expect(passwordInput(detached).value).toBe('set later')
  })

  it('is disabled by a disabled fieldset and then not submitted', async () => {
    const el = await renderPassword('name="password" value="secret"', 'form')
    const fieldset = document.createElement('fieldset')
    formOf(el).append(fieldset)
    fieldset.append(el)

    fieldset.disabled = true

    expect(passwordInput(el).matches(':disabled')).toBe(true)
    expect(new FormData(formOf(el)).has('password')).toBe(false)
  })
})

describe('<tes-password> styles', () => {
  it('draws a 44px field with the shared tokens', async () => {
    const el = await renderPassword('')
    el.style.setProperty('--tes-color-border', 'rgb(255, 0, 0)')

    expect(control(el).getBoundingClientRect().height).toBe(44)
    expect(getComputedStyle(control(el)).borderTopColor).toBe('rgb(255, 0, 0)')
  })

  it('adopts one stylesheet for the document, however many instances there are', async () => {
    const before = document.adoptedStyleSheets.length
    await renderPassword('')
    await renderPassword('')
    define()

    expect(document.adoptedStyleSheets.length).toBe(before)
  })

  it('lets any page style override the component, because its selectors have no specificity', async () => {
    addPageStyles('input { border-top-color: rgb(1, 2, 3); } label { font-weight: 300; }')
    const el = await renderPassword('')

    expect(getComputedStyle(passwordInput(el)).borderTopColor).toBe('rgb(1, 2, 3)')
    expect(getComputedStyle(el.querySelector('label') as HTMLElement).fontWeight).toBe('300')
  })
})

import { systemColor } from '@teselia/shared/test'
import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

function toggle(el: TesPasswordElement): HTMLButtonElement {
  return el.querySelector('.tes-password__toggle') as HTMLButtonElement
}

function control(el: TesPasswordElement): HTMLElement {
  return el.querySelector('.tes-password__control') as HTMLElement
}

function formOf(el: TesPasswordElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

function recordSubmissions(el: TesPasswordElement): { submitter: string | undefined; password: FormDataEntryValue | null }[] {
  const submissions: { submitter: string | undefined; password: FormDataEntryValue | null }[] = []
  formOf(el).addEventListener('submit', (event) => {
    event.preventDefault()
    submissions.push({ submitter: event.submitter?.id, password: new FormData(formOf(el)).get('password') })
  })
  return submissions
}

afterEach(async () => {
  document.body.innerHTML = ''
  await commands.emulateMedia({ forcedColors: 'none' })
})

describe('Enter', () => {
  it('submits the form natively through its submit button', async () => {
    const el = await renderPassword('name="password"', 'form')
    formOf(el).append(Object.assign(document.createElement('button'), { id: 'sign-in', textContent: 'Sign in' }))
    const submissions = recordSubmissions(el)
    passwordInput(el).focus()

    await userEvent.keyboard('correct horse{Enter}')

    expect(submissions).toEqual([{ submitter: 'sign-in', password: 'correct horse' }])
  })
})

describe('reset', () => {
  it('restores the value attribute after edits and values set from code', async () => {
    const el = await renderPassword('name="password" value="initial"', 'form')

    el.value = 'from code'
    formOf(el).reset()

    expect(el.value).toBe('initial')
  })
})

describe('disabled', () => {
  it('disables the input, keeps it out of the form and hides the show button', async () => {
    const el = await renderPassword('name="password" value="secret" disabled', 'form')

    expect(passwordInput(el).disabled).toBe(true)
    expect(new FormData(formOf(el)).has('password')).toBe(false)
    expect(toggle(el).checkVisibility()).toBe(false)
  })

  it.each([
    ['the disabled attribute', (el: TesPasswordElement) => (el.disabled = true)],
    ['a disabled fieldset', (el: TesPasswordElement) => ((el.parentElement as HTMLFieldSetElement).disabled = true)],
  ])('looks disabled through %s: muted text and fill', async (_, disable) => {
    const enabled = await renderPassword('value="secret"', 'fieldset')
    const disabled = await renderPassword('value="secret"', 'fieldset')

    disable(disabled)
    await expect.poll(() => passwordInput(disabled).matches(':disabled')).toBe(true)

    const disabledInput = getComputedStyle(passwordInput(disabled))
    expect(disabledInput.color).not.toBe(getComputedStyle(passwordInput(enabled)).color)
    expect(disabledInput.cursor).toBe('not-allowed')
    expect(getComputedStyle(control(disabled)).backgroundColor).not.toBe(getComputedStyle(control(enabled)).backgroundColor)
  })

  it('uses the system GrayText color in forced colors mode', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderPassword('value="secret" disabled')

    expect(getComputedStyle(passwordInput(el)).color).toBe(systemColor('GrayText'))
  })

  it('follows the disabled property in both directions', async () => {
    const el = await renderPassword('name="password" value="secret"', 'form')

    el.disabled = true
    expect(el.hasAttribute('disabled')).toBe(true)
    await expect.poll(() => passwordInput(el).disabled).toBe(true)
    expect(toggle(el).checkVisibility()).toBe(false)

    el.disabled = false
    await expect.poll(() => passwordInput(el).disabled).toBe(false)
    expect(toggle(el).checkVisibility()).toBe(true)
    expect(new FormData(formOf(el)).get('password')).toBe('secret')
  })

  it('hides the password when the field gets disabled', async () => {
    const el = await renderPassword('value="secret"')
    el.revealed = true

    el.disabled = true

    await expect.poll(() => el.revealed).toBe(false)
    expect(passwordInput(el).type).toBe('password')
  })

  it('hides the show button inside a disabled fieldset too', async () => {
    const el = await renderPassword('name="password"', 'form')
    const fieldset = document.createElement('fieldset')
    formOf(el).append(fieldset)
    fieldset.append(el)

    fieldset.disabled = true

    expect(toggle(el).checkVisibility()).toBe(false)
    fieldset.disabled = false
    expect(toggle(el).checkVisibility()).toBe(true)
  })

  it('has no axe violations', async () => {
    await expectNoAxeViolations(await renderPassword('value="secret" disabled'))
  })
})

describe('readonly', () => {
  it('blocks editing but still submits the value', async () => {
    const el = await renderPassword('name="password" value="secret" readonly', 'form')
    passwordInput(el).focus()

    await userEvent.keyboard('{End}x')

    expect(passwordInput(el).readOnly).toBe(true)
    expect(el.value).toBe('secret')
    expect(new FormData(formOf(el)).get('password')).toBe('secret')
  })

  it('is barred from validation, like a native readonly input', async () => {
    const el = await renderPassword('name="password" readonly required', 'form')

    expect(el.willValidate).toBe(false)
    expect(formOf(el).checkValidity()).toBe(true)
  })

  it('keeps the show button working', async () => {
    const el = await renderPassword('value="secret" readonly')

    await userEvent.click(toggle(el))

    expect(passwordInput(el).type).toBe('text')
  })

  it('reflects the readOnly property to the attribute, like a native input', async () => {
    const el = await renderPassword('')
    expect(el.readOnly).toBe(false)

    el.readOnly = true

    expect(el.hasAttribute('readonly')).toBe(true)
    await expect.poll(() => passwordInput(el).readOnly).toBe(true)
    el.readOnly = false
    expect(el.hasAttribute('readonly')).toBe(false)
  })

  it('has no axe violations', async () => {
    await expectNoAxeViolations(await renderPassword('value="secret" readonly'))
  })
})

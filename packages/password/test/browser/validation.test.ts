import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

function errorText(el: TesPasswordElement): string {
  return el.querySelector('.tes-password__error')?.textContent?.trim() ?? ''
}

function control(el: TesPasswordElement): HTMLElement {
  return el.querySelector('.tes-password__control') as HTMLElement
}

function describedIds(el: TesPasswordElement): string[] {
  return (passwordInput(el).getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
}

function formOf(el: TesPasswordElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

function preventSubmission(el: TesPasswordElement): string[] {
  const submitted: string[] = []
  formOf(el).addEventListener('submit', (event) => {
    event.preventDefault()
    submitted.push(String(new FormData(formOf(el)).get('password')))
  })
  return submitted
}

async function type(el: TesPasswordElement, keys: string): Promise<void> {
  passwordInput(el).focus()
  await userEvent.keyboard(`{End}${keys}`)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('required', () => {
  it('marks the input as required and blocks submission with its message', async () => {
    const el = await renderPassword('name="password" required', 'form')
    const submitted = preventSubmission(el)

    expect(passwordInput(el).required).toBe(true)
    expect(errorText(el)).toBe('')

    formOf(el).requestSubmit()

    expect(submitted).toEqual([])
    await expect.poll(() => errorText(el)).toBe('Enter a password')
    expect(passwordInput(el).validationMessage).toBe('Enter a password')
  })

  it('shows the error state: aria-invalid, the error in the description and a 2px border', async () => {
    const el = await renderPassword('name="password" required', 'form')
    preventSubmission(el)

    formOf(el).requestSubmit()

    await expect.poll(() => passwordInput(el).getAttribute('aria-invalid')).toBe('true')
    const error = el.querySelector('.tes-password__error') as HTMLElement
    expect(describedIds(el).at(-1)).toBe(error.id)
    expect(error.getAttribute('aria-live')).toBe('polite')
    expect(getComputedStyle(control(el)).borderTopWidth).toBe('2px')
  })
})

describe('when errors appear', () => {
  it('waits until the user leaves the field after editing', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')

    await type(el, 'abc')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(errorText(el)).toBe('')
    expect(passwordInput(el).hasAttribute('aria-invalid')).toBe(false)

    passwordInput(el).blur()
    await expect.poll(() => errorText(el)).toBe('Your password does not meet all the requirements')
  })

  it('stays hidden when the user only passes through the field', async () => {
    const el = await renderPassword('required')

    passwordInput(el).focus()
    passwordInput(el).blur()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(errorText(el)).toBe('')
  })

  it('updates live once shown, and clears as soon as the password is valid', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')
    await type(el, 'abcdefgh')
    passwordInput(el).blur()
    await expect.poll(() => errorText(el)).not.toBe('')

    await type(el, '1')

    await expect.poll(() => errorText(el)).toBe('')
    expect(passwordInput(el).hasAttribute('aria-invalid')).toBe(false)
  })

  it('reports a password over maxlength, never cutting it', async () => {
    const el = await renderPassword('purpose="new" maxlength="10"')
    el.value = 'abcdefghijkl'

    el.reportValidity()

    await expect.poll(() => errorText(el)).toBe('Use 10 characters or fewer')
    expect(el.value).toBe('abcdefghijkl')
  })

  it('accepts an empty optional new password and any password when signing in', async () => {
    const optional = await renderPassword('purpose="new" requirements="digit"')
    const signIn = await renderPassword('minlength="20"')
    signIn.value = 'short'

    expect(optional.checkValidity()).toBe(true)
    expect(signIn.checkValidity()).toBe(true)
  })

  it('lets input listeners see the new validity right away', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')
    const seen: boolean[] = []
    el.addEventListener('input', () => seen.push(el.checkValidity()))

    await type(el, 'abcdefg1')

    expect(seen.at(-2)).toBe(false)
    expect(seen.at(-1)).toBe(true)
  })

  it('takes custom texts', async () => {
    const el = await renderPassword('purpose="new" maxlength="4" minlength="2" required text-required="Escribe una contraseña" text-too-long="Máximo {maxlength} caracteres"')

    el.reportValidity()
    await expect.poll(() => errorText(el)).toBe('Escribe una contraseña')

    el.value = 'abcdef'
    await expect.poll(() => errorText(el)).toBe('Máximo 4 caracteres')
  })
})

describe('setCustomValidity', () => {
  it('shows a server error at once and blocks submission', async () => {
    const el = await renderPassword('name="password" value="hunter22"', 'form')
    const submitted = preventSubmission(el)

    el.setCustomValidity('This password appears in a data breach')

    await expect.poll(() => errorText(el)).toBe('This password appears in a data breach')
    expect(el.validity.customError).toBe(true)
    expect(el.validationMessage).toBe('This password appears in a data breach')
    formOf(el).requestSubmit()
    expect(submitted).toEqual([])
  })

  it('is cleared by the next edit, by an empty message and by a form reset', async () => {
    const el = await renderPassword('name="password"', 'form')

    el.setCustomValidity('Wrong password')
    await type(el, 'x')
    await expect.poll(() => errorText(el)).toBe('')

    el.setCustomValidity('Wrong password')
    el.setCustomValidity('')
    await expect.poll(() => errorText(el)).toBe('')

    el.setCustomValidity('Wrong password')
    formOf(el).reset()
    await expect.poll(() => errorText(el)).toBe('')
    expect(el.checkValidity()).toBe(true)
  })

  it('hides errors again after a form reset', async () => {
    const el = await renderPassword('name="password" required', 'form')
    preventSubmission(el)
    formOf(el).requestSubmit()
    await expect.poll(() => errorText(el)).not.toBe('')

    formOf(el).reset()

    await expect.poll(() => errorText(el)).toBe('')
  })
})

describe('validity API', () => {
  it('delegates validity members to the input', async () => {
    const el = await renderPassword('required')

    expect(el.willValidate).toBe(true)
    expect(el.validity.valueMissing).toBe(true)
    expect(el.checkValidity()).toBe(false)
    expect(el.reportValidity()).toBe(false)
    await expect.poll(() => errorText(el)).toBe('Enter a password')
  })
})

describe('hint', () => {
  it('shows a hint under the field and reads it first in the description', async () => {
    const el = await renderPassword('purpose="new" hint="Use a passphrase you do not use anywhere else"')
    const hint = el.querySelector('.tes-password__hint') as HTMLElement

    expect(hint.textContent?.trim()).toBe('Use a passphrase you do not use anywhere else')
    expect(hint.checkVisibility()).toBe(true)
    expect(describedIds(el)[0]).toBe(hint.id)
  })

  it('has no axe violations with a hint and an error', async () => {
    const el = await renderPassword('purpose="new" hint="Use a passphrase" required')
    el.reportValidity()
    await expect.poll(() => errorText(el)).not.toBe('')

    await expectNoAxeViolations(el)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import '../../src/index'
import { codeInput, expectNoAxeViolations } from '../support/otp'

interface Submission {
  submitter: string | undefined
  code: FormDataEntryValue | null
}

async function renderForm(otpAttributes: string, withButton = true) {
  const form = document.createElement('form')
  form.innerHTML = `<tes-otp label="Verification code" name="code" ${otpAttributes}></tes-otp>${withButton ? '<button id="send">Send</button>' : ''}`
  document.body.append(form)

  const order: string[] = []
  const submissions: Submission[] = []
  const el = form.querySelector('tes-otp') as TesOtpElement
  for (const name of ['input', 'complete', 'change']) el.addEventListener(name, () => order.push(name))
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    order.push('submit')
    submissions.push({ submitter: event.submitter?.id, code: new FormData(form).get('code') })
  })

  await expect.poll(() => el.shadowRoot?.querySelector('#code')).toBeTruthy()
  return { el, form, order, submissions }
}

function notice(el: TesOtpElement): HTMLElement | null {
  return el.shadowRoot?.querySelector('#notice') ?? null
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Enter', () => {
  it('submits the form through its submit button, after committing the change', async () => {
    const { el, order, submissions } = await renderForm('')
    codeInput(el).focus()

    await userEvent.keyboard('123456{Enter}')

    expect(submissions).toEqual([{ submitter: 'send', code: '123456' }])
    expect(order.slice(-2)).toEqual(['change', 'submit'])
  })

  it('lets validation block the submission and show the error', async () => {
    const { el, submissions } = await renderForm('')
    codeInput(el).focus()

    await userEvent.keyboard('12{Enter}')

    expect(submissions).toEqual([])
    await expect.poll(() => el.shadowRoot?.querySelector('#error')?.textContent).toBe('Enter all 6 digits')
  })

  it('does nothing while an input method is composing', async () => {
    const { el, submissions } = await renderForm('value="123456"')

    codeInput(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }))

    expect(submissions).toEqual([])
  })
})

describe('autosubmit', () => {
  it('is off by default: completing the code does not submit', async () => {
    const { el, submissions } = await renderForm('')

    await userEvent.type(codeInput(el), '123456')

    expect(submissions).toEqual([])
    expect(notice(el)).toBeNull()
  })

  it('submits once when typing completes the code, after input, complete and change', async () => {
    const { el, order, submissions } = await renderForm('autosubmit')

    await userEvent.type(codeInput(el), '123456')

    expect(submissions).toEqual([{ submitter: 'send', code: '123456' }])
    expect(order.slice(-4)).toEqual(['input', 'complete', 'change', 'submit'])
  })

  it('submits a pasted or autofilled code', async () => {
    const { el, submissions } = await renderForm('autosubmit')
    const input = codeInput(el)
    input.focus()

    input.value = '654321'
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertReplacementText' }))

    expect(submissions).toEqual([{ submitter: 'send', code: '654321' }])
  })

  it('does not submit for a value set from code or a form reset', async () => {
    const { el, form, submissions } = await renderForm('autosubmit value="123456"')

    el.value = '654321'
    form.reset()

    expect(submissions).toEqual([])
  })

  it('tells everyone in advance, in a visible notice linked to the field', async () => {
    const { el } = await renderForm('autosubmit')

    expect(notice(el)?.textContent).toBe('The code is sent when you enter the last digit')
    expect(codeInput(el).getAttribute('aria-describedby')).toBe('length notice')
    expect(notice(el)?.checkVisibility()).toBe(true)
  })

  it('words the notice for alphanumeric codes, and takes a custom text', async () => {
    const { el } = await renderForm('autosubmit type="alphanumeric"')
    expect(notice(el)?.textContent).toBe('The code is sent when you enter the last character')

    el.setAttribute('text-autosubmit', 'Se envía al completar el código')
    await expect.poll(() => notice(el)?.textContent).toBe('Se envía al completar el código')
  })

  it('keeps the notice before the error in the description', async () => {
    const { el } = await renderForm('autosubmit required')

    el.reportValidity()

    await expect.poll(() => codeInput(el).getAttribute('aria-describedby')).toBe('length notice error')
  })

  it('has no axe violations with the notice', async () => {
    const { el } = await renderForm('autosubmit')

    await expectNoAxeViolations(el)
  })
})

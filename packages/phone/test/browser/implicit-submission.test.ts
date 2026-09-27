import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from '../../src/index'
import '../../src/index'
import { combobox, numberInput } from '../support/phone'

interface Submission {
  submitter: HTMLElement | null
  phone: FormDataEntryValue | null
}

async function renderForm(formContent: string) {
  const form = document.createElement('form')
  form.innerHTML = formContent
  document.body.append(form)

  const submissions: Submission[] = []
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    submissions.push({ submitter: event.submitter, phone: new FormData(form).get('phone') })
  })

  const el = form.querySelector('tes-phone') as TesPhoneElement
  await expect.poll(() => el.shadowRoot?.querySelector('#number')).toBeTruthy()
  return { el, form, submissions }
}

const PHONE = '<tes-phone name="phone" label="Phone number" default-country="ES"></tes-phone>'

async function pressEnterInNumberField(el: TesPhoneElement, digits = '612345678'): Promise<void> {
  await userEvent.type(numberInput(el), digits)
  await userEvent.keyboard('{Enter}')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('implicit submission', () => {
  it('submits the form through its submit button when Enter is pressed in the number field', async () => {
    const { el, submissions } = await renderForm(`${PHONE}<button type="submit" id="send">Send</button>`)

    await pressEnterInNumberField(el)

    expect(submissions).toHaveLength(1)
    expect(submissions[0]?.submitter?.id).toBe('send')
    expect(submissions[0]?.phone).toBe('+34612345678')
  })

  it('uses the first submit button in tree order, skipping plain buttons', async () => {
    const { el, submissions } = await renderForm(
      `<button type="button" id="plain">Plain</button>${PHONE}<input type="submit" id="first"><button id="second">Second</button>`,
    )

    await pressEnterInNumberField(el)

    expect(submissions.map((submission) => submission.submitter?.id)).toEqual(['first'])
  })

  it('counts a submit button associated through the form attribute', async () => {
    const { el, form, submissions } = await renderForm(`${PHONE}<button id="inside">Inside</button>`)
    form.id = 'contact'
    const external = document.createElement('button')
    external.id = 'external'
    external.setAttribute('form', 'contact')
    form.before(external)

    await pressEnterInNumberField(el)

    expect(submissions.map((submission) => submission.submitter?.id)).toEqual(['external'])
  })

  it('runs the submit button click handlers, like a native input', async () => {
    const { el, form, submissions } = await renderForm(`${PHONE}<button type="submit">Send</button>`)
    const clicks: string[] = []
    form.querySelector('button')?.addEventListener('click', () => clicks.push('click'))

    await pressEnterInNumberField(el)

    expect(clicks).toEqual(['click'])
    expect(submissions).toHaveLength(1)
  })

  it('does nothing when the default submit button is disabled', async () => {
    const { el, submissions } = await renderForm(`${PHONE}<button type="submit" disabled>Send</button>`)

    await pressEnterInNumberField(el)

    expect(submissions).toHaveLength(0)
  })

  it('submits a form without a submit button when the phone is its only text field', async () => {
    const { el, submissions } = await renderForm(`${PHONE}<input type="checkbox" name="terms">`)

    await pressEnterInNumberField(el)

    expect(submissions).toHaveLength(1)
    expect(submissions[0]?.submitter).toBeNull()
  })

  it('does not submit a form without a submit button that has other text fields', async () => {
    const { el, submissions } = await renderForm(`${PHONE}<input type="email" name="email">`)

    await pressEnterInNumberField(el)

    expect(submissions).toHaveLength(0)
  })

  it('lets validation block the submission and shows the error', async () => {
    const { el, submissions } = await renderForm(
      '<tes-phone name="phone" label="Phone number" default-country="ES" required></tes-phone><button>Send</button>',
    )

    numberInput(el).focus()
    await userEvent.keyboard('{Enter}')

    expect(submissions).toHaveLength(0)
    await expect.poll(() => el.shadowRoot?.querySelector('#error')?.textContent).toBe('Enter a phone number')
  })

  it('commits the change before submitting, and not again on blur', async () => {
    const { el, form } = await renderForm(`${PHONE}<button>Send</button>`)
    const order: string[] = []
    el.addEventListener('change', () => order.push('change'))
    form.addEventListener('submit', () => order.push('submit'))

    await pressEnterInNumberField(el)
    await userEvent.tab()

    expect(order).toEqual(['change', 'submit'])
  })

  it('does not submit when Enter picks a country in the combobox', async () => {
    const { el, submissions } = await renderForm(`${PHONE}<button>Send</button>`)

    combobox(el).focus()
    await userEvent.keyboard('fra{ArrowDown}{Enter}')

    expect(el.country).toBe('FR')
    expect(submissions).toHaveLength(0)
  })

  it('does nothing outside a form', async () => {
    const container = document.createElement('main')
    container.innerHTML = PHONE
    document.body.append(container)
    const el = container.querySelector('tes-phone') as TesPhoneElement
    await expect.poll(() => el.shadowRoot?.querySelector('#number')).toBeTruthy()

    await pressEnterInNumberField(el)

    expect(el.value).toBe('+34612345678')
  })
})

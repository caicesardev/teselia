import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

const ANNOUNCEMENT = { timeout: 3000 }

function describedBy(el: TesOtpElement): string | null {
  return codeInput(el).getAttribute('aria-describedby')
}

function describedText(el: TesOtpElement): string {
  return (describedBy(el) ?? '')
    .split(' ')
    .map((id) => el.shadowRoot?.getElementById(id)?.textContent?.trim() ?? '')
    .join(' | ')
}

function liveRegion(el: TesOtpElement): HTMLElement {
  return el.shadowRoot?.querySelector('[role="status"]') as HTMLElement
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('description', () => {
  it('always tells the expected length', async () => {
    const el = await renderOtp('')

    expect(describedBy(el)).toBe('length')
    expect(describedText(el)).toBe('6-digit code')
  })

  it('words the length for alphanumeric codes and follows the length attribute', async () => {
    const el = await renderOtp('type="alphanumeric" length="8"')

    expect(describedText(el)).toBe('8-character code')
  })

  it('takes a custom length text with the placeholder', async () => {
    const el = await renderOtp('text-length="Código de {length} cifras"')

    expect(describedText(el)).toBe('Código de 6 cifras')
  })

  it('combines the hint, the length, the autosubmit notice and the error, in that order', async () => {
    const el = await renderOtp('hint="We sent it to +34 612 ··· 678" autosubmit required')

    el.reportValidity()

    await expect.poll(() => describedBy(el)).toBe('hint length notice error')
    expect(describedText(el)).toBe(
      'We sent it to +34 612 ··· 678 | 6-digit code | The code is sent when you enter the last digit | Enter the code',
    )
  })

  it('shows the hint and hides the length text visually', async () => {
    const el = await renderOtp('hint="Check your messages"')

    expect(el.shadowRoot?.getElementById('hint')?.getAttribute('part')).toBe('hint')
    expect(el.shadowRoot?.getElementById('hint')?.checkVisibility()).toBe(true)
    expect(el.shadowRoot?.getElementById('length')?.classList.contains('visually-hidden')).toBe(true)
  })

  it('has no axe violations with every description', async () => {
    const el = await renderOtp('hint="Check your messages" autosubmit required')
    el.reportValidity()

    await expectNoAxeViolations(el)
  })
})

describe('rejected characters', () => {
  it('announces the rule once typing pauses after a rejected key', async () => {
    const el = await renderOtp('')

    await userEvent.type(codeInput(el), 'a')

    expect(liveRegion(el).textContent?.trim()).toBe('')
    await expect.poll(() => liveRegion(el).textContent?.trim(), ANNOUNCEMENT).toBe('Only digits are allowed')
  })

  it('words the rule for alphanumeric codes and takes a custom text', async () => {
    const el = await renderOtp('type="alphanumeric"')
    await userEvent.type(codeInput(el), '#')
    await expect.poll(() => liveRegion(el).textContent?.trim(), ANNOUNCEMENT).toBe('Only letters and digits are allowed')

    el.setAttribute('text-invalid-character', 'Solo cifras')
    el.setAttribute('type', 'numeric')
    await userEvent.type(codeInput(el), 'x')
    await expect.poll(() => liveRegion(el).textContent?.trim(), ANNOUNCEMENT).toBe('Solo cifras')
  })

  it('cancels the announcement when a valid key follows before the pause', async () => {
    const el = await renderOtp('')

    await userEvent.type(codeInput(el), 'a1')
    await pause(800)

    expect(liveRegion(el).textContent?.trim()).toBe('')
  })

  it('does not announce anything for a paste', async () => {
    const el = await renderOtp('')
    const input = codeInput(el)
    input.focus()

    input.value = 'abc12'
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertFromPaste' }))
    await pause(800)

    expect(el.value).toBe('12')
    expect(liveRegion(el).textContent?.trim()).toBe('')
  })
})

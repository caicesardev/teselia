import { expect } from 'vitest'
import type { TesOtpElement } from '../../src/index'
import '../../src/index'

export { expectNoAxeViolations } from '@teselia/shared/test'

export async function renderOtp(attributes: string, wrapperTag = 'main'): Promise<TesOtpElement> {
  const container = document.createElement(wrapperTag)
  container.innerHTML = `<tes-otp label="Verification code" ${attributes}></tes-otp>`
  document.body.append(container)

  const el = container.querySelector('tes-otp') as TesOtpElement
  await expect.poll(() => el.shadowRoot?.querySelector('#code')).toBeTruthy()
  return el
}

export function codeInput(el: TesOtpElement): HTMLInputElement {
  return el.shadowRoot?.querySelector('#code') as HTMLInputElement
}

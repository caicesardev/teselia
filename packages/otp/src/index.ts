import { TesOtpElement } from './element'

export { TesOtpElement }

export const TAG_NAME = 'tes-otp'

export function define(tagName: string = TAG_NAME): void {
  if (typeof customElements === 'undefined' || customElements.get(tagName)) return

  const registryAllowsOneTagPerConstructor = class extends TesOtpElement {}
  customElements.define(
    tagName,
    tagName === TAG_NAME ? TesOtpElement : registryAllowsOneTagPerConstructor,
  )
}

define()

declare global {
  interface HTMLElementTagNameMap {
    'tes-otp': TesOtpElement
  }
}

import { TesPhoneElement } from './element'

export { TesPhoneElement }

export const TAG_NAME = 'tes-phone'

export function define(tagName: string = TAG_NAME): void {
  if (typeof customElements === 'undefined' || customElements.get(tagName)) return

  const registryAllowsOneTagPerConstructor = class extends TesPhoneElement {}
  customElements.define(
    tagName,
    tagName === TAG_NAME ? TesPhoneElement : registryAllowsOneTagPerConstructor,
  )
}

define()

declare global {
  interface HTMLElementTagNameMap {
    'tes-phone': TesPhoneElement
  }
}

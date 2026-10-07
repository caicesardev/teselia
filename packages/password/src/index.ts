import { TesPasswordElement } from './element'
import { adoptStyles } from './styles'

export { TesPasswordElement }

export const TAG_NAME = 'tes-password'

export function define(tagName: string = TAG_NAME): void {
  if (typeof customElements === 'undefined' || customElements.get(tagName)) return

  const registryAllowsOneTagPerConstructor = class extends TesPasswordElement {}
  customElements.define(
    tagName,
    tagName === TAG_NAME ? TesPasswordElement : registryAllowsOneTagPerConstructor,
  )
  adoptStyles(tagName)
}

define()

declare global {
  interface HTMLElementTagNameMap {
    'tes-password': TesPasswordElement
  }
}

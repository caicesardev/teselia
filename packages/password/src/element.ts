import { defineCustomElement } from 'vue'
import TesPasswordComponent from './TesPassword.vue'

const VueTesPassword = defineCustomElement(TesPasswordComponent, { shadowRoot: false })

export class TesPasswordElement extends VueTesPassword {
  private pendingValue: string | null = null

  get value(): string {
    return this.input?.value ?? this.pendingValue ?? this.defaultValue
  }

  set value(value: string) {
    const input = this.input
    if (input) input.value = value
    else this.pendingValue = value
  }

  get defaultValue(): string {
    return this.getAttribute('value') ?? ''
  }

  set defaultValue(value: string) {
    this.setAttribute('value', value)
  }

  get form(): HTMLFormElement | null {
    return this.input?.form ?? null
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.applyPendingValue()
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options)
  }

  private get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('.tes-password__input')
  }

  private applyPendingValue(): void {
    const input = this.input
    if (!input || this.pendingValue === null) return
    input.value = this.pendingValue
    this.pendingValue = null
  }
}

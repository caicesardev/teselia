import { defineCustomElement } from 'vue'
import TesPasswordComponent from './TesPassword.vue'
import { resolveRuleOptions } from './core/rules'

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

  get minLength(): number {
    return resolveRuleOptions({ minlength: this.getAttribute('minlength') }).minLength
  }

  set minLength(value: number) {
    this.setAttribute('minlength', String(value))
  }

  get maxLength(): number {
    return resolveRuleOptions({ minlength: 1, maxlength: this.getAttribute('maxlength') }).maxLength ?? -1
  }

  set maxLength(value: number) {
    this.setAttribute('maxlength', String(value))
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

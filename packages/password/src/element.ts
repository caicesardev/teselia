import { defineCustomElement, reactive } from 'vue'
import TesPasswordComponent from './TesPassword.vue'
import { resolvePurpose } from './core/purpose'
import { requirementsMet, resolveRuleOptions } from './core/rules'

export interface TesPasswordState {
  revealed: boolean
  value: string
  edited: boolean
  errorsVisible: boolean
  customError: string
}

const VueTesPassword = defineCustomElement(TesPasswordComponent, { shadowRoot: false })

export class TesPasswordElement extends VueTesPassword {
  readonly state: TesPasswordState = reactive({
    revealed: false,
    value: '',
    edited: false,
    errorsVisible: false,
    customError: '',
  })

  private pendingValue: string | null = null

  get revealed(): boolean {
    return this.state.revealed
  }

  set revealed(revealed: boolean) {
    if (revealed === this.state.revealed) return
    this.state.revealed = revealed
    this.syncInputType()
    this.dispatchEvent(new CustomEvent('revealchange', { bubbles: true, composed: true, detail: { revealed } }))
  }

  get value(): string {
    return this.input?.value ?? this.pendingValue ?? this.defaultValue
  }

  set value(value: string) {
    const input = this.input
    if (input) input.value = value
    else this.pendingValue = value
    this.state.value = value
  }

  get requirementsMet(): boolean {
    if (resolvePurpose(this.getAttribute('purpose')) !== 'new') return true
    const options = resolveRuleOptions({
      minlength: this.getAttribute('minlength'),
      maxlength: this.getAttribute('maxlength'),
      requirements: this.getAttribute('requirements'),
    })
    return requirementsMet(this.state.value, options)
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

  get validity(): ValidityState {
    return (this.input ?? document.createElement('input')).validity
  }

  get validationMessage(): string {
    return this.input?.validationMessage ?? ''
  }

  get willValidate(): boolean {
    return this.input?.willValidate ?? false
  }

  setCustomValidity(message: string): void {
    this.state.customError = message
    if (message) this.state.errorsVisible = true
  }

  checkValidity(): boolean {
    return this.input?.checkValidity() ?? true
  }

  reportValidity(): boolean {
    return this.input?.reportValidity() ?? true
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

  private syncInputType(): void {
    const input = this.input
    if (input) input.type = this.state.revealed ? 'text' : 'password'
  }

  private applyPendingValue(): void {
    const input = this.input
    if (!input || this.pendingValue === null) return
    input.value = this.pendingValue
    this.state.value = this.pendingValue
    this.pendingValue = null
  }
}

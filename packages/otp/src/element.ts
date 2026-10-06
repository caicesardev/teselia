import { defineCustomElement, reactive } from 'vue'
import TesOtpComponent from './TesOtp.ce.vue'
import { type CodeOptions, normalizeCode, resolveCodeOptions } from './core/code'

export interface TesOtpState {
  value: string
  dirty: boolean
  disabledByForm: boolean
  edited: boolean
  errorsVisible: boolean
  customError: string
}

const VueTesOtp = defineCustomElement(TesOtpComponent, {
  shadowRootOptions: { delegatesFocus: true },
})

export class TesOtpElement extends VueTesOtp {
  static formAssociated = true
  static observedAttributes = ['value']

  readonly internals: ElementInternals

  readonly state: TesOtpState = reactive({
    value: '',
    dirty: false,
    disabledByForm: false,
    edited: false,
    errorsVisible: false,
    customError: '',
  })

  constructor(initialProps?: Record<string, unknown>) {
    super(initialProps)
    this.internals = this.attachInternals()
  }

  get value(): string {
    return this.state.value
  }

  set value(value: string) {
    this.state.value = this.normalized(value)
    this.state.dirty = true
  }

  get complete(): boolean {
    return this.state.value.length === this.codeOptions().length
  }

  get defaultValue(): string {
    return this.getAttribute('value') ?? ''
  }

  set defaultValue(value: string) {
    this.setAttribute('value', value)
  }

  get name(): string {
    return this.getAttribute('name') ?? ''
  }

  set name(value: string) {
    this.setAttribute('name', value)
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled')
  }

  set disabled(value: boolean) {
    this.toggleAttribute('disabled', value)
  }

  get readOnly(): boolean {
    return this.hasAttribute('readonly')
  }

  set readOnly(value: boolean) {
    this.toggleAttribute('readonly', value)
  }

  get form(): HTMLFormElement | null {
    return this.internals.form
  }

  get validity(): ValidityState {
    return this.internals.validity
  }

  get validationMessage(): string {
    return this.internals.validationMessage
  }

  get willValidate(): boolean {
    return this.internals.willValidate
  }

  setCustomValidity(message: string): void {
    this.state.customError = message
    if (message) this.state.errorsVisible = true
  }

  checkValidity(): boolean {
    return this.internals.checkValidity()
  }

  reportValidity(): boolean {
    return this.internals.reportValidity()
  }

  attributeChangedCallback(name: string, _previous: string | null, next: string | null): void {
    if (name === 'value' && !this.state.dirty) {
      this.state.value = this.normalized(next ?? '')
    }
  }

  formResetCallback(): void {
    this.state.value = this.normalized(this.defaultValue)
    this.state.dirty = false
    this.state.edited = false
    this.state.errorsVisible = false
    this.state.customError = ''
  }

  formDisabledCallback(disabled: boolean): void {
    this.state.disabledByForm = disabled
  }

  formStateRestoreCallback(saved: string | File | FormData | null, _mode: 'restore' | 'autocomplete'): void {
    if (typeof saved !== 'string') return
    this.state.value = this.normalized(saved)
    this.state.dirty = true
  }

  private normalized(raw: string): string {
    return normalizeCode(raw, this.codeOptions()).value
  }

  private codeOptions(): CodeOptions {
    return resolveCodeOptions({ length: this.getAttribute('length'), type: this.getAttribute('type') })
  }
}

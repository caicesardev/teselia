import { defineCustomElement, reactive } from 'vue'
import TesOtpComponent from './TesOtp.ce.vue'
import { normalizeCode, resolveCodeOptions } from './core/code'

export interface TesOtpState {
  value: string
  dirty: boolean
  disabledByForm: boolean
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
  }

  formDisabledCallback(disabled: boolean): void {
    this.state.disabledByForm = disabled
  }

  private normalized(raw: string): string {
    const options = resolveCodeOptions({ length: this.getAttribute('length'), type: this.getAttribute('type') })
    return normalizeCode(raw, options).value
  }
}

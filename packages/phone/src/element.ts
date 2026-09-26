import { defineCustomElement, reactive } from 'vue'
import TesPhoneComponent from './TesPhone.ce.vue'

export interface TesPhoneState {
  value: string
  dirty: boolean
  disabledByForm: boolean
}

const VueTesPhone = defineCustomElement(TesPhoneComponent, {
  shadowRootOptions: { delegatesFocus: true },
})

export class TesPhoneElement extends VueTesPhone {
  static formAssociated = true
  static observedAttributes = ['value']

  readonly internals: ElementInternals

  readonly state: TesPhoneState = reactive({ value: '', dirty: false, disabledByForm: false })

  constructor(initialProps?: Record<string, unknown>) {
    super(initialProps)
    this.internals = this.attachInternals()
  }

  get value(): string {
    return this.state.value
  }

  set value(value: string) {
    this.state.value = value
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
      this.state.value = next ?? ''
    }
  }

  formResetCallback(): void {
    this.state.value = this.defaultValue
    this.state.dirty = false
  }

  formDisabledCallback(disabled: boolean): void {
    this.state.disabledByForm = disabled
  }
}

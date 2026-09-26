import { defineCustomElement } from 'vue'
import TesPhoneComponent from './TesPhone.ce.vue'

export interface FormCallbacks {
  reset?: () => void
  disabled?: (disabled: boolean) => void
}

const VueTesPhone = defineCustomElement(TesPhoneComponent, {
  shadowRootOptions: { delegatesFocus: true },
})

export class TesPhoneElement extends VueTesPhone {
  static formAssociated = true

  readonly internals: ElementInternals

  formCallbacks: FormCallbacks = {}

  constructor(initialProps?: Record<string, unknown>) {
    super(initialProps)
    this.internals = this.attachInternals()
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

  formResetCallback(): void {
    this.formCallbacks.reset?.()
  }

  formDisabledCallback(disabled: boolean): void {
    this.formCallbacks.disabled?.(disabled)
  }
}

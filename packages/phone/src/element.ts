import { getCountryCallingCode } from 'libphonenumber-js/min'
import { defineCustomElement, reactive } from 'vue'
import type { CountryCode } from './countries'
import { interpretPhoneNumber, splitE164 } from './phone-number'
import TesPhoneComponent from './TesPhone.ce.vue'

export interface TesPhoneState {
  nationalInput: string
  dirty: boolean
  disabledByForm: boolean
  country: CountryCode | ''
  defaultCountry: CountryCode | ''
  numberTouched: boolean
  errorsVisible: boolean
}

const VueTesPhone = defineCustomElement(TesPhoneComponent, {
  shadowRootOptions: { delegatesFocus: true },
})

export class TesPhoneElement extends VueTesPhone {
  static formAssociated = true
  static observedAttributes = ['value']

  readonly internals: ElementInternals

  readonly state: TesPhoneState = reactive({
    nationalInput: '',
    dirty: false,
    disabledByForm: false,
    country: '',
    defaultCountry: '',
    numberTouched: false,
    errorsVisible: false,
  })

  constructor(initialProps?: Record<string, unknown>) {
    super(initialProps)
    this.internals = this.attachInternals()
  }

  get value(): string {
    return this.interpreted.e164
  }

  set value(value: string) {
    this.applyValue(value)
    this.state.dirty = true
  }

  get defaultValue(): string {
    return this.getAttribute('value') ?? ''
  }

  set defaultValue(value: string) {
    this.setAttribute('value', value)
  }

  get country(): CountryCode | '' {
    return this.state.country
  }

  get callingCode(): string {
    return this.state.country ? getCountryCallingCode(this.state.country) : ''
  }

  get nationalNumber(): string {
    return this.interpreted.nationalNumber
  }

  get valid(): boolean {
    return this.interpreted.valid
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

  override focus(options?: FocusOptions): void {
    const numberInput = this.shadowRoot?.querySelector<HTMLInputElement>('#number')
    if (numberInput) numberInput.focus(options)
    else super.focus(options)
  }

  checkValidity(): boolean {
    return this.internals.checkValidity()
  }

  reportValidity(): boolean {
    return this.internals.reportValidity()
  }

  attributeChangedCallback(name: string, _previous: string | null, next: string | null): void {
    if (name === 'value' && !this.state.dirty) {
      this.applyValue(next ?? '')
    }
  }

  formResetCallback(): void {
    const split = splitE164(this.defaultValue)
    this.state.nationalInput = split ? split.nationalNumber : this.defaultValue
    this.state.country = split ? split.country : this.state.defaultCountry
    this.state.dirty = false
    this.state.numberTouched = false
    this.state.errorsVisible = false
  }

  formDisabledCallback(disabled: boolean): void {
    this.state.disabledByForm = disabled
  }

  private get interpreted() {
    return interpretPhoneNumber(this.state.nationalInput, this.state.country)
  }

  private applyValue(value: string): void {
    const split = splitE164(value)
    if (split) {
      this.state.nationalInput = split.nationalNumber
      this.state.country = split.country
    } else {
      this.state.nationalInput = value
    }
  }
}

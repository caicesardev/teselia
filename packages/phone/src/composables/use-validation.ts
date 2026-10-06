import { type ComputedRef, type Ref, computed, onBeforeUnmount, onMounted, watchEffect } from 'vue'
import { type CountryCode, describeCountry } from '../core/countries'
import { serializeFormState } from '../core/form-state'
import { interpretPhoneNumber } from '../core/phone-number'
import type { TesPhoneElement } from '../element'
import type { ResolvedTesPhoneProps } from '../props'

export interface ValidationError {
  flag: 'valueMissing' | 'typeMismatch'
  message: string
  anchor: 'number' | 'country'
}

interface ValidationOptions {
  props: ResolvedTesPhoneProps
  host: TesPhoneElement
  locale: ComputedRef<string>
  excludedCountry: Ref<CountryCode | null>
  combobox: Readonly<Ref<HTMLInputElement | null>>
  numberInput: Readonly<Ref<HTMLInputElement | null>>
}

export function useValidation({ props, host, locale, excludedCountry, combobox, numberInput }: ValidationOptions) {
  const { state, internals } = host
  const phoneNumber = computed(() => interpretPhoneNumber(state.nationalInput, state.country))

  const describe = (code: CountryCode): string => describeCountry(code, locale.value)

  const validationError = computed<ValidationError | null>(() => {
    if (state.nationalInput.trim() === '') {
      return props.required ? { flag: 'valueMissing', message: props.textRequired, anchor: 'number' } : null
    }
    if (excludedCountry.value) {
      const message = props.textNotAllowed.replace('{country}', describe(excludedCountry.value))
      return { flag: 'typeMismatch', message, anchor: 'number' }
    }
    if (phoneNumber.value.valid) return null
    if (!state.country && !phoneNumber.value.detectedCountry) {
      return { flag: 'valueMissing', message: props.textCountryRequired, anchor: 'country' }
    }
    const country = state.country ? describe(state.country) : ''
    return { flag: 'typeMismatch', message: props.textInvalid.replace('{country}', country), anchor: 'number' }
  })

  const visibleError = computed(() => (state.errorsVisible ? validationError.value : null))

  const numberDescribedBy = computed(() => {
    const ids = [props.hint ? 'hint' : '', visibleError.value?.anchor === 'number' ? 'error' : '']
    return ids.filter(Boolean).join(' ') || undefined
  })

  function syncFormState(): void {
    internals.setFormValue(phoneNumber.value.e164, serializeFormState(state))

    const error = validationError.value
    if (!error) {
      internals.setValidity({})
      return
    }
    const anchor = error.anchor === 'country' ? combobox.value : numberInput.value
    internals.setValidity({ [error.flag]: true }, error.message, anchor ?? undefined)
  }

  function revealErrors(): void {
    state.errorsVisible = true
  }

  watchEffect(syncFormState, { flush: 'sync' })
  onMounted(() => host.addEventListener('invalid', revealErrors))
  onBeforeUnmount(() => host.removeEventListener('invalid', revealErrors))

  return { visibleError, numberDescribedBy, syncFormState }
}

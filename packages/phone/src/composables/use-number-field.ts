import type { Announcer } from '@teselia/shared'
import { type ComputedRef, ref, watch } from 'vue'
import { type CountryCode, describeCountry } from '../core/countries'
import { type FormattedInput, formatForDisplay, formatWhileTyping } from '../core/format'
import { splitE164 } from '../core/phone-number'
import type { TesPhoneState } from '../element'
import type { ResolvedTesPhoneProps } from '../props'
import type { DispatchPublicEvent } from './use-public-events'

const INTERNATIONAL_PREFIX = /^\s*(\+|00)/

interface NumberFieldOptions {
  props: ResolvedTesPhoneProps
  state: TesPhoneState
  locale: ComputedRef<string>
  isAllowed: (code: CountryCode) => boolean
  announcer: Announcer
  dispatchPublicEvent: DispatchPublicEvent
  submitOwnerForm: () => void
}

export function useNumberField(options: NumberFieldOptions) {
  const { props, state, locale, isAllowed, announcer, dispatchPublicEvent, submitOwnerForm } = options

  const excludedCountry = ref<CountryCode | null>(null)
  let textBeforeEditing = ''

  function updateFromUserInput(event: Event): void {
    const input = event.target as HTMLInputElement
    const previous = state.nationalInput
    state.nationalInput = input.value
    state.dirty = true
    state.numberTouched = true

    if (adoptCountryOfInternationalNumber()) {
      showInField(input, { text: state.nationalInput, caret: state.nationalInput.length })
    } else {
      showInField(
        input,
        formatWhileTyping({
          previous,
          raw: input.value,
          caret: input.selectionStart ?? input.value.length,
          inputType: (event as InputEvent).inputType,
          country: state.country,
        }),
      )
    }

    dispatchPublicEvent('input')
  }

  function showInField(input: HTMLInputElement, formatted: FormattedInput): void {
    input.value = formatted.text
    input.setSelectionRange(formatted.caret, formatted.caret)
    state.nationalInput = formatted.text
  }

  function adoptCountryOfInternationalNumber(): boolean {
    excludedCountry.value = null
    if (!INTERNATIONAL_PREFIX.test(state.nationalInput)) return false

    const split = splitE164(state.nationalInput.trim().replace(/^00/, '+'))
    if (!split) return false

    if (!isAllowed(split.country)) {
      excludedCountry.value = split.country
      return false
    }

    state.nationalInput = split.nationalNumber
    if (split.country !== state.country) {
      state.country = split.country
      announcer.announceNow(props.textCountryChanged.replace('{country}', describeCountry(split.country, locale.value)))
    }
    return true
  }

  function rememberTextBeforeEditing(): void {
    textBeforeEditing = state.nationalInput
  }

  function commitChange(): void {
    if (state.nationalInput === textBeforeEditing) return
    textBeforeEditing = state.nationalInput
    dispatchPublicEvent('change')
  }

  function commitEditing(): void {
    if (state.numberTouched) state.errorsVisible = true
    commitChange()
  }

  function submitOnEnter(event: KeyboardEvent): void {
    if (event.isComposing) return
    commitChange()
    submitOwnerForm()
  }

  watch(
    () => state.country,
    () => {
      state.nationalInput = formatForDisplay(state.nationalInput, state.country)
    },
    { immediate: true },
  )

  return { excludedCountry, updateFromUserInput, rememberTextBeforeEditing, commitEditing, submitOnEnter }
}

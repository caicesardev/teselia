import { type ComputedRef, type Ref, computed, onBeforeUnmount, onMounted, watchEffect } from 'vue'
import type { RuleOptions } from '../core/rules'
import { validatePassword } from '../core/validation'
import type { TesPasswordElement } from '../element'
import type { ResolvedTesPasswordProps } from '../props'

interface ValidationOptions {
  host: TesPasswordElement
  props: ResolvedTesPasswordProps
  input: Readonly<Ref<HTMLInputElement | null>>
  ruleOptions: ComputedRef<RuleOptions | null>
}

export function useValidation({ host, props, input, ruleOptions }: ValidationOptions) {
  const { state } = host

  const error = computed(() =>
    validatePassword(
      { value: state.value, required: props.required, ruleOptions: ruleOptions.value, customError: state.customError },
      { required: props.textRequired, unmet: props.textUnmet, tooLong: props.textTooLong },
    ),
  )

  const visibleError = computed(() => (state.errorsVisible ? error.value : null))

  function markEdited(): void {
    state.edited = true
    state.customError = ''
  }

  function revealErrors(): void {
    state.errorsVisible = true
  }

  function revealErrorsIfEdited(): void {
    if (state.edited) revealErrors()
  }

  function forgetErrorsForOwnForm(event: Event): void {
    if (event.target !== input.value?.form) return
    state.edited = false
    state.errorsVisible = false
    state.customError = ''
  }

  watchEffect(() => input.value?.setCustomValidity(error.value?.message ?? ''), { flush: 'sync' })

  onMounted(() => window.addEventListener('reset', forgetErrorsForOwnForm, true))
  onBeforeUnmount(() => window.removeEventListener('reset', forgetErrorsForOwnForm, true))

  return { visibleError, markEdited, revealErrors, revealErrorsIfEdited }
}

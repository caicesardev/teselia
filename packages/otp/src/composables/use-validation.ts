import { type ComputedRef, type Ref, computed, onBeforeUnmount, onMounted, watchEffect } from 'vue'
import type { CodeOptions } from '../core/code'
import { validateCode } from '../core/validation'
import type { TesOtpElement } from '../element'
import { type ResolvedTesOtpProps, TEXT_INCOMPLETE_DEFAULTS } from '../props'

interface ValidationOptions {
  props: ResolvedTesOtpProps
  host: TesOtpElement
  options: ComputedRef<CodeOptions>
  input: Readonly<Ref<HTMLInputElement | null>>
}

export function useValidation({ props, host, options, input }: ValidationOptions) {
  const { state, internals } = host

  const error = computed(() =>
    validateCode(
      { value: state.value, length: options.value.length, required: props.required, customError: state.customError },
      {
        required: props.textRequired,
        incomplete: props.textIncomplete ?? TEXT_INCOMPLETE_DEFAULTS[options.value.type],
      },
    ),
  )

  const visibleError = computed(() => (state.errorsVisible ? error.value : null))

  function syncValidity(): void {
    const current = error.value
    if (current) internals.setValidity({ [current.flag]: true }, current.message, input.value ?? undefined)
    else internals.setValidity({})
  }

  function revealErrors(): void {
    state.errorsVisible = true
  }

  function revealErrorsIfEdited(): void {
    if (state.edited) revealErrors()
  }

  watchEffect(syncValidity, { flush: 'post' })
  onMounted(() => host.addEventListener('invalid', revealErrors))
  onBeforeUnmount(() => host.removeEventListener('invalid', revealErrors))

  return { visibleError, revealErrorsIfEdited }
}

import { type ComputedRef, computed, watch, watchEffect } from 'vue'
import { type CodeOptions, isValidLength, normalizeCode, resolveCodeOptions } from '../core/code'
import type { TesOtpState } from '../element'
import type { ResolvedTesOtpProps } from '../props'

export function useCodeOptions(props: ResolvedTesOtpProps, state: TesOtpState): ComputedRef<CodeOptions> {
  const options = computed(() => resolveCodeOptions(props))

  if (import.meta.env.DEV) {
    watchEffect(() => {
      if (props.length !== undefined && !isValidLength(props.length)) {
        console.warn(`[tes-otp] \`length\` must be an integer from 1 to 12. Using ${options.value.length}.`)
      }
      if (props.type !== undefined && props.type !== options.value.type) {
        console.warn(`[tes-otp] \`type\` must be "numeric" or "alphanumeric". Using "${options.value.type}".`)
      }
    })
  }

  watch(options, (current) => {
    state.value = normalizeCode(state.value, current).value
  })

  return options
}

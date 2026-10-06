import { type ComputedRef, computed } from 'vue'
import type { CodeOptions } from '../core/code'
import type { CodeError } from '../core/validation'
import { type ResolvedTesOtpProps, TEXT_AUTOSUBMIT_DEFAULTS, TEXT_LENGTH_DEFAULTS } from '../props'

interface DescriptionOptions {
  props: ResolvedTesOtpProps
  options: ComputedRef<CodeOptions>
  visibleError: ComputedRef<CodeError | null>
}

export function useDescription({ props, options, visibleError }: DescriptionOptions) {
  const lengthDescription = computed(() =>
    (props.textLength ?? TEXT_LENGTH_DEFAULTS[options.value.type]).replaceAll('{length}', String(options.value.length)),
  )

  const autosubmitNotice = computed(() =>
    props.autosubmit ? (props.textAutosubmit ?? TEXT_AUTOSUBMIT_DEFAULTS[options.value.type]) : '',
  )

  const describedBy = computed(() =>
    [props.hint && 'hint', 'length', autosubmitNotice.value && 'notice', visibleError.value && 'error']
      .filter(Boolean)
      .join(' '),
  )

  return { lengthDescription, autosubmitNotice, describedBy }
}

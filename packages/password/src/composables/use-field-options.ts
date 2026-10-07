import { computed, watchEffect } from 'vue'
import { autocompleteFor, isPurpose, resolvePurpose } from '../core/purpose'
import { passwordRules, resolveRuleOptions } from '../core/rules'
import type { TesPasswordProps } from '../props'

export function useFieldOptions(props: Readonly<TesPasswordProps>) {
  const purpose = computed(() => resolvePurpose(props.purpose))

  const ruleOptions = computed(() =>
    purpose.value === 'new'
      ? resolveRuleOptions({ minlength: props.minlength, maxlength: props.maxlength, requirements: props.requirements })
      : null,
  )

  const autocomplete = computed(() => autocompleteFor(purpose.value, props.autocomplete))
  const rulesForPasswordManagers = computed(() => (ruleOptions.value ? passwordRules(ruleOptions.value) : undefined))

  if (import.meta.env.DEV) {
    watchEffect(() => {
      if (props.purpose !== undefined && !isPurpose(props.purpose)) {
        console.warn(`[tes-password] \`purpose\` must be "current" or "new". Using "current".`)
      }
      const unknown = ruleOptions.value?.unknown ?? []
      if (unknown.length > 0) {
        console.warn(`[tes-password] Unknown requirements ignored: ${unknown.join(', ')}.`)
      }
      const hasRules = props.minlength !== undefined || props.maxlength !== undefined || Boolean(props.requirements)
      if (purpose.value === 'current' && hasRules) {
        console.warn('[tes-password] `minlength`, `maxlength` and `requirements` only apply with `purpose="new"`.')
      }
    })
  }

  return { purpose, ruleOptions, autocomplete, rulesForPasswordManagers }
}

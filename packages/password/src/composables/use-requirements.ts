import { type ComputedRef, computed, watch } from 'vue'
import { type RequirementChanges, requirementChanges } from '../core/changes'
import { type Requirement, type RequirementCheck, type RuleOptions, checkRequirements } from '../core/rules'
import type { TesPasswordElement } from '../element'
import type { ResolvedTesPasswordProps } from '../props'

interface RequirementsOptions {
  host: TesPasswordElement
  props: ResolvedTesPasswordProps
  ruleOptions: ComputedRef<RuleOptions | null>
  announceOnceTypingPauses: (message: () => string) => void
}

export interface RequirementItem {
  requirement: Requirement
  met: boolean
  text: string
}

export function useRequirements({ host, props, ruleOptions, announceOnceTypingPauses }: RequirementsOptions) {
  const checks = computed<RequirementCheck[]>(() =>
    ruleOptions.value ? checkRequirements(host.state.value, ruleOptions.value) : [],
  )

  const items = computed<RequirementItem[]>(() =>
    checks.value.map((check) => ({ ...check, text: ruleText(check.requirement) })),
  )

  let announcedChecks = checks.value
  let userChangePending = false

  function ruleText(requirement: Requirement): string {
    const texts: Record<Requirement, string> = {
      length: props.textRuleLength.replaceAll('{minlength}', String(ruleOptions.value?.minLength ?? '')),
      lowercase: props.textRuleLowercase,
      uppercase: props.textRuleUppercase,
      digit: props.textRuleDigit,
      symbol: props.textRuleSymbol,
    }
    return texts[requirement]
  }

  function describeChanges(changes: RequirementChanges): string {
    if (changes.allMet) return props.textAllMet
    return checks.value
      .filter((check) => changes.met.includes(check.requirement) || changes.unmet.includes(check.requirement))
      .map((check) => `${ruleText(check.requirement)}, ${check.met ? props.textRuleMet : props.textRuleUnmet}`)
      .join('. ')
  }

  function reportUserChange(): void {
    if (!ruleOptions.value) return
    userChangePending = true
    announceOnceTypingPauses(() => {
      userChangePending = false
      const changes = requirementChanges(announcedChecks, checks.value)
      announcedChecks = checks.value
      return changes ? describeChanges(changes) : ''
    })
  }

  watch(checks, (current) => {
    if (!userChangePending) announcedChecks = current
  })

  return { requirementItems: items, reportUserChange }
}

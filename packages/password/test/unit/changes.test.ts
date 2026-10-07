import { describe, expect, it } from 'vitest'
import { requirementChanges } from '../../src/core/changes'
import type { RequirementCheck } from '../../src/core/rules'

const check = (length: boolean, digit: boolean): RequirementCheck[] => [
  { requirement: 'length', met: length },
  { requirement: 'digit', met: digit },
]

describe('requirementChanges', () => {
  it('is null when no requirement changed', () => {
    expect(requirementChanges(check(false, true), check(false, true))).toBeNull()
  })

  it('lists the requirements that became met or unmet, in list order', () => {
    expect(requirementChanges(check(false, false), check(true, true))).toEqual({
      met: ['length', 'digit'],
      unmet: [],
      allMet: true,
    })
    expect(requirementChanges(check(true, true), check(false, true))).toEqual({
      met: [],
      unmet: ['length'],
      allMet: false,
    })
    expect(requirementChanges(check(true, false), check(false, true))).toEqual({
      met: ['digit'],
      unmet: ['length'],
      allMet: false,
    })
  })

  it('compares requirements by name, so a changed rule set counts as new requirements', () => {
    const before: RequirementCheck[] = [{ requirement: 'length', met: true }]

    expect(requirementChanges(before, check(true, false))).toEqual({ met: [], unmet: ['digit'], allMet: false })
  })
})

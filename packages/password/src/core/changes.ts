import type { Requirement, RequirementCheck } from './rules'

export interface RequirementChanges {
  met: Requirement[]
  unmet: Requirement[]
  allMet: boolean
}

export function requirementChanges(previous: RequirementCheck[], current: RequirementCheck[]): RequirementChanges | null {
  const wasMet = new Map(previous.map((check) => [check.requirement, check.met]))
  const changed = current.filter((check) => wasMet.get(check.requirement) !== check.met)
  if (changed.length === 0) return null

  return {
    met: changed.filter((check) => check.met).map((check) => check.requirement),
    unmet: changed.filter((check) => !check.met).map((check) => check.requirement),
    allMet: current.every((check) => check.met),
  }
}

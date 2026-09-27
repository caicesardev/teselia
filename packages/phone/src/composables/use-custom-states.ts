import { watchEffect } from 'vue'

export type CustomState = 'invalid' | 'open' | 'empty'

export function useCustomStates(internals: ElementInternals, states: () => Record<CustomState, boolean>): void {
  watchEffect(() => {
    const customStates = internals.states
    if (!customStates) return

    for (const [name, active] of Object.entries(states())) {
      if (active) customStates.add(name)
      else customStates.delete(name)
    }
  })
}

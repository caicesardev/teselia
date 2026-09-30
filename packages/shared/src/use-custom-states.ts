import { watchEffect } from 'vue'

export function useCustomStates<State extends string>(
  internals: ElementInternals,
  states: () => Record<State, boolean>,
): void {
  watchEffect(() => {
    const customStates = internals.states
    if (!customStates) return

    for (const [name, active] of Object.entries<boolean>(states())) {
      if (active) customStates.add(name)
      else customStates.delete(name)
    }
  })
}

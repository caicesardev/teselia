import type { ComputedRef } from 'vue'
import type { CodeOptions } from '../core/code'
import type { TesOtpState } from '../element'

interface PublicEventsOptions {
  host: HTMLElement
  state: TesOtpState
  options: ComputedRef<CodeOptions>
}

export function usePublicEvents({ host, state, options }: PublicEventsOptions) {
  let valueWhenFocused = ''

  const isComplete = (value: string): boolean => value.length === options.value.length

  function dispatch(name: 'input' | 'change' | 'complete', detail: object): void {
    host.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function announceUserChange(previous: string): void {
    if (state.value === previous) return
    dispatch('input', { value: state.value, complete: isComplete(state.value) })
    if (isComplete(state.value)) dispatch('complete', { value: state.value })
  }

  function rememberValueWhenFocused(): void {
    valueWhenFocused = state.value
  }

  function commitChange(): void {
    if (state.value === valueWhenFocused) return
    valueWhenFocused = state.value
    dispatch('change', { value: state.value, complete: isComplete(state.value) })
  }

  return { announceUserChange, rememberValueWhenFocused, commitChange }
}

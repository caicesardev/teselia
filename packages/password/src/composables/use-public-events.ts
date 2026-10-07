import type { TesPasswordElement } from '../element'

export function usePublicEvents(host: TesPasswordElement) {
  function dispatch(name: 'input' | 'change'): void {
    const detail = { value: host.value, requirementsMet: host.requirementsMet }
    host.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  return {
    dispatchInput: () => dispatch('input'),
    dispatchChange: () => dispatch('change'),
  }
}

import { watch } from 'vue'
import { interpretPhoneNumber } from '../core/phone-number'
import type { TesPhoneState } from '../element'

export type PublicEventName = 'input' | 'change' | 'countrychange'

export type DispatchPublicEvent = (name: PublicEventName) => void

export function usePublicEvents(host: HTMLElement, state: TesPhoneState): DispatchPublicEvent {
  function dispatchPublicEvent(name: PublicEventName): void {
    const { e164, valid } = interpretPhoneNumber(state.nationalInput, state.country)
    host.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail: { value: e164, country: state.country, valid },
      }),
    )
  }

  return dispatchPublicEvent
}

export function watchCountryChanges(
  state: TesPhoneState,
  dispatchPublicEvent: DispatchPublicEvent,
  syncFormState: () => void,
): void {
  watch(
    () => state.country,
    () => {
      syncFormState()
      dispatchPublicEvent('countrychange')
    },
    { flush: 'sync' },
  )
}

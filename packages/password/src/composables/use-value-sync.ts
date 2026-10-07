import { type Ref, onBeforeUnmount, onMounted } from 'vue'
import type { TesPasswordElement } from '../element'

interface ValueSyncOptions {
  host: TesPasswordElement
  input: Readonly<Ref<HTMLInputElement | null>>
}

export function useValueSync({ host, input }: ValueSyncOptions) {
  function syncFromInput(): void {
    if (input.value) host.state.value = input.value.value
  }

  function syncAfterOwnFormReset(event: Event): void {
    if (event.target === input.value?.form) setTimeout(syncFromInput)
  }

  onMounted(() => {
    syncFromInput()
    window.addEventListener('reset', syncAfterOwnFormReset, true)
  })

  onBeforeUnmount(() => window.removeEventListener('reset', syncAfterOwnFormReset, true))

  return { syncFromInput }
}

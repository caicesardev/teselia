import { useAnnouncer } from '@teselia/shared'
import { type Ref, computed, onBeforeUnmount, onMounted } from 'vue'
import type { TesPasswordElement } from '../element'
import type { ResolvedTesPasswordProps } from '../props'

interface RevealOptions {
  host: TesPasswordElement
  props: ResolvedTesPasswordProps
  input: Readonly<Ref<HTMLInputElement | null>>
}

export function useReveal({ host, props, input }: RevealOptions) {
  const { announcement, announceNow } = useAnnouncer()

  const inputType = computed(() => (host.state.revealed ? 'text' : 'password'))
  const toggleText = computed(() => (host.state.revealed ? props.textHide : props.textShow))
  const toggleLabel = computed(() => (host.state.revealed ? props.textHideLabel : props.textShowLabel))

  function toggleByUser(): void {
    host.revealed = !host.revealed
    announceNow(host.revealed ? props.textShown : props.textHidden)
  }

  function hide(): void {
    host.revealed = false
  }

  function hideForOwnForm(event: Event): void {
    if (event.target === input.value?.form) hide()
  }

  onMounted(() => {
    window.addEventListener('submit', hideForOwnForm, true)
    window.addEventListener('reset', hideForOwnForm, true)
    window.addEventListener('pagehide', hide)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('submit', hideForOwnForm, true)
    window.removeEventListener('reset', hideForOwnForm, true)
    window.removeEventListener('pagehide', hide)
  })

  return { announcement, inputType, toggleText, toggleLabel, toggleByUser }
}

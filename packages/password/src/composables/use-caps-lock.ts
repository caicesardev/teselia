import { ref } from 'vue'
import type { ResolvedTesPasswordProps } from '../props'

interface CapsLockOptions {
  props: ResolvedTesPasswordProps
  announceNow: (message: string) => void
}

export function useCapsLock({ props, announceNow }: CapsLockOptions) {
  const capsLockOn = ref(false)

  function readCapsLock(event: KeyboardEvent | PointerEvent): void {
    const on = event.getModifierState('CapsLock')
    if (on && !capsLockOn.value) announceNow(props.textCapsLock)
    capsLockOn.value = on
  }

  function forgetCapsLock(): void {
    capsLockOn.value = false
  }

  return { capsLockOn, readCapsLock, forgetCapsLock }
}

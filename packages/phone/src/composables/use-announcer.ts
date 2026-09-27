import { type Ref, nextTick, onBeforeUnmount, ref } from 'vue'

const TYPING_PAUSE_MS = 500

export interface Announcer {
  announcement: Ref<string>
  announceNow: (message: string) => void
  announceOnceTypingPauses: (message: () => string) => void
  clear: () => void
}

export function useAnnouncer(): Announcer {
  const announcement = ref('')
  let pending: ReturnType<typeof setTimeout> | undefined

  function clear(): void {
    clearTimeout(pending)
    announcement.value = ''
  }

  function announceNow(message: string): void {
    clear()
    void nextTick(() => {
      announcement.value = message
    })
  }

  function announceOnceTypingPauses(message: () => string): void {
    clear()
    pending = setTimeout(() => {
      announcement.value = message()
    }, TYPING_PAUSE_MS)
  }

  onBeforeUnmount(() => clearTimeout(pending))

  return { announcement, announceNow, announceOnceTypingPauses, clear }
}

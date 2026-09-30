import { type Ref, onBeforeUnmount, ref } from 'vue'

const TYPING_PAUSE_MS = 500
// Chromium batches accessibility updates per frame, so emptying and refilling the region in one task
// is a no-op for a repeated message. The gap makes the empty state reach the accessibility tree.
const EMPTY_REGION_GAP_MS = 100

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
    pending = setTimeout(() => {
      announcement.value = message
    }, EMPTY_REGION_GAP_MS)
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

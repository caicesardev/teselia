import { useAnnouncer } from '@teselia/shared'
import type { ComputedRef } from 'vue'
import type { CodeOptions } from '../core/code'
import { type ResolvedTesOtpProps, TEXT_INVALID_CHARACTER_DEFAULTS } from '../props'

export function useAnnouncements(props: ResolvedTesOtpProps, options: ComputedRef<CodeOptions>) {
  const announcer = useAnnouncer()

  function reportTypedCharacters(rejected: boolean): void {
    if (rejected) {
      announcer.announceOnceTypingPauses(
        () => props.textInvalidCharacter ?? TEXT_INVALID_CHARACTER_DEFAULTS[options.value.type],
      )
    } else {
      announcer.clear()
    }
  }

  return { announcement: announcer.announcement, reportTypedCharacters }
}

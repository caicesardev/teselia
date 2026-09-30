import type { ComputedRef } from 'vue'
import { type CodeOptions, normalizeCode } from '../core/code'
import type { TesOtpState } from '../element'

interface CodeInputOptions {
  state: TesOtpState
  options: ComputedRef<CodeOptions>
  syncSelection: () => void
}

export function useCodeInput({ state, options, syncSelection }: CodeInputOptions) {
  function updateFromUserInput(event: Event): void {
    const input = event.target as HTMLInputElement
    const { value } = normalizeCode(input.value, options.value)

    if (value !== input.value) {
      const caret = input.selectionStart ?? input.value.length
      const caretAfterNormalizing = normalizeCode(input.value.slice(0, caret), options.value).value.length
      input.value = value
      input.setSelectionRange(caretAfterNormalizing, caretAfterNormalizing)
    }

    state.value = value
    state.dirty = true
    syncSelection()
  }

  return { updateFromUserInput }
}

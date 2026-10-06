import type { ComputedRef } from 'vue'
import { type CodeOptions, normalizeCode } from '../core/code'
import type { TesOtpState } from '../element'

interface CodeInputOptions {
  state: TesOtpState
  options: ComputedRef<CodeOptions>
  syncSelection: () => void
  announceUserChange: (previous: string) => boolean
  onComplete: () => void
}

export function useCodeInput({ state, options, syncSelection, announceUserChange, onComplete }: CodeInputOptions) {
  function updateFromUserInput(event: Event): void {
    if ((event as InputEvent).isComposing) return
    normalizeField(event.target as HTMLInputElement)
  }

  function finishComposition(event: CompositionEvent): void {
    normalizeField(event.target as HTMLInputElement)
  }

  function replaceWithPastedCode(event: ClipboardEvent): void {
    if ((event.target as HTMLInputElement).readOnly) return
    const pasted = normalizeCode(event.clipboardData?.getData('text') ?? '', options.value).value
    const isCompleteCode = pasted.length === options.value.length
    if (pasted !== '' && !isCompleteCode) return

    event.preventDefault()
    if (isCompleteCode) commit(event.target as HTMLInputElement, pasted, pasted.length)
  }

  function normalizeField(input: HTMLInputElement): void {
    const caret = input.selectionStart ?? input.value.length
    const value = normalizeCode(input.value, options.value).value
    const caretAfterNormalizing = normalizeCode(input.value.slice(0, caret), options.value).value.length
    commit(input, value, caretAfterNormalizing)
  }

  function commit(input: HTMLInputElement, value: string, caret: number): void {
    const previous = state.value
    if (input.value !== value) {
      input.value = value
      input.setSelectionRange(caret, caret)
    }
    state.value = value
    state.dirty = true
    state.edited = true
    state.customError = ''
    syncSelection()
    if (announceUserChange(previous)) onComplete()
  }

  return { updateFromUserInput, finishComposition, replaceWithPastedCode }
}

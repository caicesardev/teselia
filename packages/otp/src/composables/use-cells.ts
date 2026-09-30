import { type ComputedRef, type Ref, computed, ref } from 'vue'
import { type TextSelection, isCellActive, overwriteSelection, selectionAfterArrowLeft } from '../core/selection'
import type { TesOtpState } from '../element'

export interface Cell {
  character: string
  filled: boolean
  active: boolean
  showsCaret: boolean
}

interface CellsOptions {
  state: TesOtpState
  length: ComputedRef<number>
  input: Readonly<Ref<HTMLInputElement | null>>
  cellElements: Readonly<Ref<HTMLElement[] | null>>
}

export function useCells(options: CellsOptions) {
  const { state, length, input, cellElements } = options

  const focused = ref(false)
  const selection = ref<TextSelection>({ start: 0, end: 0 })

  const cells = computed<Cell[]>(() =>
    Array.from({ length: length.value }, (_, index) => {
      const active = focused.value && isCellActive(index, selection.value)
      const collapsed = selection.value.start === selection.value.end
      return {
        character: state.value[index] ?? '',
        filled: index < state.value.length,
        active,
        showsCaret: active && collapsed && index >= state.value.length,
      }
    }),
  )

  function select(next: TextSelection): void {
    const element = input.value
    if (!element) return
    if (element.selectionStart !== next.start || element.selectionEnd !== next.end) {
      element.setSelectionRange(next.start, next.end)
    }
    selection.value = next
  }

  function syncSelection(): void {
    const element = input.value
    if (!element || !focused.value) return
    const current = { start: element.selectionStart ?? 0, end: element.selectionEnd ?? 0 }
    select(overwriteSelection(current, state.value.length, length.value))
  }

  function startTracking(): void {
    focused.value = true
    syncSelection()
  }

  function stopTracking(): void {
    focused.value = false
  }

  function moveBackOnArrowLeft(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const previous = selectionAfterArrowLeft(selection.value)
    if (!previous) return
    event.preventDefault()
    select(previous)
  }

  function selectCellUnderPointer(event: PointerEvent): void {
    const element = input.value
    if (!element || (element.selectionEnd ?? 0) - (element.selectionStart ?? 0) > 1) return
    const index = nearestCellIndex(event.clientX)
    if (index === null) return
    select(overwriteSelection({ start: index, end: index }, state.value.length, length.value))
  }

  function nearestCellIndex(clientX: number): number | null {
    let nearest: number | null = null
    let shortestDistance = Number.POSITIVE_INFINITY
    for (const [index, cell] of (cellElements.value ?? []).entries()) {
      const { left, right } = cell.getBoundingClientRect()
      const distance = Math.max(left - clientX, 0, clientX - right)
      if (distance < shortestDistance) {
        shortestDistance = distance
        nearest = index
      }
    }
    return nearest
  }

  return { cells, syncSelection, startTracking, stopTracking, moveBackOnArrowLeft, selectCellUnderPointer }
}

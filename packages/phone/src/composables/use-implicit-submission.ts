const TYPES_BLOCKING_IMPLICIT_SUBMISSION = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
])

function isSubmitButton(element: Element): element is HTMLButtonElement | HTMLInputElement {
  if (element instanceof HTMLButtonElement) return element.type === 'submit'
  if (element instanceof HTMLInputElement) return element.type === 'submit' || element.type === 'image'
  return false
}

function blocksImplicitSubmission(element: Element): boolean {
  return element instanceof HTMLInputElement && TYPES_BLOCKING_IMPLICIT_SUBMISSION.has(element.type)
}

export function useImplicitSubmission(internals: ElementInternals): () => void {
  return function submitOwnerForm(): void {
    const form = internals.form
    if (!form) return

    const controls = Array.from(form.elements)
    const defaultButton = controls.find(isSubmitButton)
    if (defaultButton) defaultButton.click()
    else if (!controls.some(blocksImplicitSubmission)) form.requestSubmit()
  }
}

import { useImplicitSubmission } from '@teselia/shared'
import type { ResolvedTesOtpProps } from '../props'

interface SubmissionOptions {
  props: ResolvedTesOtpProps
  internals: ElementInternals
  commitChange: () => void
}

export function useSubmission({ props, internals, commitChange }: SubmissionOptions) {
  const submitOwnerForm = useImplicitSubmission(internals)

  function submit(): void {
    commitChange()
    submitOwnerForm()
  }

  function submitOnEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.isComposing) submit()
  }

  function submitIfAutosubmit(): void {
    if (props.autosubmit) submit()
  }

  return { submitOnEnter, submitIfAutosubmit }
}

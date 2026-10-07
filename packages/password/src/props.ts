import type { Purpose } from './core/purpose'

export interface TesPasswordProps {
  label?: string
  name?: string
  purpose?: Purpose
  minlength?: number
  maxlength?: number
  requirements?: string
  autocomplete?: string
}

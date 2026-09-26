<script setup lang="ts">
import { onMounted, useHost, useTemplateRef, watch } from 'vue'
import type { TesPhoneElement } from './element'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label?: string
  required?: boolean
}>()

const host = useHost() as TesPhoneElement
const { state, internals } = host
const input = useTemplateRef<HTMLInputElement>('input')

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-phone] The `label` attribute is required for an accessible name.')
}

function updateFromUserInput(event: Event): void {
  state.value = (event.target as HTMLInputElement).value
  state.dirty = true
}

function syncFormState(): void {
  internals.setFormValue(state.value)

  if (props.required && state.value === '') {
    internals.setValidity({ valueMissing: true }, 'Enter a phone number', input.value ?? undefined)
  } else {
    internals.setValidity({})
  }
}

watch([() => state.value, () => props.required], syncFormState)
onMounted(syncFormState)
</script>

<template>
  <div class="field" part="field">
    <label for="number" part="label">{{ label }}</label>
    <input
      id="number"
      ref="input"
      :value="state.value"
      part="number"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      dir="ltr"
      :required="required"
      :disabled="state.disabledByForm"
      @input="updateFromUserInput"
    />
  </div>
</template>

<style>
:host {
  display: inline-block;
  font: inherit;
}

:host([hidden]) {
  display: none;
}

.field {
  display: grid;
  gap: 0.25rem;
}

input {
  font: inherit;
  min-block-size: 2.75rem;
  padding-inline: 0.75rem;
}

input:focus-visible {
  outline: 2px solid var(--tes-color-focus, Highlight);
  outline-offset: 2px;
}
</style>

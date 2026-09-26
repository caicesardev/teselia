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

<style>
:host {
  --_text: var(--tes-color-text, light-dark(#1f2328, #e8eaee));
  --_muted: var(--tes-color-muted, light-dark(#59636e, #a3adba));
  --_bg: var(--tes-color-bg, light-dark(#ffffff, #16181d));
  --_border: var(--tes-color-border, light-dark(#7d8590, #7f8a99));
  --_accent: var(--tes-color-accent, light-dark(#0b5fcc, #7aa7ff));
  --_on-accent: var(--tes-color-on-accent, light-dark(#ffffff, #0d1117));
  --_hover: var(--tes-color-hover, light-dark(#eef3fb, #232a36));
  --_focus: var(--tes-color-focus, light-dark(#0b5fcc, #7aa7ff));
  --_error: var(--tes-color-error, light-dark(#c4232b, #ff8a80));
  --_radius: var(--tes-radius, 0.375rem);
  --_space: var(--tes-space, 0.5rem);
  --_popup-max-height: var(--tes-popup-max-height, 18rem);
  --_control-height: 2.75rem;

  display: inline-block;
  color: var(--_text);
  font-family: var(--tes-font-family);
  font-size: var(--tes-font-size);
}

:host([hidden]) {
  display: none;
}

.field {
  display: grid;
  gap: calc(var(--_space) / 2);
}

label {
  font-weight: 500;
}

input {
  box-sizing: border-box;
  min-block-size: var(--_control-height);
  padding-inline: calc(var(--_space) * 1.5);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_text);
  font: inherit;
}

input:focus-visible {
  outline: 2px solid var(--_focus);
  outline-offset: 2px;
}
</style>

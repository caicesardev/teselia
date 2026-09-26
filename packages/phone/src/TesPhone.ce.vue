<script setup lang="ts">
import { onMounted, ref, useHost, useTemplateRef, watch } from 'vue'
import type { TesPhoneElement } from './element'

const props = defineProps<{
  value?: string
  label?: string
  required?: boolean
}>()

const host = useHost() as TesPhoneElement | null
const input = useTemplateRef<HTMLInputElement>('input')

const current = ref(props.value ?? '')
const disabled = ref(false)

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-phone] The `label` attribute is required for an accessible name.')
}

function syncFormState(): void {
  if (!host) return
  const { internals } = host

  internals.setFormValue(current.value)

  if (props.required && current.value === '') {
    internals.setValidity({ valueMissing: true }, 'Enter a phone number', input.value ?? undefined)
  } else {
    internals.setValidity({})
  }
}

if (host) {
  host.formCallbacks = {
    reset: () => {
      current.value = props.value ?? ''
    },
    disabled: (isDisabled) => {
      disabled.value = isDisabled
    },
  }
}

watch([current, () => props.required], syncFormState)
onMounted(syncFormState)
</script>

<template>
  <div class="field" part="field">
    <label for="number" part="label">{{ label }}</label>
    <input
      id="number"
      ref="input"
      v-model="current"
      part="number"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      dir="ltr"
      :required="required"
      :disabled="disabled"
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

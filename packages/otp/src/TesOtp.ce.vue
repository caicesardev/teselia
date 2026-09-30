<template>
  <div class="field" part="field">
    <label for="code" part="label">{{ label }}</label>
    <input
      id="code"
      :value="state.value"
      type="text"
      :autocomplete="autocomplete"
      :disabled="state.disabledByForm"
      spellcheck="false"
      @input.stop="updateFromUserInput"
    />
  </div>
</template>

<script setup lang="ts">
import { useHost, watchEffect } from 'vue'
import type { TesOtpElement } from './element'
import { TES_OTP_DEFAULTS, type TesOtpProps } from './props'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TesOtpProps>(), TES_OTP_DEFAULTS)

const host = useHost() as TesOtpElement
const { state, internals } = host

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-otp] The `label` attribute is required for an accessible name.')
}

function updateFromUserInput(event: Event): void {
  state.value = (event.target as HTMLInputElement).value
  state.dirty = true
}

watchEffect(() => internals.setFormValue(state.value))
</script>

<style src="@teselia/shared/base.css"></style>
<style src="./tes-otp.css"></style>

<template>
  <div class="tes-password__field">
    <label :for="inputId" class="tes-password__label">{{ label }}</label>
    <div class="tes-password__control">
      <input
        :id="inputId"
        ref="input"
        class="tes-password__input"
        :type="inputType"
        :name="name"
        :value.attr="defaultValue"
        :autocomplete="autocomplete"
        :passwordrules="rulesForPasswordManagers"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
      />
      <button type="button" class="tes-password__toggle" :aria-label="toggleLabel" @click="toggleByUser">
        {{ toggleText }}
      </button>
    </div>
    <div role="status" class="tes-password__visually-hidden">{{ announcement }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, useHost, useTemplateRef } from 'vue'
import { useFieldOptions } from './composables/use-field-options'
import { useReveal } from './composables/use-reveal'
import { nextInstanceId } from './core/ids'
import type { TesPasswordElement } from './element'
import { TES_PASSWORD_DEFAULTS, type TesPasswordProps } from './props'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TesPasswordProps>(), TES_PASSWORD_DEFAULTS)
const attrs = useAttrs()
const host = useHost() as TesPasswordElement
const input = useTemplateRef<HTMLInputElement>('input')

const inputId = nextInstanceId('tes-password')
const defaultValue = computed(() => (typeof attrs.value === 'string' ? attrs.value : undefined))

const { autocomplete, rulesForPasswordManagers } = useFieldOptions(props)
const { announcement, inputType, toggleText, toggleLabel, toggleByUser } = useReveal({ host, props, input })

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-password] The `label` attribute is required for an accessible name.')
}
</script>

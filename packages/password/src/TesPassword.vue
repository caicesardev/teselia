<template>
  <div class="tes-password__field">
    <label :for="inputId" class="tes-password__label">{{ label }}</label>
    <div class="tes-password__control">
      <input
        :id="inputId"
        class="tes-password__input"
        type="password"
        :name="name"
        :value.attr="defaultValue"
        :autocomplete="autocomplete"
        :passwordrules="rulesForPasswordManagers"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useFieldOptions } from './composables/use-field-options'
import { nextInstanceId } from './core/ids'
import type { TesPasswordProps } from './props'

defineOptions({ inheritAttrs: false })

const props = defineProps<TesPasswordProps>()
const attrs = useAttrs()

const inputId = nextInstanceId('tes-password')
const defaultValue = computed(() => (typeof attrs.value === 'string' ? attrs.value : undefined))

const { autocomplete, rulesForPasswordManagers } = useFieldOptions(props)

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-password] The `label` attribute is required for an accessible name.')
}
</script>

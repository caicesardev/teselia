<template>
  <div class="tes-password__field">
    <label :for="inputId" class="tes-password__label">{{ label }}</label>
    <div class="tes-password__control" :class="{ 'tes-password__control--invalid': visibleError }">
      <input
        :id="inputId"
        ref="input"
        class="tes-password__input"
        :type="inputType"
        :name="name"
        :value.attr="defaultValue"
        :autocomplete="autocomplete"
        :passwordrules="rulesForPasswordManagers"
        :aria-describedby="describedBy"
        :aria-invalid="visibleError ? 'true' : undefined"
        :required="required"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        @input="handleUserInput"
        @keydown="readCapsLock"
        @keyup="readCapsLock"
        @pointerdown="readCapsLock"
        @blur="leaveField"
        @invalid="revealErrors"
      />
      <button type="button" class="tes-password__toggle" :aria-label="toggleLabel" @click="toggleByUser">
        <span class="tes-password__toggle-text" :class="{ 'tes-password__toggle-text--inactive': revealed }">{{
          textShow
        }}</span>
        <span class="tes-password__toggle-text" :class="{ 'tes-password__toggle-text--inactive': !revealed }">{{
          textHide
        }}</span>
      </button>
    </div>
    <p v-if="hint" :id="hintId" class="tes-password__hint">{{ hint }}</p>
    <p v-if="capsLockOn" :id="capsLockId" class="tes-password__caps-lock">{{ textCapsLock }}</p>
    <div v-if="requirementItems.length" :id="requirementsId" class="tes-password__requirements">
      <p class="tes-password__requirements-title">{{ textRequirements }}</p>
      <ul class="tes-password__requirements-list">
        <li
          v-for="item in requirementItems"
          :key="item.requirement"
          class="tes-password__requirement"
          :class="{ 'tes-password__requirement--met': item.met }"
        >
          <svg
            v-if="item.met"
            class="tes-password__icon tes-password__icon--met"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
          <svg
            v-else
            class="tes-password__icon tes-password__icon--unmet"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="8" cy="8" r="5" />
          </svg>
          <span>{{ item.text }}</span
          ><span class="tes-password__visually-hidden">, {{ item.met ? textRuleMet : textRuleUnmet }}</span>
        </li>
      </ul>
    </div>
    <p :id="errorId" class="tes-password__error" aria-live="polite">{{ visibleError?.message }}</p>
    <div role="status" class="tes-password__visually-hidden">{{ announcement }}</div>
  </div>
</template>

<script setup lang="ts">
import { useAnnouncer } from '@teselia/shared'
import { computed, useAttrs, useHost, useTemplateRef } from 'vue'
import { useCapsLock } from './composables/use-caps-lock'
import { useFieldOptions } from './composables/use-field-options'
import { useRequirements } from './composables/use-requirements'
import { useReveal } from './composables/use-reveal'
import { useValidation } from './composables/use-validation'
import { useValueSync } from './composables/use-value-sync'
import { nextInstanceId } from './core/ids'
import type { TesPasswordElement } from './element'
import { TES_PASSWORD_DEFAULTS, type TesPasswordProps } from './props'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TesPasswordProps>(), TES_PASSWORD_DEFAULTS)
const attrs = useAttrs()
const host = useHost() as TesPasswordElement
const input = useTemplateRef<HTMLInputElement>('input')

const inputId = nextInstanceId('tes-password')
const requirementsId = `${inputId}-requirements`
const capsLockId = `${inputId}-caps-lock`
const hintId = `${inputId}-hint`
const errorId = `${inputId}-error`
const defaultValue = computed(() => (typeof attrs.value === 'string' ? attrs.value : undefined))

const { announcement, announceNow, announceOnceTypingPauses } = useAnnouncer()
const { ruleOptions, autocomplete, rulesForPasswordManagers } = useFieldOptions(props)
const { revealed, inputType, toggleLabel, toggleByUser } = useReveal({ host, props, input, announceNow })
const { syncFromInput } = useValueSync({ host, input })
const { requirementItems, reportUserChange } = useRequirements({
  host,
  props,
  ruleOptions,
  announceOnceTypingPauses,
})

const { capsLockOn, readCapsLock, forgetCapsLock } = useCapsLock({ props, announceNow })

const { visibleError, markEdited, revealErrors, revealErrorsIfEdited } = useValidation({
  host,
  props,
  input,
  ruleOptions,
})

const describedBy = computed(() => {
  const ids = [
    props.hint && hintId,
    requirementItems.value.length > 0 && requirementsId,
    capsLockOn.value && capsLockId,
    visibleError.value && errorId,
  ].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
})

function handleUserInput(): void {
  markEdited()
  syncFromInput()
  reportUserChange()
}

function leaveField(): void {
  forgetCapsLock()
  revealErrorsIfEdited()
}

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-password] The `label` attribute is required for an accessible name.')
}
</script>

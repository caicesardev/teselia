<template>
  <div class="field" part="field">
    <label for="code" part="label">{{ label }}</label>

    <div class="code" :class="{ invalid: visibleError }">
      <input
        id="code"
        ref="input"
        :value="state.value"
        type="text"
        :inputmode="options.type === 'numeric' ? 'numeric' : 'text'"
        :autocapitalize="options.type === 'numeric' ? 'off' : 'characters'"
        autocorrect="off"
        :autocomplete="autocomplete"
        :disabled="state.disabledByForm"
        :required="required"
        :aria-invalid="visibleError ? 'true' : undefined"
        :aria-describedby="describedBy"
        spellcheck="false"
        @input.stop="updateFromUserInput"
        @compositionend="finishComposition"
        @paste="replaceWithPastedCode"
        @focus="enterField"
        @blur="leaveField"
        @selectionchange="syncSelection"
        @keyup="syncSelection"
        @keydown="handleKeydown"
        @pointerup="selectCellUnderPointer"
      />
      <div class="cells" part="cells" aria-hidden="true">
        <span
          v-for="(cell, index) in cells"
          :key="index"
          ref="cellElements"
          class="cell"
          :class="{ filled: cell.filled, active: cell.active }"
          :part="cellPart(cell)"
          >{{ cell.character }}<span v-if="cell.showsCaret" class="caret"></span
        ></span>
      </div>
    </div>

    <p v-if="autosubmitNotice" id="notice" class="notice" part="notice">{{ autosubmitNotice }}</p>
    <p id="error" class="error" part="error" aria-live="polite">{{ visibleError?.message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useHost, useTemplateRef, watchEffect } from 'vue'
import { type Cell, useCells } from './composables/use-cells'
import { useCodeInput } from './composables/use-code-input'
import { useCodeOptions } from './composables/use-code-options'
import { usePublicEvents } from './composables/use-public-events'
import { useSubmission } from './composables/use-submission'
import { useValidation } from './composables/use-validation'
import type { TesOtpElement } from './element'
import { TES_OTP_DEFAULTS, TEXT_AUTOSUBMIT_DEFAULTS, type TesOtpProps } from './props'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TesOtpProps>(), TES_OTP_DEFAULTS)

const host = useHost() as TesOtpElement
const { state, internals } = host
const input = useTemplateRef<HTMLInputElement>('input')
const cellElements = useTemplateRef<HTMLElement[]>('cellElements')

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-otp] The `label` attribute is required for an accessible name.')
}

const options = useCodeOptions(props, state)
const length = computed(() => options.value.length)

const { cells, syncSelection, startTracking, stopTracking, moveBackOnArrowLeft, selectCellUnderPointer } = useCells({
  state,
  length,
  input,
  cellElements,
})

const { announceUserChange, rememberValueWhenFocused, commitChange } = usePublicEvents({ host, state, options })

const { submitOnEnter, submitIfAutosubmit } = useSubmission({ props, internals, commitChange })

const { updateFromUserInput, finishComposition, replaceWithPastedCode } = useCodeInput({
  state,
  options,
  syncSelection,
  announceUserChange,
  onComplete: submitIfAutosubmit,
})

const { visibleError, revealErrorsIfEdited } = useValidation({ props, host, options, input })

const autosubmitNotice = computed(() =>
  props.autosubmit ? (props.textAutosubmit ?? TEXT_AUTOSUBMIT_DEFAULTS[options.value.type]) : '',
)

const describedBy = computed(
  () => [autosubmitNotice.value && 'notice', visibleError.value && 'error'].filter(Boolean).join(' ') || undefined,
)

function handleKeydown(event: KeyboardEvent): void {
  moveBackOnArrowLeft(event)
  submitOnEnter(event)
}

function enterField(): void {
  startTracking()
  rememberValueWhenFocused()
}

function leaveField(): void {
  stopTracking()
  revealErrorsIfEdited()
  commitChange()
}

function cellPart(cell: Cell): string {
  return ['cell', cell.filled && 'cell-filled', cell.active && 'cell-active'].filter(Boolean).join(' ')
}

watchEffect(() => internals.setFormValue(state.value), { flush: 'sync' })
</script>

<style src="@teselia/shared/base.css"></style>
<style src="./tes-otp.css"></style>

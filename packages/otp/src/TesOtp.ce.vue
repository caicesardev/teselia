<template>
  <div class="field" part="field">
    <label for="code" part="label">{{ label }}</label>

    <div class="code">
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
        spellcheck="false"
        @input.stop="updateFromUserInput"
        @compositionend="finishComposition"
        @paste="replaceWithPastedCode"
        @focus="startTracking"
        @blur="stopTracking"
        @selectionchange="syncSelection"
        @keyup="syncSelection"
        @keydown="moveBackOnArrowLeft"
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
  </div>
</template>

<script setup lang="ts">
import { computed, useHost, useTemplateRef, watchEffect } from 'vue'
import { type Cell, useCells } from './composables/use-cells'
import { useCodeInput } from './composables/use-code-input'
import { useCodeOptions } from './composables/use-code-options'
import type { TesOtpElement } from './element'
import { TES_OTP_DEFAULTS, type TesOtpProps } from './props'

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

const { updateFromUserInput, finishComposition, replaceWithPastedCode } = useCodeInput({ state, options, syncSelection })

function cellPart(cell: Cell): string {
  return ['cell', cell.filled && 'cell-filled', cell.active && 'cell-active'].filter(Boolean).join(' ')
}

watchEffect(() => internals.setFormValue(state.value))
</script>

<style src="@teselia/shared/base.css"></style>
<style src="./tes-otp.css"></style>

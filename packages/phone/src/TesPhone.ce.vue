<template>
  <div class="field" part="field">
    <label id="label" for="number" part="label">{{ label }}</label>

    <div role="group" aria-labelledby="label" class="controls" part="group">
      <div class="country">
        <input
          id="country"
          ref="combobox"
          role="combobox"
          :value="comboboxText"
          :aria-label="textCountry"
          :aria-expanded="isOpen && hasOptions ? 'true' : 'false'"
          aria-controls="countries"
          aria-autocomplete="list"
          :aria-activedescendant="highlightedOptionId"
          :aria-invalid="visibleError?.anchor === 'country' ? 'true' : undefined"
          :aria-describedby="visibleError?.anchor === 'country' ? 'error' : undefined"
          :disabled="state.disabledByForm"
          :readonly="readonly"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          part="country"
          @focus="selectTextSoTypingReplacesIt"
          @mousedown="focusWithoutPlacingCaret"
          @click="openFromPointer"
          @keydown="handleComboboxKeydown"
          @input.stop="filterByTypedText"
          @blur="closeAndRestoreSelection"
        />
        <span class="toggle" aria-hidden="true" @click="toggleFromChevron">
          <svg class="chevron" viewBox="0 0 16 16" focusable="false">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </div>

      <input
        id="number"
        ref="number"
        :value="state.nationalInput"
        part="number"
        type="tel"
        inputmode="tel"
        :autocomplete="autocomplete"
        dir="ltr"
        :required="required"
        :aria-invalid="visibleError?.anchor === 'number' ? 'true' : undefined"
        :aria-describedby="numberDescribedBy"
        :disabled="state.disabledByForm"
        :readonly="readonly"
        @focus="rememberTextBeforeEditing"
        @input.stop="updateFromUserInput"
        @blur="commitEditing"
        @keydown.enter="submitOnEnter"
      />
    </div>

    <p v-if="hint" id="hint" class="hint" part="hint">{{ hint }}</p>
    <p id="error" class="error" part="error" aria-live="polite">{{ visibleError?.message }}</p>

    <div id="popup" ref="popup" popover="manual" part="popup">
      <div id="countries" role="listbox" :aria-label="textCountry" :hidden="!hasOptions" part="listbox">
        <div
          v-for="section in sections"
          :key="section.key"
          :role="section.label ? 'group' : 'none'"
          :aria-labelledby="section.label ? `group-${section.key}` : undefined"
          :class="{ group: section.label }"
        >
          <div v-if="section.label" :id="`group-${section.key}`" role="presentation" class="group-label" part="group-label">
            {{ section.label }}
          </div>
          <div
            v-for="country in section.countries"
            :id="optionId(country.code)"
            :key="country.code"
            role="option"
            :aria-selected="country.code === state.country ? 'true' : 'false'"
            :part="country.code === state.country ? 'option option-selected' : 'option'"
            :class="{ highlighted: country.code === highlightedCode }"
            @click="selectCountry(country.code)"
          >
            <span class="option-name">{{ country.name }}</span> <span class="option-code">+{{ country.callingCode }}</span>
          </div>
        </div>
      </div>
      <p v-if="!hasOptions" class="no-results" part="no-results">{{ textNoResults }}</p>
    </div>

    <div role="status" class="visually-hidden">{{ announcement }}</div>
  </div>
</template>

<script setup lang="ts">
import { useHost, useTemplateRef } from 'vue'
import { useAnnouncer } from './composables/use-announcer'
import { useCountryCombobox } from './composables/use-country-combobox'
import { useCountryList } from './composables/use-country-list'
import { useCustomStates } from './composables/use-custom-states'
import { useImplicitSubmission } from './composables/use-implicit-submission'
import { useLocale } from './composables/use-locale'
import { useNumberField } from './composables/use-number-field'
import { usePublicEvents } from './composables/use-public-events'
import { useValidation } from './composables/use-validation'
import { resolveDefaultCountry } from './core/locale'
import type { TesPhoneElement } from './element'
import { TES_PHONE_DEFAULTS, type TesPhoneProps } from './props'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TesPhoneProps>(), TES_PHONE_DEFAULTS)

const host = useHost() as TesPhoneElement
const { state, internals } = host
const combobox = useTemplateRef<HTMLInputElement>('combobox')
const numberInput = useTemplateRef<HTMLInputElement>('number')
const popup = useTemplateRef<HTMLElement>('popup')

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-phone] The `label` attribute is required for an accessible name.')
}

const locale = useLocale(host)
const countryList = useCountryList(props, locale)

state.defaultCountry = resolveDefaultCountry({
  defaultCountry: props.defaultCountry,
  navigatorLanguage: navigator.language,
  onlyCountries: countryList.allowedCodes.value,
  preferredCountries: countryList.preferredCodes.value,
})
if (!state.country) state.country = state.defaultCountry

const announcer = useAnnouncer()
const { announcement } = announcer
const dispatchPublicEvent = usePublicEvents(host, state)

const {
  isOpen,
  hasOptions,
  sections,
  comboboxText,
  highlightedCode,
  highlightedOptionId,
  optionId,
  selectCountry,
  closeAndRestoreSelection,
  selectTextSoTypingReplacesIt,
  focusWithoutPlacingCaret,
  openFromPointer,
  handleKeydown: handleComboboxKeydown,
  filterByTypedText,
  toggleFromChevron,
} = useCountryCombobox({
  props,
  state,
  host,
  locale,
  countryList,
  announcer,
  combobox,
  popup,
  onCountryPicked: () => {
    state.dirty = true
    dispatchPublicEvent('input')
    dispatchPublicEvent('change')
  },
})

const { excludedCountry, updateFromUserInput, rememberTextBeforeEditing, commitEditing, submitOnEnter } =
  useNumberField({
    props,
    state,
    locale,
    isAllowed: countryList.isAllowed,
    announcer,
    dispatchPublicEvent,
    submitOwnerForm: useImplicitSubmission(internals),
  })

const { visibleError, numberDescribedBy } = useValidation({
  props,
  host,
  locale,
  excludedCountry,
  combobox,
  numberInput,
})

useCustomStates(internals, () => ({
  invalid: visibleError.value !== null,
  open: isOpen.value,
  empty: state.nationalInput.trim() === '',
}))
</script>

<style src="./tes-phone.css"></style>

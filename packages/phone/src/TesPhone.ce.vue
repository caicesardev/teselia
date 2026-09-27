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
          :aria-expanded="isOpen ? 'true' : 'false'"
          aria-controls="countries"
          aria-autocomplete="list"
          :aria-activedescendant="highlightedOptionId"
          :disabled="state.disabledByForm"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          part="country"
          @focus="selectTextSoTypingReplacesIt"
          @keydown="handleComboboxKeydown"
          @input="filterByTypedText"
          @blur="closeAndRestoreSelection"
        />
        <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>

      <input
        id="number"
        ref="number"
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

    <ul id="countries" ref="listbox" role="listbox" popover="manual" :aria-label="textCountry" part="listbox">
      <li
        v-for="country in visibleCountries"
        :id="optionId(country.code)"
        :key="country.code"
        role="option"
        :aria-selected="country.code === state.country ? 'true' : 'false'"
        :part="country.code === state.country ? 'option option-selected' : 'option'"
        :class="{ highlighted: country.code === highlightedCode }"
      >
        <span class="option-name">{{ country.name }}</span> <span class="option-code">+{{ country.callingCode }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useHost, useTemplateRef, watch } from 'vue'
import { type Country, type CountryCode, listCountries } from './countries'
import type { TesPhoneElement } from './element'
import { filterCountries } from './filter'
import { type Direction, nextHighlight } from './highlight'
import { resolveDefaultCountry, resolveLocale } from './locale'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    defaultCountry?: string
    textCountry?: string
  }>(),
  {
    textCountry: 'Country code',
  },
)

const host = useHost() as TesPhoneElement
const { state, internals } = host
const numberInput = useTemplateRef<HTMLInputElement>('number')
const listbox = useTemplateRef<HTMLElement>('listbox')

if (import.meta.env.DEV && !props.label) {
  console.warn('[tes-phone] The `label` attribute is required for an accessible name.')
}

const langChanges = ref(0)
const langObserver = new MutationObserver(() => langChanges.value++)
onMounted(() => {
  for (const target of [host, document.documentElement]) {
    langObserver.observe(target, { attributes: true, attributeFilter: ['lang'] })
  }
})
onBeforeUnmount(() => langObserver.disconnect())

const locale = computed(() => {
  void langChanges.value
  return resolveLocale([
    host.closest('[lang]')?.getAttribute('lang'),
    document.documentElement.lang,
    navigator.language,
  ])
})
const countries = computed(() => listCountries(locale.value))

state.defaultCountry = resolveDefaultCountry({
  defaultCountry: props.defaultCountry,
  navigatorLanguage: navigator.language,
})
if (!state.country) state.country = state.defaultCountry

const query = ref<string | null>(null)
const isOpen = ref(false)
const highlightedCode = ref<CountryCode | null>(null)

const selectedCountry = computed(() =>
  countries.value.find((country) => country.code === state.country),
)
const visibleCountries = computed(() =>
  filterCountries(countries.value, query.value ?? '', locale.value),
)
const comboboxText = computed(() => query.value ?? displayOf(selectedCountry.value))
const highlightedOptionId = computed(() =>
  highlightedCode.value ? optionId(highlightedCode.value) : undefined,
)

function displayOf(country: Country | undefined): string {
  return country ? `${country.name} +${country.callingCode}` : ''
}

function optionId(code: CountryCode): string {
  return `option-${code}`
}

function selectTextSoTypingReplacesIt(event: FocusEvent): void {
  ;(event.target as HTMLInputElement).select()
}

function filterByTypedText(event: Event): void {
  query.value = (event.target as HTMLInputElement).value
  highlightedCode.value = null
  openIfThereAreOptions()
}

function handleComboboxKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (event.altKey) openIfThereAreOptions()
      else moveHighlight(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveHighlight(-1)
      break
    case 'Enter':
      if (isOpen.value) {
        event.preventDefault()
        selectHighlightedCountry()
      }
      break
    case 'Escape':
      if (isOpen.value) event.stopPropagation()
      closeAndRestoreSelection()
      break
  }
}

function openIfThereAreOptions(): void {
  isOpen.value = visibleCountries.value.length > 0
}

function moveHighlight(direction: Direction): void {
  const codes = visibleCountries.value.map((country) => country.code)

  if (!isOpen.value) {
    openIfThereAreOptions()
    const selected = state.country || null
    highlightedCode.value =
      selected && codes.includes(selected) ? selected : nextHighlight(codes, null, direction)
  } else {
    highlightedCode.value = nextHighlight(codes, highlightedCode.value, direction)
  }

  void nextTick(scrollHighlightedOptionIntoView)
}

function scrollHighlightedOptionIntoView(): void {
  if (!highlightedOptionId.value) return
  host.shadowRoot?.getElementById(highlightedOptionId.value)?.scrollIntoView({ block: 'nearest' })
}

function selectHighlightedCountry(): void {
  if (!highlightedCode.value) return
  state.country = highlightedCode.value
  closeAndRestoreSelection()
}

function closeAndRestoreSelection(): void {
  query.value = null
  highlightedCode.value = null
  isOpen.value = false
}

function updateFromUserInput(event: Event): void {
  state.value = (event.target as HTMLInputElement).value
  state.dirty = true
}

function syncFormState(): void {
  internals.setFormValue(state.value)

  if (props.required && state.value === '') {
    internals.setValidity({ valueMissing: true }, 'Enter a phone number', numberInput.value ?? undefined)
  } else {
    internals.setValidity({})
  }
}

function syncPopover(open: boolean): void {
  const popup = listbox.value
  if (!popup) return
  const isShown = popup.matches(':popover-open')
  if (open && !isShown) popup.showPopover()
  if (!open && isShown) popup.hidePopover()
}

watch([() => state.value, () => props.required], syncFormState)
watch(isOpen, syncPopover)
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
  max-inline-size: 100%;
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

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--_space);
}

.country {
  position: relative;
  flex: 1 1 8rem;
  max-inline-size: 12rem;
}

#number {
  flex: 999 1 10rem;
  min-inline-size: 0;
}

input {
  box-sizing: border-box;
  inline-size: 100%;
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

#country {
  anchor-name: --country;
  padding-inline-end: calc(var(--_space) * 4);
  text-overflow: ellipsis;
}

.chevron {
  position: absolute;
  inset-block: 0;
  inset-inline-end: calc(var(--_space) * 1.25);
  inline-size: 1rem;
  block-size: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

[popover] {
  position-anchor: --country;
  position-area: block-end span-inline-end;
  position-try-fallbacks: flip-block;
  inset: auto;
  box-sizing: border-box;
  min-inline-size: anchor-size(inline);
  max-block-size: var(--_popup-max-height);
  margin: 0;
  margin-block: calc(var(--_space) / 2);
  padding: calc(var(--_space) / 2);
  overflow: auto;
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_text);
  list-style: none;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
}

[role='option'] {
  display: flex;
  gap: var(--_space);
  justify-content: space-between;
  align-items: center;
  min-block-size: 2.5rem;
  padding-inline: var(--_space);
  border-radius: calc(var(--_radius) - 2px);
  cursor: default;
}

.option-code {
  color: var(--_muted);
  font-variant-numeric: tabular-nums;
}

[role='option'][aria-selected='true'] {
  background: var(--_accent);
  color: var(--_on-accent);
}

[role='option'][aria-selected='true'] .option-code {
  color: inherit;
}

[role='option'].highlighted {
  background: var(--_hover);
  box-shadow: inset 0 0 0 2px var(--_focus);
}

[role='option'][aria-selected='true'].highlighted {
  background: var(--_accent);
  box-shadow: inset 0 0 0 2px var(--_on-accent);
}
</style>

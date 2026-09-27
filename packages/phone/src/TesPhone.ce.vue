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
        @focus="rememberValueBeforeEditing"
        @input.stop="updateFromUserInput"
        @blur="commitNumberEditing"
      />
    </div>

    <p v-if="hint" id="hint" class="hint" part="hint">{{ hint }}</p>
    <p id="error" class="error" part="error" aria-live="polite">{{ visibleError?.message }}</p>

    <div id="popup" ref="popup" popover="manual" part="popup">
      <div
        id="countries"
        role="listbox"
        :aria-label="textCountry"
        :hidden="!hasOptions"
        part="listbox"
      >
        <div
          v-for="section in sections"
          :key="section.key"
          :role="section.label ? 'group' : 'none'"
          :aria-labelledby="section.label ? `group-${section.key}` : undefined"
          :class="{ group: section.label }"
        >
          <div
            v-if="section.label"
            :id="`group-${section.key}`"
            role="presentation"
            class="group-label"
            part="group-label"
          >
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useHost,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'
import { type Country, type CountryCode, listCountries, parseCountryCodes } from './countries'
import type { TesPhoneElement } from './element'
import { filterCountries } from './filter'
import { type Direction, nextHighlight } from './highlight'
import { resolveDefaultCountry, resolveLocale } from './locale'
import { interpretPhoneNumber } from './phone-number'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    hint?: string
    defaultCountry?: string
    autocomplete?: string
    preferredCountries?: string
    onlyCountries?: string
    textCountry?: string
    textSuggested?: string
    textResults?: string
    textNoResults?: string
    textRequired?: string
    textInvalid?: string
    textCountryRequired?: string
  }>(),
  {
    autocomplete: 'tel',
    textCountry: 'Country code',
    textSuggested: 'Suggested',
    textResults: 'Countries available: {count}',
    textNoResults: 'No countries found',
    textRequired: 'Enter a phone number',
    textInvalid: 'Enter a valid phone number for {country}',
    textCountryRequired: 'Select a country code',
  },
)

const ANNOUNCEMENT_DELAY_MS = 500

const host = useHost() as TesPhoneElement
const { state, internals } = host
const combobox = useTemplateRef<HTMLInputElement>('combobox')
const numberInput = useTemplateRef<HTMLInputElement>('number')
const popup = useTemplateRef<HTMLElement>('popup')

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
const onlyCountries = computed(() => parseCountryCodes(props.onlyCountries))
const preferredCountries = computed(() => parseCountryCodes(props.preferredCountries))

if (import.meta.env.DEV) {
  watchEffect(() => {
    for (const [attribute, parsed] of [
      ['only-countries', onlyCountries.value],
      ['preferred-countries', preferredCountries.value],
    ] as const) {
      if (parsed.invalid.length > 0) {
        console.warn(`[tes-phone] Ignoring unsupported codes in \`${attribute}\`: ${parsed.invalid.join(', ')}`)
      }
    }
  })
}

const countries = computed(() => {
  const all = listCountries(locale.value)
  const allowed = onlyCountries.value.codes
  return allowed.length === 0 ? all : all.filter((country) => allowed.includes(country.code))
})

state.defaultCountry = resolveDefaultCountry({
  defaultCountry: props.defaultCountry,
  navigatorLanguage: navigator.language,
  onlyCountries: onlyCountries.value.codes,
  preferredCountries: preferredCountries.value.codes,
})
if (!state.country) state.country = state.defaultCountry

const query = ref<string | null>(null)
const isOpen = ref(false)
const highlightedCode = ref<CountryCode | null>(null)

const selectedCountry = computed(() =>
  countries.value.find((country) => country.code === state.country),
)
interface ListboxSection {
  key: string
  label: string | null
  countries: Country[]
}

const suggestedCountries = computed(() =>
  preferredCountries.value.codes
    .map((code) => countries.value.find((country) => country.code === code))
    .filter((country): country is Country => country !== undefined),
)

const sections = computed<ListboxSection[]>(() => {
  const isBrowsingFullList = !query.value
  if (!isBrowsingFullList || suggestedCountries.value.length === 0) {
    return [
      { key: 'all', label: null, countries: filterCountries(countries.value, query.value ?? '', locale.value) },
    ]
  }

  const suggested = suggestedCountries.value
  return [
    { key: 'suggested', label: props.textSuggested, countries: suggested },
    { key: 'others', label: null, countries: countries.value.filter((country) => !suggested.includes(country)) },
  ]
})

const visibleCountries = computed(() => sections.value.flatMap((section) => section.countries))
const hasOptions = computed(() => visibleCountries.value.length > 0)
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
  openPopup()
}

function handleComboboxKeydown(event: KeyboardEvent): void {
  if (query.value === null && editsText(event)) startSearchFromEmptyText(event)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (event.altKey) openPopup()
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

function editsText(event: KeyboardEvent): boolean {
  const isPrintable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  return isPrintable || event.key === 'Backspace' || event.key === 'Delete'
}

function startSearchFromEmptyText(event: KeyboardEvent): void {
  const input = event.target as HTMLInputElement
  input.value = ''
  if (event.key === 'Backspace' || event.key === 'Delete') {
    event.preventDefault()
    query.value = ''
    highlightedCode.value = null
    openPopup()
  }
}

function openPopup(): void {
  isOpen.value = true
}

function moveHighlight(direction: Direction): void {
  const codes = visibleCountries.value.map((country) => country.code)

  if (!isOpen.value) {
    openPopup()
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
  if (highlightedCode.value) selectCountry(highlightedCode.value)
}

function selectCountry(code: CountryCode): void {
  const changed = code !== state.country
  state.country = code
  closeAndRestoreSelection()
  if (!changed) return
  state.dirty = true
  dispatchPublicEvent('input')
  dispatchPublicEvent('change')
}

function focusWithoutPlacingCaret(event: MouseEvent): void {
  const input = event.target as HTMLInputElement
  if (host.shadowRoot?.activeElement === input) return
  event.preventDefault()
  input.focus()
}

function openFromPointer(): void {
  if (!isOpen.value) moveHighlight(1)
}

function toggleFromChevron(): void {
  combobox.value?.focus()
  if (isOpen.value) closeAndRestoreSelection()
  else moveHighlight(1)
}

function closeAndRestoreSelection(): void {
  query.value = null
  highlightedCode.value = null
  isOpen.value = false
}

function updateFromUserInput(event: Event): void {
  state.nationalInput = (event.target as HTMLInputElement).value
  state.dirty = true
  state.numberTouched = true
  dispatchPublicEvent('input')
}

let valueBeforeEditing = ''

function rememberValueBeforeEditing(): void {
  valueBeforeEditing = state.nationalInput
}

function commitNumberEditing(): void {
  if (state.numberTouched) state.errorsVisible = true
  if (state.nationalInput !== valueBeforeEditing) dispatchPublicEvent('change')
}

type PublicEventName = 'input' | 'change' | 'countrychange'

function dispatchPublicEvent(name: PublicEventName): void {
  const { e164, valid } = interpretPhoneNumber(state.nationalInput, state.country)
  host.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail: { value: e164, country: state.country, valid },
    }),
  )
}

interface ValidationError {
  flag: 'valueMissing' | 'typeMismatch'
  message: string
  anchor: 'number' | 'country'
}

const phoneNumber = computed(() => interpretPhoneNumber(state.nationalInput, state.country))

const validationError = computed<ValidationError | null>(() => {
  if (state.nationalInput.trim() === '') {
    return props.required ? { flag: 'valueMissing', message: props.textRequired, anchor: 'number' } : null
  }
  if (phoneNumber.value.valid) return null
  if (!state.country && !phoneNumber.value.detectedCountry) {
    return { flag: 'valueMissing', message: props.textCountryRequired, anchor: 'country' }
  }
  return {
    flag: 'typeMismatch',
    message: props.textInvalid.replace('{country}', displayOf(selectedCountry.value)),
    anchor: 'number',
  }
})

const visibleError = computed(() => (state.errorsVisible ? validationError.value : null))

const numberDescribedBy = computed(() => {
  const ids = [props.hint ? 'hint' : '', visibleError.value?.anchor === 'number' ? 'error' : '']
  return ids.filter(Boolean).join(' ') || undefined
})

function syncFormState(): void {
  internals.setFormValue(phoneNumber.value.e164)

  const error = validationError.value
  if (!error) {
    internals.setValidity({})
    return
  }
  const anchor = error.anchor === 'country' ? combobox.value : numberInput.value
  internals.setValidity({ [error.flag]: true }, error.message, anchor ?? undefined)
}

function revealErrors(): void {
  state.errorsVisible = true
}

function syncPopover(open: boolean): void {
  const element = popup.value
  if (!element) return
  const isShown = element.matches(':popover-open')
  if (open && !isShown) element.showPopover()
  if (!open && isShown) element.hidePopover()
}

const announcement = ref('')
let pendingAnnouncement: ReturnType<typeof setTimeout> | undefined

function announceResultsOnceTypingPauses(currentQuery: string | null): void {
  clearTimeout(pendingAnnouncement)
  announcement.value = ''
  if (currentQuery === null) return

  pendingAnnouncement = setTimeout(() => {
    announcement.value = hasOptions.value
      ? props.textResults.replace('{count}', String(visibleCountries.value.length))
      : props.textNoResults
  }, ANNOUNCEMENT_DELAY_MS)
}

watchEffect(syncFormState, { flush: 'post' })
watch(
  () => state.country,
  () => dispatchPublicEvent('countrychange'),
  { flush: 'sync' },
)
watch(isOpen, syncPopover)
watch(query, announceResultsOnceTypingPauses)
onBeforeUnmount(() => clearTimeout(pendingAnnouncement))
onMounted(() => host.addEventListener('invalid', revealErrors))
onBeforeUnmount(() => host.removeEventListener('invalid', revealErrors))
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

input[aria-invalid='true'] {
  border-color: var(--_error);
  box-shadow: inset 0 0 0 1px var(--_error);
}

.hint,
.error {
  margin: 0;
  font-size: 0.875em;
}

.hint {
  color: var(--_muted);
}

.error {
  color: var(--_error);
  font-weight: 500;
}

#country {
  anchor-name: --country;
  padding-inline-end: calc(var(--_space) * 4);
  text-overflow: ellipsis;
}

.toggle {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  display: grid;
  place-items: center;
  inline-size: calc(var(--_space) * 4);
  cursor: pointer;
}

.chevron {
  inline-size: 1rem;
  block-size: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

[popover] {
  position-anchor: --country;
  position-area: block-end span-inline-end;
  position-try-fallbacks: flip-block;
  inset: auto;
  box-sizing: border-box;
  min-inline-size: anchor-size(inline);
  margin: 0;
  margin-block: calc(var(--_space) / 2);
  padding: calc(var(--_space) / 2);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_text);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
}

[role='listbox'] {
  max-block-size: var(--_popup-max-height);
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.group {
  margin-block-end: calc(var(--_space) / 2);
  padding-block-end: calc(var(--_space) / 2);
  border-block-end: 1px solid var(--_border);
}

.group-label {
  padding: calc(var(--_space) / 2) var(--_space);
  color: var(--_muted);
  font-size: 0.8125em;
  font-weight: 600;
}

.no-results {
  margin: 0;
  padding: var(--_space);
  color: var(--_muted);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

[role='option'] {
  display: flex;
  gap: var(--_space);
  justify-content: space-between;
  align-items: center;
  min-block-size: 2.5rem;
  padding-inline: var(--_space);
  border-radius: calc(var(--_radius) - 2px);
  cursor: pointer;
}

[role='option']:hover {
  background: var(--_hover);
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

import type { Announcer } from '@teselia/shared'
import { type ComputedRef, type Ref, computed, nextTick, ref, watch } from 'vue'
import { type Country, type CountryCode, countryLabel } from '../core/countries'
import { filterCountries } from '../core/filter'
import { type Direction, nextHighlight } from '../core/highlight'
import type { TesPhoneState } from '../element'
import type { ResolvedTesPhoneProps } from '../props'
import type { CountryList } from './use-country-list'

export interface ListboxSection {
  key: string
  label: string | null
  countries: Country[]
}

interface CountryComboboxOptions {
  props: ResolvedTesPhoneProps
  state: TesPhoneState
  host: HTMLElement
  locale: ComputedRef<string>
  countryList: CountryList
  announcer: Announcer
  combobox: Readonly<Ref<HTMLInputElement | null>>
  popup: Readonly<Ref<HTMLElement | null>>
  onCountryPicked: () => void
}

export function useCountryCombobox(options: CountryComboboxOptions) {
  const { props, state, host, locale, countryList, announcer, combobox, popup, onCountryPicked } = options
  const { countries, suggestedCountries } = countryList

  const query = ref<string | null>(null)
  const isOpen = ref(false)
  const highlightedCode = ref<CountryCode | null>(null)

  const selectedCountry = computed(() => countries.value.find((country) => country.code === state.country))

  const sections = computed<ListboxSection[]>(() => {
    const isBrowsingFullList = !query.value
    if (!isBrowsingFullList || suggestedCountries.value.length === 0) {
      return [{ key: 'all', label: null, countries: filterCountries(countries.value, query.value ?? '', locale.value) }]
    }

    const suggested = suggestedCountries.value
    return [
      { key: 'suggested', label: props.textSuggested, countries: suggested },
      { key: 'others', label: null, countries: countries.value.filter((country) => !suggested.includes(country)) },
    ]
  })

  const visibleCountries = computed(() => sections.value.flatMap((section) => section.countries))
  const hasOptions = computed(() => visibleCountries.value.length > 0)
  const comboboxText = computed(() => query.value ?? (selectedCountry.value ? countryLabel(selectedCountry.value) : ''))
  const highlightedOptionId = computed(() => (highlightedCode.value ? optionId(highlightedCode.value) : undefined))

  function optionId(code: CountryCode): string {
    return `option-${code}`
  }

  function openPopup(): void {
    isOpen.value = true
  }

  function closeAndRestoreSelection(): void {
    query.value = null
    highlightedCode.value = null
    isOpen.value = false
  }

  function selectCountry(code: CountryCode): void {
    const changed = code !== state.country
    state.country = code
    closeAndRestoreSelection()
    if (changed) onCountryPicked()
  }

  function moveHighlight(direction: Direction): void {
    const codes = visibleCountries.value.map((country) => country.code)

    if (!isOpen.value) {
      openPopup()
      const selected = state.country || null
      highlightedCode.value = selected && codes.includes(selected) ? selected : nextHighlight(codes, null, direction)
    } else {
      highlightedCode.value = nextHighlight(codes, highlightedCode.value, direction)
    }

    void nextTick(scrollHighlightedOptionIntoView)
  }

  function scrollHighlightedOptionIntoView(): void {
    if (!highlightedOptionId.value) return
    host.shadowRoot?.getElementById(highlightedOptionId.value)?.scrollIntoView({ block: 'nearest' })
  }

  function selectTextSoTypingReplacesIt(event: FocusEvent): void {
    ;(event.target as HTMLInputElement).select()
  }

  function filterByTypedText(event: Event): void {
    query.value = (event.target as HTMLInputElement).value
    highlightedCode.value = null
    openPopup()
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

  function handleKeydown(event: KeyboardEvent): void {
    if (props.readonly) return
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
          if (highlightedCode.value) selectCountry(highlightedCode.value)
        }
        break
      case 'Escape':
        if (isOpen.value) event.stopPropagation()
        closeAndRestoreSelection()
        break
    }
  }

  function focusWithoutPlacingCaret(event: MouseEvent): void {
    const input = event.target as HTMLInputElement
    if (host.shadowRoot?.activeElement === input) return
    event.preventDefault()
    input.focus()
  }

  function openFromPointer(): void {
    if (props.readonly || isOpen.value) return
    moveHighlight(1)
  }

  function toggleFromChevron(): void {
    if (props.readonly) return
    combobox.value?.focus()
    if (isOpen.value) closeAndRestoreSelection()
    else moveHighlight(1)
  }

  function syncPopover(open: boolean): void {
    const element = popup.value
    if (!element) return
    const isShown = element.matches(':popover-open')
    if (open && !isShown) element.showPopover()
    if (!open && isShown) element.hidePopover()
  }

  function announceResults(currentQuery: string | null): void {
    if (currentQuery === null) {
      announcer.clear()
      return
    }
    announcer.announceOnceTypingPauses(() =>
      hasOptions.value
        ? props.textResults.replace('{count}', String(visibleCountries.value.length))
        : props.textNoResults,
    )
  }

  watch(isOpen, syncPopover)
  watch(query, announceResults)

  return {
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
    handleKeydown,
    filterByTypedText,
    toggleFromChevron,
  }
}

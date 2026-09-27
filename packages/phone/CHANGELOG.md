# @teselia/phone

## 1.0.0

### Major Changes

- 9f7bb56: First stable release of `<tes-phone>`, an accessible international phone input with country calling code.
  
  - Searchable country combobox (WAI-ARIA editable combobox with a listbox popup): filter by country name, ISO code or calling code, with a "Suggested" group from `preferred-countries` and an allow list from `only-countries`.
  - Formats the number as you type while keeping the caret in place, and detects the country of pasted or autofilled international numbers.
  - Form-associated custom element: submits E.164, supports `required`, validation messages, `form.reset()`, disabled fieldsets, `readonly`, form state restore, and `Enter` to submit from the number field.
  - Bubbling `input`, `change` and `countrychange` events with `detail: { value, country, valid }`. Works with Vue `v-model`.
  - Localized country names through `Intl.DisplayNames`, and every text replaceable through `text-*` attributes.
  - Theming with `--tes-*` custom properties (light and dark defaults that meet WCAG 2.2 AA contrast), `::part()` and `:state(invalid | open | empty)`.
  - Supports Windows high contrast mode and right-to-left layouts. Tested by hand with the keyboard, NVDA (Firefox and Chromium) and high contrast mode.

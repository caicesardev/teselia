# @teselia/phone

## 1.0.3

### Patch Changes

- 8cf389c: Fix missing colors in the published builds. The build lowered `light-dark()` to variables that only exist under a `color-scheme` declaration, so every default color was invalid: fields had no border or background, and the accent and error colors were lost. The npm and CDN builds now keep `light-dark()`, which every supported browser understands. The docs site was not affected, because it uses the source code.

## 1.0.2

### Patch Changes

- 43bb79f: Clicking the chevron of a disabled field no longer opens the country list.
- 43bb79f: A disabled field now looks disabled, whether through the `disabled` attribute or a disabled `<fieldset>`: both controls use the muted text color, a muted fill and a `not-allowed` cursor, and the chevron turns muted. In Windows high contrast mode they use the system `GrayText` color. Before, a disabled field looked exactly like an enabled one.

## 1.0.1

### Patch Changes

- 43895bb: Listeners of `input`, `change` and `countrychange` now see the new form value and validity. Before, `new FormData(form)` and `checkValidity()` inside a listener returned the state from before the change, for example one digit behind while typing.

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

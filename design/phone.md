# `@teselia/phone` — design document

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-09-26 |
| **Target release** | `1.0.0` on **2026-10-24** |
| **Custom element** | `<tes-phone>` |

An accessible international phone input: a country calling code selector plus a national number field, shipped as a form-associated custom element. It submits a single normalized value (E.164) to any native `<form>`.

This document records the decisions taken before writing code, the options that were considered and why they were discarded. If a decision changes during implementation, update this file in the same pull request.

---

## 1. Goals and non-goals

### Goals

- **WCAG 2.2 AA by default.** No configuration is needed to be accessible.
- **Keyboard-first.** Every interaction works with the keyboard alone, and focus never gets lost or trapped.
- **Framework-agnostic.** It works in plain HTML (via CDN), Vue, React, Angular, Svelte, or server-rendered pages.
- **Native form citizen.** It takes part in `<form>` submission, reset, validation and `disabled` fieldsets like a built-in input.
- **Small and honest about size.** Bundle size is measured and published, not guessed.

### Non-goals (for the whole component, not only v1)

- Phone number verification (SMS/OTP) or any network request.
- Guessing the user's country from their IP address.

---

## 2. Decisions

### D1. Tag name: `<tes-phone>`

- `tes-` is the prefix for the whole suite: short, brand-related, and it contains the mandatory hyphen.
- The package auto-registers `<tes-phone>` when imported (only if the name is not already taken).
- It also exports a `define(tagName = 'tes-phone')` function for consumers who need a different tag name to avoid collisions.

**Discarded:** `<teselia-phone>` (too long across a suite) and manual-only registration (worse developer experience for CDN users).

### D2. Validation and formatting: `libphonenumber-js` with `min` metadata

- `libphonenumber-js` (MIT) is used as a regular **dependency**. It is bundled into the IIFE build and externalized in the ESM build.
- The `min` metadata set is used. According to the library docs, `min` validation is less strict than `max`: it checks length and leading digits rather than every numbering range. That is an acceptable trade-off for a form input. **Verify this during implementation** and document the exact behaviour on the docs page.
- It provides country data (`getCountries()`, calling codes), parsing, validation and as-you-type formatting from a single source, so there is no hand-maintained dataset.

**Discarded:**

- **Own lightweight logic.** It would validate weakly, and it would leave us maintaining data for ~240 regions.
- **Optional peer dependency.** It creates two code paths to test, which is too much for v1.

### D3. Country data and names: `libphonenumber-js` + `Intl.DisplayNames`

- The list of regions and their calling codes comes from `libphonenumber-js` metadata.
- Country names come from `Intl.DisplayNames(locale, { type: 'region' })`. The browser ships the translations, so there are **0 KB of translation files**.
- The locale is resolved from the `lang` attribute on the host, then from the closest ancestor with `lang`, then from `document.documentElement.lang`, then from `navigator.language`.
- Sorting uses `Intl.Collator(locale)`. Filtering is case- and diacritic-insensitive (`normalize('NFD')`).
- If `Intl.DisplayNames` returns nothing for a code (possible for non-standard codes such as `XK` or `AC`), the region code itself is displayed.
- **UI strings** (labels, errors, announcements) ship in **English** and can be overridden with `text-*` attributes (see §4.1). Only country names are localized automatically.

### D4. Flags: none in v1

- Flags are decorative. They add no accessibility value, and the country name plus the calling code already identify the country.
- Emoji flags don't render on Windows (you get letter pairs like "ES"), so emoji are not acceptable.
- An original SVG set for ~240 regions is significant work and weight. It would delay v1.
- **Forward compatibility:** the `flag` part name is reserved, so flags can be added in `1.x` as an opt-in, lazy-loaded import without breaking changes.

### D5. Country selector pattern: editable combobox with listbox popup

This follows the WAI-ARIA APG *Combobox with Listbox Popup* pattern, using list autocomplete (`aria-autocomplete="list"`).

- The user types to filter by **country name**, **ISO code** (`es`, `gb`) or **calling code** (`34`, `+34`).
- The input and the listbox live in the **same shadow root**, so `aria-controls` and `aria-activedescendant` resolve correctly.
- All options are rendered (about 240), with no virtualization. That is cheap enough, and it keeps `aria-setsize`/position information correct.
- **Preferred countries** (`preferred-countries`) are shown first, in a `role="group"` labelled "Suggested". They are **not duplicated** in the full list below, because duplicates confuse screen reader counts.

**Keyboard (country combobox):**

| Key | Popup closed | Popup open |
| --- | --- | --- |
| Typing | Opens the popup and filters | Filters |
| `↓` | Opens the popup and highlights the selected option (or the first) | Moves the highlight down |
| `↑` | Opens the popup and highlights the selected option (or the last) | Moves the highlight up |
| `Alt` + `↓` | Opens the popup without moving the highlight | — |
| `Enter` | — | Selects the highlighted option, closes the popup and keeps focus in the combobox |
| `Escape` | Restores the text of the current selection | Closes the popup and restores the text of the current selection |
| `Home` / `End` | Moves the caret in the text | Moves the caret in the text |
| `Tab` | Moves focus to the number field | Closes the popup **without** changing the selection, then moves focus |

- A mouse or touch click on an option selects it.
- Clicking outside the component closes the popup without changing the selection.

**Discarded:**

- **Select-only combobox.** Browsing ~240 options with first-letter type-ahead is tedious.
- **Styled native `<select>`.** It is the most robust option, but styling is limited and the customizable select is not supported everywhere.

### D6. Form value: E.164

- The value submitted with the form is **E.164**, for example `+34612345678`. When the field is empty or the number cannot be parsed, the value is an empty string.
- The national formatted number, country and validity are exposed as read-only properties and in event details. The backend doesn't need them, because E.164 is unambiguous.

**Discarded:** submitting a second `country` entry (redundant) and submitting raw user input (it pushes parsing to every backend).

### D7. Default country

The default country is resolved in this order, stopping at the first match:

1. The `default-country` attribute.
2. The region of `navigator.language`: its explicit region if present, otherwise the region from `Intl.Locale(...).maximize()` (`es` → `ES`, `en` → `US`).
3. No country selected. The user picks one, or types or pastes a number starting with `+` or `00`.

If `only-countries` is set and the resolved country is not in it, the first preferred country is used, or none if there are no preferred countries.

No IP geolocation and no network requests (see non-goals).

### D8. v1 scope, definition of done and target date

See §3 and §6.

---

## 3. v1 scope

### In

- **Country combobox** (D5), filterable by name, ISO code and calling code.
- **National number field**: `type="tel"`, `inputmode="tel"`, `autocomplete="tel"` by default.
- **Validation** with visible, programmatically associated error messages (§5.3).
- **Form association** through `ElementInternals`: value, validity, reset, state restore and `disabled` fieldsets.
- **Paste and autofill detection.** A value starting with `+` or `00` is parsed, the matching country is selected and the national part stays in the field. Browser autofill with `autocomplete="tel"` goes through the same path.
- **Default country from the browser locale** (D7).
- **`preferred-countries` and `only-countries`.**
- **Format as you type** with `AsYouType`, preserving the caret position. ⚠️ **Cut line:** if it is not solid, including caret handling and screen reader behaviour, by **2026-10-18**, it moves to `1.1` and v1 ships without it.
- **Theming** through CSS custom properties, `::part()` and custom states (§4.4–4.6).
- **Support for `forced-colors`, `prefers-reduced-motion` and basic RTL.** Layout uses logical properties, and the number input is always `dir="ltr"`.

### Out (explicitly)

- Flags (D4; reserved for `1.x`).
- Number type detection or restriction (mobile vs landline) and example-number placeholders. Both need the larger metadata sets.
- Extensions (`ext. 123`).
- Choosing the metadata set (`min` / `max` / `mobile`).
- External `<label for>` / `aria-describedby` pointing at the host being mirrored into the shadow root (see §5.4). Use the `label` and `hint` attributes instead.
- Built-in dark theme. The tokens make it possible; a preset may come later.
- Server-side rendering / Declarative Shadow DOM.
- Framework wrappers (React, Vue SFC export, and so on).
- Custom country datasets or custom names per country.
- Virtualized option list.

---

## 4. Public API

### 4.1 Attributes and properties

Attributes use kebab-case and map to camelCase properties.

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | — | Form field name. |
| `value` | `defaultValue` | `string` | `''` | **Initial** E.164 value, like `<input value>`. Restored by `form.reset()`. Changing the attribute updates the live value only until the value has been edited. |
| — | `value` | `string` | `''` | **Live** E.164 value. Setting it selects the country and fills the national number, marks the value as edited and does not touch the attribute. |
| `label` | `label` | `string` | — | Visible label of the field. **Required**: a console warning is logged if it is missing. |
| `hint` | `hint` | `string` | — | Help text below the field, linked via `aria-describedby`. |
| `default-country` | `defaultCountry` | ISO 3166-1 alpha-2 | resolved (D7) | Initial country. |
| `preferred-countries` | `preferredCountries` | comma-separated ISO codes | — | Countries shown first, in the "Suggested" group. |
| `only-countries` | `onlyCountries` | comma-separated ISO codes | — | Restricts the list to these countries. |
| `required` | `required` | `boolean` | `false` | The value must not be empty. |
| `disabled` | `disabled` | `boolean` | `false` | Also inherited from a disabled `<fieldset>`. |
| `readonly` | `readOnly` | `boolean` | `false` | The value is not editable but is still submitted. |
| `autocomplete` | `autocomplete` | `string` | `'tel'` | Forwarded to the number input. |
| `lang` | — | BCP 47 | inherited | Locale for country names (D3). |
| `text-country` | `textCountry` | `string` | `'Country code'` | Accessible name of the country combobox. |
| `text-suggested` | `textSuggested` | `string` | `'Suggested'` | Label of the preferred countries group. |
| `text-required` | `textRequired` | `string` | `'Enter a phone number'` | Error when the field is required and empty. |
| `text-invalid` | `textInvalid` | `string` | `'Enter a valid phone number for {country}'` | Error when the number is invalid. |
| `text-not-allowed` | `textNotAllowed` | `string` | `'Numbers from {country} are not accepted'` | Error when a pasted number belongs to a country excluded by `only-countries`. |
| `text-no-results` | `textNoResults` | `string` | `'No countries found'` | Shown when the filter matches nothing. |
| `text-results` | `textResults` | `string` | `'{count} countries available'` | Live region announcement while filtering. |
| `text-country-changed` | `textCountryChanged` | `string` | `'Country set to {country}'` | Announced when paste or autofill changes the country. |

Supported placeholders: `{country}` (localized name plus calling code) and `{count}`.

**Read-only properties:** `country` (ISO code or `''`), `callingCode` (for example `'34'`), `nationalNumber` (formatted), `valid`, `form`, `validity`, `validationMessage`, `willValidate`.

**Methods:** `checkValidity()`, `reportValidity()`, `focus()` (focuses the number field; `delegatesFocus` is enabled).

### 4.2 Events

All events bubble and are composed. `detail` is `{ value, country, valid }`.

| Event | When |
| --- | --- |
| `input` | On every change of the number or the country. |
| `change` | When a change is committed: the number field loses focus, or a country is selected. |
| `countrychange` | When the country changes, from the user, paste/autofill or a `value` update. |

> **Implementation notes:**
>
> - The native `input` event from the inner `<input>` is `composed`, so it crosses the shadow boundary on its own. Stop the inner events and re-dispatch our own, so consumers never receive duplicated `input` events.
> - **Do not use Vue's `emit()` for public events.** In a custom element, Vue dispatches emitted events as a `CustomEvent` that does not bubble, is not composed, and has `detail` set to the **array** of emit arguments (verified in `@vue/runtime-dom` 3.5.43). Events are therefore dispatched directly from the host (`useHost()`) with `new CustomEvent(name, { bubbles: true, composed: true, detail })`.

### 4.3 Form integration

- `static formAssociated = true`. The component uses `attachInternals()`, and `setFormValue()` is called with E.164.
- Validity is set with `setValidity(flags, message, anchor)`:
  - `{ valueMissing: true }` → `text-required`
  - `{ typeMismatch: true }` → `text-invalid`, or `text-not-allowed` for an excluded country
  - The anchor is the number input, so `reportValidity()` focuses it.
- `formResetCallback` restores `defaultValue` (the `value` attribute) and the default country, and clears the "edited" flag.
- `formDisabledCallback` covers disabled fieldsets.
- `formStateRestoreCallback` handles back/forward cache and autofill restore.

> ✅ **Spike validated (2026-09-27).** Vue's `defineCustomElement` does not expose `formAssociated` as an option. The generated class is extended instead:
>
> - It sets `static formAssociated = true` and calls `attachInternals()` in the constructor.
> - The component reaches the host with `useHost()`.
> - The form lifecycle callbacks (`formResetCallback`, `formDisabledCallback`) update a reactive `state` object owned by the element, which the component reads (see §7.4).
>
> `shadowRootOptions: { delegatesFocus: true }` is supported natively by Vue 3.5. Browser tests pass in Chromium, Firefox and WebKit for form value, `valueMissing`, reset, disabled fieldset, focus delegation, accessible name and axe. See `packages/phone/src/element.ts`.

### 4.4 CSS custom properties

Tokens use the suite-wide `--tes-` prefix, so one set of variables themes every Teselia component. That is a naming convention only; there is no shared package (see the "no `packages/core`" rule).

| Property | Purpose |
| --- | --- |
| `--tes-font-family` | Font family (inherits by default). |
| `--tes-font-size` | Base font size. |
| `--tes-color-text` | Text color. |
| `--tes-color-muted` | Hint and secondary text. |
| `--tes-color-bg` | Field and popup background. |
| `--tes-color-border` | Field border. |
| `--tes-color-accent` | Highlighted option and accents. |
| `--tes-color-focus` | Focus indicator. |
| `--tes-color-error` | Error border and message. |
| `--tes-radius` | Corner radius. |
| `--tes-space` | Base spacing unit. |
| `--tes-popup-max-height` | Maximum height of the listbox. |

Default values must meet the contrast requirements in §5.1.

### 4.5 Parts

`label`, `group`, `country`, `listbox`, `option`, `option-selected` (added alongside `option`), `number`, `hint`, `error`. The `flag` part is **reserved** for 1.x.

### 4.6 Custom states

These are exposed through `ElementInternals.states`: `:state(invalid)`, `:state(open)`, `:state(empty)`.

For example: `tes-phone:state(invalid)::part(number) { … }`.

### 4.7 Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari. The requirements are `ElementInternals`, `CustomStateSet` and `Intl.DisplayNames`.

---

## 5. Accessibility specification

### 5.1 WCAG 2.2 AA criteria that shape the design

| Criterion | How it applies |
| --- | --- |
| 1.3.1 Info and Relationships | A group (`role="group"`) labelled by the visible label contains both controls. The hint and error are linked with `aria-describedby`. |
| 1.3.5 Identify Input Purpose | `autocomplete="tel"` is on the number input by default. |
| 1.4.3 / 1.4.11 Contrast | Text ≥ 4.5:1, borders and focus indicator ≥ 3:1 against adjacent colors, in the default theme. |
| 1.4.10 Reflow | Usable at 320 CSS px wide with no horizontal scroll. |
| 1.4.12 Text Spacing | No clipping when text spacing is overridden. |
| 2.1.1 / 2.1.2 Keyboard, No Trap | See the keyboard table in D5. |
| 2.4.7 Focus Visible | A visible focus indicator on both controls and on the highlighted option, including in `forced-colors`. |
| 2.4.11 Focus Not Obscured (Minimum) | The popup never covers the focused control. |
| 2.5.8 Target Size (Minimum) | Options and controls are at least 24 × 24 CSS px. |
| 3.2.2 On Input | Selecting a country or pasting a number never submits the form or moves focus unexpectedly. |
| 3.3.1 / 3.3.3 Error Identification, Suggestion | The error text names the problem and the expected country. |
| 3.3.2 Labels or Instructions | A visible label (`label` attribute) plus an optional `hint`. |
| 4.1.2 Name, Role, Value | Native `<input>` elements inside, with APG combobox roles and states. |
| 4.1.3 Status Messages | Filter results and automatic country changes are announced through a polite live region. |

### 5.2 Live region announcements

- There is one visually hidden `aria-live="polite"` region inside the shadow root.
- **While filtering:** `text-results` (for example "12 countries available"), debounced at about 500 ms. `text-no-results` is announced when nothing matches.
- **Paste or autofill changes the country:** `text-country-changed` (for example "Country set to United Kingdom (+44)").
- **Format as you type:** no announcements. The screen reader already reads the input value, and extra announcements would be noise.

### 5.3 Error messaging

- Errors are **not** shown while the user is typing.
- They appear on **blur**, once the field has been interacted with, and on **submit** / `reportValidity()`.
- Once an error is shown, it updates live as the user fixes the input, and it clears as soon as the value is valid.
- An error sets `aria-invalid="true"` on the number input and shows the message in the `error` part, which is referenced from `aria-describedby`.
- Changing the country keeps the digits already typed and revalidates them.

### 5.4 Known Shadow DOM limitations (documented, not solved in v1)

- ARIA ID references cannot cross shadow boundaries. An external `<label for>` names the **host** (form-associated elements support this), but not the inner inputs that actually receive focus. **Use the `label` attribute.** This limitation is stated clearly on the docs page.
- External `aria-describedby` on the host has the same problem. **Use `hint`.**

### 5.5 Manual testing matrix

| Assistive technology | Browser | OS |
| --- | --- | --- |
| Keyboard only | Chrome, Firefox | Windows |
| NVDA | Firefox, Chrome | Windows |
| VoiceOver (touch) | Safari | iOS |
| Windows High Contrast (`forced-colors`) | Edge | Windows |
| 200 % and 400 % zoom, 320 px viewport | Chrome | any |

Keyboard behaviour in WebKit is covered by the automated browser tests (§6.1). VoiceOver on macOS is **not** tested manually for v1 because no Mac is available; this gap is stated on the docs page.

---

## 6. Definition of done and plan

### Definition of done for `1.0.0`

- [ ] Everything in §3 "In" is implemented, or has been explicitly moved to 1.1 at the cut line.
- [ ] Unit tests cover parsing, validation, default country resolution and filtering.
- [ ] Browser tests cover keyboard interaction, ARIA states, form submission/reset/validity and events, in Chromium, Firefox and WebKit.
- [ ] axe-core reports zero violations in every rendered state tested (closed, open, filtered, invalid, disabled).
- [ ] The manual testing matrix (§5.5) is completed, and results are recorded in the docs page.
- [ ] Bundle size (ESM excluding Vue, and IIFE including Vue; minified and gzip) is measured and published in the README and docs.
- [ ] The docs page (`teselia.caicesardev.com/phone`) has usage examples (HTML/CDN, Vue, React), API tables, a keyboard table, accessibility notes and known limitations.
- [ ] `@teselia/phone@1.0.0` is published to npm (only after explicit approval).

### 6.1 Testing strategy

| Layer | Tool | Runs in | Covers |
| --- | --- | --- | --- |
| Unit | Vitest | Node | Pure logic: parsing, E.164 conversion, default country resolution, filtering and sorting. Fast feedback. |
| Component | Vitest browser mode, Playwright provider | Real Chromium, Firefox and WebKit | Shadow DOM, `ElementInternals`, focus, real keyboard events (`userEvent`), `<form>` integration, events. |
| Accessibility | `axe-core` called directly inside browser tests | Same as above | Automated WCAG checks on each rendered state. axe traverses shadow roots. |
| Manual | People and assistive technology | See §5.5 | What automation cannot judge: announcements, reading order, usability. |

Why real browsers instead of jsdom/happy-dom: this component depends on exactly the APIs that DOM emulators implement partially or not at all (`ElementInternals`, custom states, focus delegation, `Intl`). A green test in an emulator would not prove much.

Deliberately **not** added: Testing Library (the `userEvent` in Vitest browser mode is enough), a wrapper like `vitest-axe` (a direct `axe.run()` call is a few lines), a separate Playwright end-to-end suite and Storybook (the VitePress docs are the demo).

### Milestones

| Week | Dates | Deliverable |
| --- | --- | --- |
| 1 | 2026-09-28 → 10-04 | Monorepo, package and docs scaffold. **Spikes:** form association with `defineCustomElement` (§4.3), and a first bundle size measurement. |
| 2 | 10-05 → 10-11 | Country combobox with full keyboard and ARIA, number field, validation, form integration. |
| 3 | 10-12 → 10-18 | Paste/autofill detection, default country, preferred/only countries, theming. Format as you type, with the **cut line on 10-18**. |
| 4 | 10-19 → 10-24 | Assistive technology testing, fixes, docs page, release **2026-10-24**. |

---

## 7. Open questions

1. **Collapsed combobox display.** What the country field shows when closed (`+34`, `ES +34` or `Spain (+34)`). The visible text *is* the accessible value, so no `aria-label` tricks. Decide this during the visual design, in week 2.
2. **Popup positioning.** The listbox must not be clipped by ancestors with `overflow: hidden`. Evaluate the Popover API (top layer) with CSS anchor positioning against plain absolute positioning, and check current browser support before choosing.
3. **Bundle size budget.** Set a hard budget once `libphonenumber-js` is in. Baseline on 2026-09-27, with the minimal element and no `libphonenumber-js` yet:
   - ESM (Vue external): 3.0 KB, 1.4 KB gzip
   - IIFE (Vue bundled): 65.7 KB, 25.5 KB gzip. This is mostly the Vue runtime.
4. ~~**`value` property semantics.**~~ ✅ Resolved in #5 by following native `<input>` semantics (see §4.1):
   - `value` is **not** a Vue prop, because Vue would define an instance accessor that shadows the class one. The element observes the `value` attribute itself (`observedAttributes` + `attributeChangedCallback`), which does not conflict with Vue: it tracks declared props with a `MutationObserver`.
   - The live value lives in a reactive `state` object owned by the element and read by the Vue component, so it works even when set before the element is connected.
   - A dirty flag mirrors the native "dirty value flag": user input or setting `value` marks it; `form.reset()` clears it.
   - The component uses `inheritAttrs: false`. Otherwise host attributes that are not props (`name`, `value`) fall through to the root element inside the shadow root.
   - Until #16, the value is the raw text. #16 normalizes it to E.164.

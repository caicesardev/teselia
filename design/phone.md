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
- The `min` metadata set is used. ✅ **Verified in #8** (`libphonenumber-js` 1.13.14), comparing `isValidPhoneNumber` from `min` and `max`:
  - Both reject unassigned leading digits, e.g. `+34 1…` in Spain and area code `111` in the US, and both reject numbers that are too short.
  - `min` does **not** know the exact length of each number type. It accepted `+49 1512345678` (a German mobile one digit short), which `max` rejects.
  - So `min` catches typos in the prefix and in the overall length, but can accept a number with the wrong length for its specific range. That is an acceptable trade-off for a form input. Document it on the docs page.
- It provides country data (`getCountries()`, calling codes), parsing, validation and as-you-type formatting from a single source, so there is no hand-maintained dataset.

**Discarded:**

- **Own lightweight logic.** It would validate weakly, and it would leave us maintaining data for ~240 regions.
- **Optional peer dependency.** It creates two code paths to test, which is too much for v1.

### D3. Country data and names: `libphonenumber-js` + `Intl.DisplayNames`

- The list of regions and their calling codes comes from `libphonenumber-js` metadata.
- Country names come from `Intl.DisplayNames(locale, { type: 'region' })`. The browser ships the translations, so there are **0 KB of translation files**.
- The locale is resolved from the `lang` attribute on the host, then from the closest ancestor with `lang`, then from `document.documentElement.lang`, then from `navigator.language`, and finally `en`. Empty (`lang=""`, which means "unknown") and malformed tags are skipped. The chosen tag is canonicalized (`EN-gb` → `en-GB`). Implemented in `resolveLocale` (#9).
- The locale is **reactive** (#11). A `MutationObserver` re-resolves it when `lang` changes on the element or on `<html>`, so SPAs that switch language, or that set `lang` after the component mounts (VitePress does this in dev), get updated country names.
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

- The user types to filter by **country name**, **ISO code** (`es`, `gb`) or **calling code** (`34`, `+34`). Implemented in `filterCountries` (#10):
  - Name matching ignores case and diacritics (`espana` finds España).
  - Digits, with or without `+`, match calling codes **by prefix**, so the list narrows as the user types (`3` → +30…+39, `34` → Spain).
  - Name results are **ranked**: exact ISO code first, then names starting with the query, then names with a word starting with it, then names containing it. Within a rank, the alphabetical order is kept (`ir` → Iran, Iraq, Ireland before Kiribati).
- The input and the listbox live in the **same shadow root**, so `aria-controls` and `aria-activedescendant` resolve correctly.
- Both controls sit in a `role="group"` labelled by the visible field label: "Phone number, group" → "Country code, combobox, Spain +34" → "Phone number, edit" (#11).
- On focus, the combobox **selects its text**, so typing replaces "Spain +34" with the search query instead of appending to it (#11).
- The two controls share one row and wrap onto two lines when there is no room (`flex-wrap`), with no horizontal overflow down to a 288px container (320px viewport).
- All options are rendered (about 240), with no virtualization. That is cheap enough, and it keeps `aria-setsize`/position information correct.
- **Preferred countries** (`preferred-countries`) are shown first, in a `role="group"` labelled "Suggested". They are **not duplicated** in the full list below, because duplicates confuse screen reader counts. Implemented in #15:
  - The group exists only while browsing the full list. While filtering, results are flat and ranked, and preferred countries appear at their natural rank.
  - Each listbox section is a `<div>`: the suggested one has `role="group"` plus a `role="presentation"` label, and the rest has `role="none"`, so its options belong directly to the listbox. This avoids duplicating the option markup.
  - `only-countries` restricts the list, the filter results, the suggested group and the default country (D7).
  - Codes are parsed case-insensitively from comma- or space-separated lists. Unsupported codes are ignored, with a console warning during development.

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

Keyboard implementation notes (#12):

- **`aria-selected` marks the chosen country; `aria-activedescendant` marks the highlighted option.** Screen readers announce the highlighted option as the highlight moves, and the current country as "selected". Some APG examples use `aria-selected` for the highlight instead. Validated with NVDA in #26: the highlight is read as "sin seleccionar" / "seleccionado", which tells the two apart. VoiceOver (#27) is still pending.
- **Arrow keys wrap around** at both ends. With about 245 options, and `Home`/`End` reserved for the caret, wrapping is the fastest way to reach the end of the list.
- Typing clears the highlight: list autocomplete without automatic selection.
- `Enter` and `Escape` call `preventDefault` while the listbox is open. `Escape` also stops propagation, so closing the listbox inside a dialog doesn't close the dialog.
- The highlighted option is scrolled into view (`block: 'nearest'`). It is shown with a hover background plus a 2px inset ring, in `on-accent` when it is also the selected country.

Pointer implementation notes (#13):

- **`delegatesFocus` is load-bearing.** Pressing a non-focusable part of the shadow tree (an option, the listbox padding, the chevron) keeps focus in the combobox, so `blur` never closes the listbox before the `click` lands. No `mousedown` `preventDefault` is needed. Removing `delegatesFocus` breaks pointer selection, and the browser tests catch it.
- Clicking the combobox opens the listbox with the current country highlighted and in view. The focusing press is intercepted (`mousedown` → `preventDefault` → `focus()`), so the text is selected in every engine and typing replaces it. WebKit otherwise places the caret where you clicked.
- The chevron toggles the listbox. It is `aria-hidden` and not focusable, because clicking the field and the keyboard already provide the same function.
- Hover on options is visual only. It does not move `aria-activedescendant`.

- A mouse or touch click on an option selects it.
- Clicking outside the component closes the popup without changing the selection.

**Discarded:**

- **Select-only combobox.** Browsing ~240 options with first-letter type-ahead is tedious.
- **Styled native `<select>`.** It is the most robust option, but styling is limited and the customizable select is not supported everywhere.

### D6. Form value: E.164

- The value submitted with the form is **E.164**, for example `+34612345678`. When the field is empty or the number cannot be parsed, the value is an empty string.
- Implemented in #16:
  - The element stores the text typed in the number field (`nationalInput`) and the selected country, and derives the E.164 value from both. Changing the country recomputes the value and keeps the digits.
  - **Parseable but not (yet) valid numbers are submitted as E.164** (`612` → `+34612`), because it is still an unambiguous rendering of what the user typed. Validity is a separate concern: `typeMismatch` (#17) blocks submission and the `valid` property reports it.
  - Spaces, punctuation and the `00` international prefix are accepted in the input (`612 34-56.78`, `0034…`).
  - Setting `value` or the `value` attribute to an E.164 number selects its country and fills the national digits. If the country cannot be determined (e.g. `+44207946`), the text is kept as typed.
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

### D9. Visual design

Decided in #7.

- **Collapsed country display: `Spain +34`** (localized country name + calling code).
  - The visible text *is* the accessible value of the combobox, so what sighted users see is exactly what screen readers announce ("Country code, combobox, Spain +34").
  - A calling code alone is ambiguous (`+1` is shared by the US, Canada and others; `+44` by the UK, Jersey, Guernsey and the Isle of Man), and there are no flags in v1 (D4).
  - ISO codes (`ES +34`) were discarded because screen readers pronounce them as words (`IT` → "it", `IN` → "in").
  - Long names are truncated with a visual ellipsis. The full name stays in the value, so assistive technology reads it completely.
- **Style: sober and native-looking**, so it blends into any site and is easy to theme:
  - 1px border
  - 6px radius
  - 44px control height
  - 2px focus outline with a 2px offset
  - inherited font
- **Theme follows the page's `color-scheme`.** Defaults use `light-dark()`, so the component looks right on light and dark pages without configuration. A page that doesn't opt into dark (`color-scheme: normal`) gets the light palette.

Default token values and contrast ratios: §4.4.

---

## 3. v1 scope

### In

- **Country combobox** (D5), filterable by name, ISO code and calling code.
- **National number field**: `type="tel"`, `inputmode="tel"`, `autocomplete="tel"` by default.
- **Validation** with visible, programmatically associated error messages (§5.3).
- **Form association** through `ElementInternals`: value, validity, reset, state restore and `disabled` fieldsets.
- **Paste and autofill detection.** A value starting with `+` or `00` is parsed, the matching country is selected and the national part stays in the field. Browser autofill with `autocomplete="tel"` goes through the same path.
  - Implemented in #19. Detection runs on every `input` event of the number field, so paste, typing and browser autofill share one path. A leading `00` is rewritten to `+` before parsing, because the real international prefix varies by country (`011` in the US).
  - The country switches only when the calling code identifies it unambiguously. The field is then reduced to the national digits, and `text-country-changed` is announced through the live region. If the number already belongs to the selected country, the prefix is stripped silently.
  - A number from a country excluded by `only-countries` keeps the current country and reports `typeMismatch` with `text-not-allowed`, using the #17 visibility rules.
- **Default country from the browser locale** (D7).
- **`preferred-countries` and `only-countries`.**
- **Format as you type** with `AsYouType`, preserving the caret position. ✅ Implemented in #20, well before the cut line:
  - `formatWhileTyping()` is a pure function: it counts the digits before the caret, formats, and places the caret after the same digit in the formatted text.
  - When `Backspace` or `Delete` only removes a separator, the digit before (or after) it is removed instead, so the caret never gets stuck on a space.
  - Text with letters or unexpected symbols is left as typed, and validation reports it.
  - With `min` metadata, `AsYouType` formats national numbers only as users actually write them, including the national prefix (`020 7946 0958` in the UK, `06 12 34 56 78` in France). So numbers set from E.164 or detected from a paste are shown in national format, with that prefix. The digits are reformatted when the country changes.
  - Reformatting never touches the live region. ⚠️ **Cut line:** if it is not solid, including caret handling and screen reader behaviour, by **2026-10-18**, it moves to `1.1` and v1 ships without it.
- **Theming** through CSS custom properties, `::part()` and custom states (§4.4–4.6).
- **Support for `forced-colors`, `prefers-reduced-motion` and basic RTL.** Layout uses logical properties, and the number input is always `dir="ltr"`. Implemented in #23:
  - Forced colors strips `box-shadow` and overrides backgrounds, which would hide the highlighted option (an inset ring) and the selected one (an accent background). A `forced-colors: active` block uses a `Highlight` outline for the highlight, `SelectedItem`/`SelectedItemText` for the selection, and a 2px border for the invalid state. Focus is an `outline`, which survives.
  - Reduced motion: the component has no transitions or animations at all, and a test keeps it that way.
  - RTL: in a `dir="rtl"` context the controls mirror (country on the right, chevron at its inline end), and the number stays left-to-right.
  - Tests emulate `forced-colors` and `prefers-reduced-motion` through a custom Vitest browser command (`emulateMedia`, Playwright `page.emulateMedia`), which works in all three engines.

### Out (explicitly)

- Flags (D4; reserved for `1.x`).
- Number type detection or restriction (mobile vs landline) and example-number placeholders. Both need the larger metadata sets.
- Extensions (`ext. 123`).
- Choosing the metadata set (`min` / `max` / `mobile`).
- External `<label for>` / `aria-describedby` pointing at the host being mirrored into the shadow root (see §5.4). Use the `label` and `hint` attributes instead.
- Theme presets beyond the light and dark defaults (D9). Tokens make any palette possible.
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
| `text-country-required` | `textCountryRequired` | `string` | `'Select a country code'` | Error when no country is selected and the number is not international (e.g. a misconfigured `only-countries`). Anchored to the combobox. |
| `text-not-allowed` | `textNotAllowed` | `string` | `'Numbers from {country} are not accepted'` | Error when a pasted number belongs to a country excluded by `only-countries`. |
| `text-no-results` | `textNoResults` | `string` | `'No countries found'` | Shown when the filter matches nothing. |
| `text-results` | `textResults` | `string` | `'Countries available: {count}'` | Live region announcement while filtering. The "label: number" form avoids plural rules ("1 countries") in every language. |
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
> - **Implemented in #18:**
  - Inner `input` events are stopped at their source (`@input.stop`) on both the number field and the country search, so consumers only receive our `CustomEvent`s.
  - `input` and `change` fire only for **user** changes, like native inputs. Setting `value` from code fires neither.
  - `change` fires when the number field loses focus with a different text than when it gained it, and when the user picks a *different* country. Re-selecting the current country fires nothing.
  - `countrychange` fires on every country change, including code and `form.reset()`. It is dispatched synchronously, so it precedes the `input`/`change` of a country pick. The element updates the digits before the country, so `detail.value` is already consistent when it fires.
- **Vue `v-model` works without extra code.** The Vue compiler treats a custom element like a native input (`vModelText`): it listens to `input` and reads and writes the `value` property. `test/browser/vue-v-model.test.ts` covers both directions (#24).
- **Do not use Vue's `emit()` for public events.** In a custom element, Vue dispatches emitted events as a `CustomEvent` that does not bubble, is not composed, and has `detail` set to the **array** of emit arguments (verified in `@vue/runtime-dom` 3.5.43). Events are therefore dispatched directly from the host (`useHost()`) with `new CustomEvent(name, { bubbles: true, composed: true, detail })`.

### 4.3 Form integration

- `static formAssociated = true`. The component uses `attachInternals()`, and `setFormValue()` is called with E.164.
- Validity is set with `setValidity(flags, message, anchor)`:
  - `{ valueMissing: true }` → `text-required`
  - `{ typeMismatch: true }` → `text-invalid`, or `text-not-allowed` for an excluded country
  - The anchor is the number input, so `reportValidity()` focuses it.
- `formResetCallback` restores `defaultValue` (the `value` attribute) and the default country, and clears the "edited" flag.
- `formDisabledCallback` covers disabled fieldsets.
- `formStateRestoreCallback` handles back/forward cache and autofill restore.
- Implemented in #21:
  - `setFormValue(e164, state)` saves the typed text and country as JSON (`src/core/form-state.ts`). In `restore` mode both come back exactly as they were. In `autocomplete` mode the browser provides a value, which is treated as E.164. Malformed state, or an unsupported country code, is ignored.
  - `readonly`: both controls get `readonly`. The combobox ignores keys, clicks and the chevron, and the value is still submitted. The HTML spec bars a form-associated element with `readonly` from constraint validation, so `willValidate` is `false`, exactly like a native readonly input. `readOnly` reflects to the attribute.
  - `disabled` (attribute, property or fieldset) goes through `formDisabledCallback` and disables both controls.
- **Implicit submission** (found in manual keyboard testing, #26). The inner `<input>` lives in the shadow root, which has no form, so the browser does not submit on `Enter`. `useImplicitSubmission` replicates the HTML algorithm for the number field:
  - It clicks the form's default button: the first submit button in `form.elements`, which includes buttons associated through the `form` attribute. Click handlers run, and a disabled button ignores `click()`, as in the spec.
  - Without a submit button, it calls `form.requestSubmit()` only when no other field blocks implicit submission (text-like `<input>` types).
  - `change` is committed first and not repeated on blur, matching native inputs.
  - `Enter` in the country combobox still only picks a country.

> ✅ **Spike validated (2026-09-27).** Vue's `defineCustomElement` does not expose `formAssociated` as an option. The generated class is extended instead:
>
> - It sets `static formAssociated = true` and calls `attachInternals()` in the constructor.
> - The component reaches the host with `useHost()`.
> - The form lifecycle callbacks (`formResetCallback`, `formDisabledCallback`) update a reactive `state` object owned by the element, which the component reads (see §7.4).
>
> `shadowRootOptions: { delegatesFocus: true }` is supported natively by Vue 3.5. Browser tests pass in Chromium, Firefox and WebKit for form value, `valueMissing`, reset, disabled fieldset, focus delegation, accessible name and axe. See `packages/phone/src/element.ts`.

### 4.4 CSS custom properties

Tokens use the suite-wide `--tes-` prefix, so one set of variables themes every Teselia component. That is a naming convention only; there is no shared package (see the "no `packages/core`" rule).

| Property | Purpose | Light default | Dark default |
| --- | --- | --- | --- |
| `--tes-font-family` | Font family | inherited | inherited |
| `--tes-font-size` | Base font size | inherited | inherited |
| `--tes-color-text` | Text color | `#1f2328` | `#e8eaee` |
| `--tes-color-muted` | Hint and secondary text | `#59636e` | `#a3adba` |
| `--tes-color-bg` | Field and popup background | `#ffffff` | `#16181d` |
| `--tes-color-border` | Field border | `#7d8590` | `#7f8a99` |
| `--tes-color-accent` | Selected option and accents | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-on-accent` | Text on the accent color | `#ffffff` | `#0d1117` |
| `--tes-color-hover` | Hovered / highlighted option background | `#eef3fb` | `#232a36` |
| `--tes-color-focus` | Focus indicator | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-error` | Error border and message | `#c4232b` | `#ff8a80` |
| `--tes-radius` | Corner radius | `0.375rem` | `0.375rem` |
| `--tes-space` | Base spacing unit | `0.5rem` | `0.5rem` |
| `--tes-popup-max-height` | Maximum height of the listbox | `18rem` | `18rem` |

- **How the defaults work.** The component reads each public token through a private variable with a fallback, for example `--_border: var(--tes-color-border, light-dark(#7d8590, #7f8a99))`. Because the host never sets `--tes-*` itself, consumers can define tokens on any ancestor (including `:root`) or on the element, and they always win.
- **Fonts.** The font tokens resolve to `inherit` when unset: an unset `var()` behaves as `unset`, and font properties inherit.

**Contrast of the defaults** (WCAG 2.2: text ≥ 4.5:1, non-text ≥ 3:1):

| Pair | Light | Dark | Minimum |
| --- | --- | --- | --- |
| text / bg | 15.80 | 14.74 | 4.5 |
| muted / bg | 6.11 | 7.82 | 4.5 |
| error / bg | 5.80 | 7.78 | 4.5 |
| on-accent / accent | 5.96 | 7.93 | 4.5 |
| text / hover | 14.18 | 11.98 | 4.5 |
| border / bg | 3.73 | 5.07 | 3 |
| focus / bg | 5.96 | 7.44 | 3 |
| accent / bg | 5.96 | 7.44 | 3 |

`test/browser/design-tokens.test.ts` resolves the real colors inside the shadow root in both schemes and asserts every pair in all three engines, so a future palette change cannot silently break contrast. The focus ring sits outside the field (2px offset), on the page background: the ratios assume a page background close to the token background.

### 4.5 Parts

`field` (the outer wrapper), `label`, `group`, `country`, `popup` (the popover container), `listbox`, `group-label` (the "Suggested" heading), `option`, `option-selected` (added alongside `option`), `no-results`, `number`, `hint`, `error`. The `flag` part is **reserved** for 1.x.

### 4.6 Custom states

These are exposed through `ElementInternals.states`: `:state(invalid)`, `:state(open)`, `:state(empty)`.

For example: `tes-phone:state(invalid)::part(number) { … }`.

Implemented in #22:

- `:state(invalid)` follows the **visible** error, not raw validity, like `:user-invalid` on native inputs. A required empty field is not styled as invalid on page load, only after blur-after-editing or submit (§5.3).
- `:state(open)` is set while the popover is open, including the "no results" state.
- `:state(empty)` is set while the number field is blank.
- If `ElementInternals.states` is missing, states are skipped silently. Everything else keeps working.
- `test/browser/theming.test.ts` proves that page styles reach inner elements through `::part()`, and that `:state()` combined with `::part()` works from outside.

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
- **While filtering:** `text-results` (for example "Countries available: 12"), once typing pauses for 500 ms, so only the final count is announced, not every keystroke. `text-no-results` is announced when nothing matches.
  - The region is a `role="status"` element, always rendered, visually hidden but in the accessibility tree.
  - It is emptied on every keystroke, so a new query with the same count is announced again. It is also emptied when the listbox closes.
  - Counts are not announced while navigating with the arrow keys; the screen reader already reads each highlighted option.
- **No results:** the popover stays open and shows `text-no-results` in the `no-results` part, next to the listbox. The listbox is `hidden` rather than rendered empty, and `aria-expanded` is `false` while there are no options (#14).
- **Scrolling** happens on the listbox itself, not on the popover container. A scrollable container without a role is flagged by axe (`scrollable-region-focusable`); the listbox is the keyboard-operable widget.
- **Paste or autofill changes the country:** `text-country-changed` (for example "Country set to United Kingdom (+44)").
  - The region is emptied, and the message is written 100 ms later. Emptying and refilling it in the same task is enough for Firefox, but Chromium batches accessibility updates per frame. A repeated message (paste a UK number, go back to Spain, paste again) then never reached NVDA in Brave. Found in manual NVDA testing (#26).
- **Format as you type:** no announcements. The screen reader already reads the input value, and extra announcements would be noise.

### 5.3 Error messaging

- Errors are **not** shown while the user is typing.
- They appear on **blur**, once the field has been interacted with, and on **submit** / `reportValidity()`.
- Once an error is shown, it updates live as the user fixes the input, and it clears as soon as the value is valid.
- An error sets `aria-invalid="true"` on the number input and shows the message in the `error` part, which is referenced from `aria-describedby`.
- Changing the country keeps the digits already typed and revalidates them.

Implementation notes (#17):

- **"Interacted"** means the user typed in the number field. Tabbing through an empty required field shows nothing until submit, so users are not scolded for fields they have not reached yet.
- **Submit, `reportValidity()` and `checkValidity()`** all fire `invalid` on the host, which reveals the inline error. The browser's native validation bubble is **kept**: it moves focus to the anchor, which is what users of native inputs expect. The inline message adds persistent context.
- The error element is always rendered with `aria-live="polite"`, so an error revealed on blur, after focus has moved on, is still announced. `aria-describedby` references it only while it has a message, and the hint comes first when there is one.
- **No country selected** (only possible with a misconfigured `only-countries` or a locale without a region) reports `valueMissing` with `text-country-required`, anchored to the combobox. "Enter a valid phone number for …" would make no sense there.
- In the invalid state, the border goes from 1px to 2px in the error color, so the state is not conveyed by color alone (WCAG 1.4.1). The message text is the primary cue.

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

Keyboard behaviour in WebKit is covered by the automated browser tests (§6.1). VoiceOver on macOS is **not** tested manually for v1 because no Mac is available. VoiceOver on iOS was deferred to after 1.0.0 (#27). Both gaps are stated on the docs page.

---

## 6. Definition of done and plan

### Definition of done for `1.0.0`

- [x] Everything in §3 "In" is implemented, or has been explicitly moved to 1.1 at the cut line. Format as you type made the cut (#20).
- [x] Unit tests cover parsing, validation, default country resolution and filtering.
- [x] Browser tests cover keyboard interaction, ARIA states, form submission/reset/validity and events, in Chromium, Firefox and WebKit.
- [x] axe-core reports zero violations in every rendered state tested (closed, open, filtered, highlighted, suggested group, no results, invalid, disabled, readonly).
- [x] The manual testing matrix (§5.5) is completed, and results are recorded in the docs page. **Exception:** VoiceOver on iOS (#27) was deferred by the maintainer after 1.0.0. The docs page states that VoiceOver is untested.
- [x] Bundle size (ESM excluding Vue, and IIFE including Vue; minified and gzip) is measured and published in the README and docs: 8.7 KB for the component code, 43 KB with `libphonenumber-js`, 67 KB for the IIFE with Vue (#56).
- [x] The docs page (`teselia.caicesardev.com/phone`) has usage examples (HTML/CDN, Vue, React), API tables, a keyboard table, accessibility notes and known limitations (#54, #55).
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

1. ~~**Collapsed combobox display.**~~ ✅ Resolved in #7: `Spain +34`. See D9.
2. ~~**Popup positioning.**~~ ✅ Resolved in #6: **Popover API + CSS anchor positioning, no JavaScript positioning.**
   - The listbox is a `popover="manual"` element. It renders in the top layer, so no ancestor `overflow: hidden` or `z-index` can clip or cover it. `manual` means no light dismiss and no focus move: the combobox controls opening and closing, and focus stays in the input.
   - Placement is pure CSS, inside the same shadow root as the input (anchor names are tree-scoped): `anchor-name` on the input; `position-anchor`, `position-area: block-end span-inline-end`, `position-try-fallbacks: flip-block` and `min-inline-size: anchor-size(inline)` on the listbox; `inset: auto; margin: 0` to override the UA popover centering.
   - Support verified on 2026-09-27 in Chromium 153, Firefox 155 and WebKit 26.6 (Playwright builds): Popover API, `:popover-open`, `anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks` and `anchor-size()` all supported. Previous major versions were not checked directly.
   - **No JavaScript fallback.** A browser without anchor positioning still shows the listbox in the top layer, unclipped, just not aligned to the input. That is an acceptable degradation, and not worth the code.
   - `test/browser/popup-positioning.test.ts` verifies, in all three engines: not clipped by `overflow: hidden`, opens below and aligned with the input, flips above when there's no room below, stays above `z-index: 2147483647`, and focus stays in the input. Mutation checks: removing the top layer, the anchor or the flip fallback each fail the matching tests. #11 reuses these styles in the component.
3. ~~**Bundle size budget.**~~ ✅ Set in #8. Measured on 2026-09-27 with `libphonenumber-js` 1.13.14 (`min`). The component does not use the country data yet, so the measurement used temporary entries that import exactly what v1 will use:

   | Build | Component only | + country list | + full v1 usage¹ |
   | --- | --- | --- | --- |
   | ESM (Vue and `libphonenumber-js` external) | 1.8 KB gzip | 2.0 KB gzip | 2.1 KB gzip |
   | IIFE (everything bundled) | 24.4 KB gzip | 46.4 KB gzip | 59.5 KB gzip |

   ¹ Country list + `parsePhoneNumberFromString` + `isValidPhoneNumber` + `AsYouType`.

   In the IIFE, the `min` metadata costs about 22 KB gzip and the parsing, validation and formatting code about 13 KB more. ESM consumers pay for `libphonenumber-js` through their own bundler, deduplicated with any other copy in the app.

   **No hard budget.** The goal is to stay as small as is practical, without trading away maintainability or correctness. Prefer the platform (`Intl`, Popover API, CSS) over extra code, and don't hand-roll what a well-maintained dependency already does well. Measure and record the size here and in the README on every release, so any growth is visible and explained.
4. ~~**`value` property semantics.**~~ ✅ Resolved in #5 by following native `<input>` semantics (see §4.1):
   - `value` is **not** a Vue prop, because Vue would define an instance accessor that shadows the class one. The element observes the `value` attribute itself (`observedAttributes` + `attributeChangedCallback`), which does not conflict with Vue: it tracks declared props with a `MutationObserver`.
   - The live value lives in a reactive `state` object owned by the element and read by the Vue component, so it works even when set before the element is connected.
   - A dirty flag mirrors the native "dirty value flag": user input or setting `value` marks it; `form.reset()` clears it.
   - The component uses `inheritAttrs: false`. Otherwise host attributes that are not props (`name`, `value`) fall through to the root element inside the shadow root.
   - Since #16, `value` and `defaultValue` are E.164 (D6).

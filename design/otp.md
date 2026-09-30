# `@teselia/otp` — design document

| | |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-09-30 |
| **Target release** | `1.0.0` on **2026-10-24** |
| **Custom element** | `<tes-otp>` |

An accessible one-time code input: the verification code people get by SMS, email or an authenticator app. It looks like a row of cells but is a single text field inside, so screen readers, paste, SMS autofill and password managers all work. It is a form-associated custom element that submits the code to any native `<form>`.

This document records the decisions taken before writing code, the options that were considered and why they were discarded. If a decision changes during implementation, update this file in the same pull request.

---

## 1. Goals and non-goals

### Goals

- **WCAG 2.2 AA by default**, including **3.3.8 Accessible Authentication**: paste, autofill and password managers always work, so nobody has to transcribe a code character by character.
- **Keyboard-first.** Every interaction works with the keyboard alone, and focus never gets lost or trapped.
- **Framework-agnostic.** It works in plain HTML (via CDN), Vue, React, or server-rendered pages.
- **Native form citizen.** It takes part in `<form>` submission, reset, validation and `disabled` fieldsets like a built-in input.
- **Small.** No runtime dependency besides Vue. Bundle size is measured and published.

### Non-goals (for the whole component, not only v1)

- Sending, verifying or generating codes, or any network request.
- A resend button or a countdown timer. Both belong to the page, which knows its own rules (and WCAG 2.2.1 Timing Adjustable applies to them there).

---

## 2. Decisions

### D1. Tag name: `<tes-otp>`, package `@teselia/otp`

- "OTP input" is the term people search for, so it helps discovery on npm and search engines.
- It is registered on import, with a `define(tagName = 'tes-otp')` export for collisions, exactly like `@teselia/phone` (phone D1).

**Discarded:** `<tes-code>` (ambiguous: a code editor, a postal code) and `<tes-one-time-code>` (matches the `autocomplete` token but is long to type).

### D2. One real input, drawn as cells

The component renders **one `<input>`** that holds the whole code, and draws the cells from its value.

- **Why one input.** Most OTP widgets use one `<input>` per character, and that breaks exactly what this component must get right:
  - Screen readers announce six unnamed fields instead of one labelled field.
  - Paste lands one character in the first box, or needs fragile code to spread it across boxes.
  - SMS autofill (`autocomplete="one-time-code"`) and password managers fill a single field. Six fields often receive nothing, which is a WCAG 3.3.8 failure.
  - Focus has to be moved by script on every keystroke, and `Backspace` across boxes behaves differently in every implementation.
- **How it is drawn.** The cells are `aria-hidden` elements that mirror the value, one character each. The input sits on top of them, with transparent text and caret, so pointer and keyboard interaction go to the real field. The active cell follows the input's selection and focus.
- **Overwrite model.** When the caret lands on a filled cell (arrow keys, click), that character is selected, so typing replaces it and the value never grows past `length`. At the end of the value the caret is collapsed, so typing appends.
- **Risk, to verify in the first spike:** keeping the active cell in sync with the selection in all three engines (`selectionchange` on inputs, or `select`/`keyup`/`pointerup` as a fallback), and hiding the real text and selection highlight without breaking `forced-colors`.

**Discarded:**

- **One input per character.** See above.
- **A plain text field with letter spacing.** It is robust, but alignment depends on the font, and it does not look like the pattern people expect.

### D3. Characters: digits by default, alphanumeric as an option

- `type="numeric"` (default): accepts `0–9`. The number input gets `inputmode="numeric"`, which shows the numeric keypad on phones.
- `type="alphanumeric"`: accepts `A–Z` and `0–9`. Letters are converted to upper case, and the field gets `inputmode="text"` and `autocapitalize="characters"`.
- **Normalization** happens on every input, including paste and autofill:
  - Spaces, hyphens and dots are removed, so a pasted `123 456` or `123-456` works.
  - Full-width digits (typed with Japanese and Chinese input methods) and Arabic-Indic digits are converted to ASCII.
  - Anything longer than `length` is cut at `length`.
- **Rejected characters** are dropped. For a typed key (not a paste), a polite announcement explains the rule once typing pauses: `text-invalid-character`, "Only digits are allowed". Otherwise a screen reader user would press a key and hear nothing change.

**Discarded:** a `pattern` attribute with a regular expression per character. It is flexible but hard to explain, test and localize, and the two types cover real codes.

### D4. Length

- `length` attribute, default `6`, an integer from `1` to `12`. Out-of-range or malformed values fall back to `6`, with a console warning in development.
- The input gets `maxlength` equal to `length`.

### D5. Completion and auto-submit

- A `complete` event fires every time the value reaches `length` through user input, with `detail: { value }`.
- `autosubmit` (off by default) submits the form on completion, using the same implicit submission algorithm as `@teselia/phone` (click the default button, or `requestSubmit()` when there is no other text field).
  - **WCAG 3.2.2 On Input.** Submitting on input is a change of context, which is only acceptable if people are told in advance. With `autosubmit`, the field description automatically includes `text-autosubmit` ("The code is sent when you enter the last character").
  - It never submits for a programmatic `value`, a form reset or a restore, only for user input.

**Discarded:** auto-submit on by default. It surprises people and conflicts with 3.2.2 unless every integrator writes the warning.

### D6. Form value

- The form value is the normalized code (`'123456'`, or upper case for `alphanumeric`), or empty.
- **A partial code is invalid** (`tooShort`, `text-incomplete`), even when the field is not `required`. A partial code is never useful, and sending it wastes a verification attempt. An empty, non-required field is valid.
- `setCustomValidity(message)` is exposed for server errors ("That code has expired"). It shows the error inline like any other. **Unlike native inputs, it is cleared as soon as the user edits the code**, because a stale custom error that blocks every later submission is the most common bug with this API.

### D7. Visual design

- Cells are at least 2.75rem (44px) tall, like the phone controls, with a 1px border that becomes 2px in the error state (not color alone), and `font-variant-numeric: tabular-nums`.
- The active cell shows the focus ring. An empty active cell shows a static caret bar: no blinking, so no animation at all (phone §3, reduced motion).
- **Reflow:** cells shrink to fit the container, down to 24px wide (WCAG 2.5.8). Eight cells fit in a 288px container.
- **Direction:** the cells are always left-to-right, even in `dir="rtl"` pages. Codes are read in that order everywhere; the label and messages still follow the page direction.
- The same `--tes-*` tokens and defaults as `@teselia/phone`, so both components look like one suite.

### D8. Shared code: a private workspace package, bundled into each component

This is the second component, so there is now real duplication with `@teselia/phone`, and the "no `packages/core` until there is duplicated code" rule applies:

- Implicit submission (`use-implicit-submission`), custom states, the live region announcer, and the form-associated element plumbing (`value`/`defaultValue`, dirty flag, validity getters, form callbacks).
- The token and focus CSS.
- Test support: `renderPhone`-style helpers, `expectNoAxeViolations`, the `emulateMedia` command.

**Decision:** move them to `packages/shared`, a **private** workspace package (never published). Each component **bundles** it into its own build, so it is not a runtime dependency:

- Each component stays self-contained, with its own version (Changesets), and nobody has to keep a shared package in sync across releases.
- The cost: a page that uses both components carries the shared code twice, around 1–2 KB gzip.
- Constraint: the public type declarations of a component must not import from `packages/shared`, or consumers would get broken types. The build must check this.
- The extraction is the first OTP issue, before any OTP code. `@teselia/phone` must keep its behaviour (all its tests pass unchanged), and its bundle size must stay within ±0.2 KB. It needs no release unless something else changes.

**Discarded:**

- **A published `@teselia/core`.** It couples versions and becomes a public API to maintain, for about 2 KB.
- **Copy and paste.** The copies would drift, for example a fix to the implicit submission landing in one component only.

---

## 3. v1 scope

### In

- Everything in D1–D8.
- `label` (required), `hint`, and an automatic description with the expected length (`text-length`, "6-digit code").
- `required`, `disabled` (also from a `<fieldset>`), `readonly`, `form.reset()`, form state restore, `Enter` to submit.
- `autocomplete="one-time-code"` by default.
- Keyboard model (§5.2), events (§4.2), validation (§5.4).
- Theming with tokens, parts and custom states, `forced-colors`, and RTL pages.
- Docs page with a demo, API tables, examples (HTML, Vue, React), accessibility notes and sizes. npm README.
- Unit tests for normalization, and browser tests in Chromium, Firefox and WebKit with axe.

### Out (explicitly)

- **WebOTP API** (`navigator.credentials.get({ otp })`), which reads the SMS directly on Chrome for Android. It needs a specific SMS format from the server, and it is hard to test. It could be an opt-in in `1.x`.
- **Masking** (dots instead of characters, like a password).
- **Grouping** (`123 456` with a visual gap). Possible in `1.x` as a `groups` attribute.
- **Custom per-character patterns** (see D3).

---

## 4. Public API

### 4.1 Attributes and properties

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | — | Visible label and accessible name. **Required.** |
| `name` | `name` | `string` | — | Form field name. |
| `value` | `defaultValue` | `string` | `''` | Initial value. `form.reset()` restores it. |
| — | `value` | `string` | `''` | Current value, normalized. |
| `hint` | `hint` | `string` | — | Help text, for example where the code was sent. |
| `length` | `length` | `number` | `6` | Number of characters, 1 to 12. |
| `type` | `type` | `'numeric' \| 'alphanumeric'` | `'numeric'` | Accepted characters. |
| `autosubmit` | `autosubmit` | `boolean` | `false` | Submits the form when the code is complete. |
| `required` | `required` | `boolean` | `false` | The value must not be empty. |
| `disabled` | `disabled` | `boolean` | `false` | Also inherited from a disabled `<fieldset>`. |
| `readonly` | `readOnly` | `boolean` | `false` | Not editable, still submitted. |
| `autocomplete` | `autocomplete` | `string` | `'one-time-code'` | Autofill hint. |

**Texts**, overridable like in `@teselia/phone`. `{length}` is replaced by the length.

| Attribute | Default (numeric) | Default (alphanumeric) |
| --- | --- | --- |
| `text-length` | `{length}-digit code` | `{length}-character code` |
| `text-required` | `Enter the code` | `Enter the code` |
| `text-incomplete` | `Enter all {length} digits` | `Enter all {length} characters` |
| `text-invalid-character` | `Only digits are allowed` | `Only letters and digits are allowed` |
| `text-autosubmit` | `The code is sent when you enter the last digit` | `The code is sent when you enter the last character` |

**Read-only properties:** `complete` (boolean), `form`, `validity`, `validationMessage`, `willValidate`.

**Methods:** `checkValidity()`, `reportValidity()`, `setCustomValidity(message)` (see D6), `focus()`.

### 4.2 Events

All events bubble and are composed.

| Event | `detail` | When |
| --- | --- | --- |
| `input` | `{ value, complete }` | On every user change of the value. |
| `change` | `{ value, complete }` | When the field loses focus with a different value, or before an implicit or automatic submission. |
| `complete` | `{ value }` | When user input makes the value reach `length`. |

Like native inputs, setting `value` from code fires none of them.

### 4.3 Form integration

As in `@teselia/phone` §4.3, through the shared element plumbing (D8):

- `setFormValue(value, state)`.
- Validity:
  - `valueMissing` → `text-required`
  - `tooShort` → `text-incomplete`
  - `customError` → the `setCustomValidity` message
  - The anchor is the input.
- `formResetCallback`, `formDisabledCallback`, `formStateRestoreCallback` (an `autocomplete` restore is normalized like a paste).

### 4.4 CSS custom properties

All the `--tes-*` tokens of `@teselia/phone` §4.4, with the same defaults and contrast guarantees, plus:

| Property | Purpose | Default |
| --- | --- | --- |
| `--tes-otp-cell-size` | Cell width and height | `2.75rem` |
| `--tes-otp-cell-gap` | Space between cells | `0.5rem` |

### 4.5 Parts

`field`, `label`, `cells` (the row), `cell`, `cell-filled` and `cell-active` (added alongside `cell`), `hint`, `error`.

### 4.6 Custom states

- `:state(invalid)`: an error is shown. Like phone, it follows the visible error, not raw validity.
- `:state(complete)`: all cells are filled.
- `:state(empty)`: no characters.

---

## 5. Accessibility specification

### 5.1 WCAG 2.2 AA criteria that shape the design

| Criterion | How it applies |
| --- | --- |
| 1.3.1 Info and Relationships | One labelled input. The hint, the expected length, the auto-submit notice and the error are linked with `aria-describedby`. The cells are `aria-hidden`. |
| 1.4.1 Use of Color | The error state adds a thicker border and a message. |
| 1.4.3 / 1.4.11 Contrast | The same tokens and verified defaults as phone. The active cell's focus ring is at least 3:1. |
| 1.4.10 Reflow | Cells shrink to fit 288px (D7). |
| 1.4.12 Text Spacing | No clipping in the cells, label, hint or error. |
| 2.1.1 / 2.1.2 Keyboard, No Trap | Native text field keys (§5.2). `Tab` always leaves. |
| 2.4.7 Focus Visible | The active cell shows the focus ring, also in `forced-colors`. |
| 2.5.8 Target Size | Cells are at least 24 × 24 px. |
| 3.2.2 On Input | No auto-submit by default. With `autosubmit`, it is announced in the description (D5). |
| 3.3.1 / 3.3.3 Error Identification, Suggestion | Errors say what is missing ("Enter all 6 digits"). |
| 3.3.2 Labels or Instructions | Visible label, optional hint, and the expected length in the description. |
| 3.3.8 Accessible Authentication (Minimum) | Paste, SMS autofill and password managers work in one step. Nothing blocks paste. |
| 4.1.2 Name, Role, Value | A native `<input>`: the value is the whole code. |
| 4.1.3 Status Messages | Rejected characters are announced politely. |

### 5.2 Keyboard

The field is one text input, so these are the platform's own keys. The component only keeps the overwrite model (D2) and the cells in sync.

| Key | Action |
| --- | --- |
| Typing | Fills the active cell and moves to the next one. On a filled cell, replaces its character. |
| `Backspace` | Deletes the character before the caret, or the selected one. |
| `Delete` | Deletes the character after the caret, or the selected one. |
| `←` / `→` | Move to the previous or next cell. |
| `Home` / `End` | Move to the first cell, or to the end of the value. |
| `Ctrl`/`⌘` + `V` | Pastes, normalized (D3). |
| `Enter` | Submits the form (implicit submission). |
| `Tab` | Leaves the field. |

### 5.3 Screen readers

- The input is read as "Verification code, edit, 6-digit code, [hint]", and its value as the typed characters.
- Nothing is announced on each keystroke; the screen reader already reads the input.
- Rejected characters: `text-invalid-character`, once typing pauses (same debounced announcer as phone).
- Completion is not announced: the value is already read, and with `autosubmit` the page changes.

### 5.4 Error messaging

Same rules as phone §5.3: no errors while typing; they appear on blur after editing and on submit; they update live, and clear as soon as the value is valid. `setCustomValidity` errors show immediately.

### 5.5 Manual testing matrix

| What | Browser | OS |
| --- | --- | --- |
| Keyboard only | Chrome, Firefox | Windows |
| NVDA | Firefox, Brave | Windows |
| **SMS code autofill** (keyboard suggestion "From Messages") | Safari | iOS |
| Password manager filling a code (optional) | any | any |
| Windows High Contrast (`forced-colors`) | Edge | Windows |
| 200 % and 400 % zoom, 320 px viewport | Chrome | any |

The iOS autofill test does not need VoiceOver: text yourself a message such as "Your code is 123456" from another phone, and check that the keyboard offers the code.

---

## 6. Definition of done and plan

### Definition of done for `1.0.0`

- [ ] Everything in §3 "In" is implemented.
- [ ] `@teselia/phone` still passes all its tests after the shared code extraction, and its size changed by at most ±0.2 KB.
- [ ] Unit tests cover normalization (separators, full-width and Arabic-Indic digits, case, length).
- [ ] Browser tests cover the overwrite model, keyboard, paste, autofill-style input, form submission/reset/validity, events and auto-submit, in Chromium, Firefox and WebKit.
- [ ] axe reports zero violations in every rendered state (empty, partial, complete, invalid, disabled, readonly).
- [ ] The manual testing matrix (§5.5) is completed, and results are on the docs page.
- [ ] Bundle size measured and published in the README and docs.
- [ ] Docs page with examples, API tables, keyboard table, accessibility notes and known limitations.
- [ ] `@teselia/otp@1.0.0` published to npm (only after explicit approval).

### Testing strategy

Same layers and tools as phone §6.1. Normalization is pure logic in `src/core/` and is unit tested in Node. Everything else runs in real browsers.

### Milestones

| Week | Dates | Deliverable |
| --- | --- | --- |
| 1 | 09-30 → 10-06 | Shared package extraction (D8). **Spikes:** cells over a transparent input with the selection in sync (D2), in all three engines; **SMS autofill into an input inside a shadow root on a real iPhone** (§7.1). Package and docs scaffold. |
| 2 | 10-07 → 10-13 | Input model (normalization, overwrite, paste), keyboard, cells, validation, events, auto-submit. |
| 3 | 10-14 → 10-20 | Theming, `forced-colors`, RTL, reflow, docs page and demo, README. |
| 4 | 10-21 → 10-24 | Manual testing, fixes, release **2026-10-24**. |

---

## 7. Open questions

1. **Does iOS offer the SMS code for an input inside a shadow root?** Safari's autofill has had gaps with shadow DOM inputs. If it fails, the fallback is to render the `<input>` in the light DOM through a slot, which changes the architecture. **That is why it is the first spike, on a real iPhone.** The same question applies to password managers.
2. **How do screen readers read the value?** NVDA may read `123456` as a number ("one hundred twenty-three thousand…") instead of digit by digit. The value of a native input cannot be changed for speech, so this goes into manual testing and, if needed, the docs.
3. **Selection sync events** (D2): is `selectionchange` on the input enough in all three engines, or is a fallback needed?
4. **Unicode digits:** full-width and Arabic-Indic digits are in scope (D3). Other scripts (Devanagari, Bengali…) could follow if anyone asks.

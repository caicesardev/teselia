# @teselia/otp

## 1.0.0

### Major Changes

- First stable release of `<tes-otp>`, an accessible one-time code input.
  
  - One real text field drawn as cells, so paste, SMS and email autofill (`autocomplete="one-time-code"`), password managers and screen readers see a plain input that holds the whole code.
  - Digits by default, or letters and digits with `type="alphanumeric"`, from 1 to 12 characters. Pasted codes are normalized: spaces, dots and dashes are dropped, full-width and Arabic-Indic digits become ASCII, and letters are upper-cased.
  - Overwrite editing: typing on a filled cell replaces its character, clicking a cell selects it, and a pasted complete code replaces the current one.
  - Form-associated custom element: `required`, validation messages for missing and partial codes, `setCustomValidity()` for server errors, `form.reset()`, disabled fieldsets, `readonly`, form state restore, and `Enter` to submit. Optional `autosubmit` when the last character is entered, announced in advance with a visible notice.
  - Bubbling `input`, `change` and `complete` events. Works with Vue `v-model`.
  - Screen reader description with the expected length, the hint and the error, and a polite announcement for rejected characters. Every text is replaceable through `text-*` attributes.
  - Theming with the shared `--tes-*` custom properties plus `--tes-otp-cell-size` and `--tes-otp-cell-gap`, `::part()` and `:state(invalid | complete | empty)`.
  - Supports Windows high contrast mode, right-to-left pages (the code stays left to right) and narrow screens (cells shrink down to 24px). Tested by hand with the keyboard, NVDA (Firefox and Brave), high contrast mode and code autofill on iOS.

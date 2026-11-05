# @teselia/otp

Accessible one-time code input for verification codes, shipped as a framework-agnostic Web Component. It looks like a row of cells but is one real text field, so paste, SMS and email autofill, password managers and screen readers all work. It meets WCAG 2.2 AA by default and submits the code to any native `<form>`.

**[Documentation and demo](https://teselia.caicesardev.com/otp)**

- Digits by default, or letters and digits with `type="alphanumeric"`. From 1 to 12 characters.
- Pasting `123 456` or `123-456` fills every cell. Full-width and Arabic-Indic digits are accepted too.
- `autocomplete="one-time-code"` by default, so the keyboard can offer codes from SMS and email.
- A real form control: `required`, validation messages, `setCustomValidity()` for server errors, reset, disabled fieldsets and `Enter` to submit.
- Optional `autosubmit` when the last character is entered, announced to everyone in advance.
- Keyboard-first: the keys of any text field, plus typing over a cell to replace it.
- Themeable with CSS custom properties, `::part()` and `:state()`.

## Install

```bash
npm install @teselia/otp vue
```

Or load the self-contained build from a CDN, with nothing else to install:

```html
<script src="https://cdn.jsdelivr.net/npm/@teselia/otp@1"></script>
```

## Usage

```js
import '@teselia/otp'
```

```html
<form>
  <tes-otp name="code" label="Verification code" required></tes-otp>
  <button type="submit">Verify</button>
</form>
```

The form submits `code=123456`. Listen to `input`, `change` or `complete` for live updates; `input` and `change` carry `detail: { value, complete }`, and `complete` carries `detail: { value }`.

Attributes, events, styling, and examples for Vue and React are in the [documentation](https://teselia.caicesardev.com/otp).

## Size

| Build | gzip |
| --- | --- |
| npm (ESM), in an app that already has Vue | 6.5 KB |
| CDN (IIFE), everything including Vue | 30 KB |

No dependencies besides Vue.

## Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari.

## License

[MIT](./LICENSE) © Caio Gomes

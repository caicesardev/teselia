# OTP

Accessible one-time code input for verification codes sent by SMS, email or an authenticator app. It looks like a row of cells but is a single text field, so paste, SMS autofill, password managers and screen readers all work.

Design decisions and the full accessibility specification are in the [design document](https://github.com/caicesardev/teselia/blob/main/design/otp.md).

::: warning Not published yet
`@teselia/otp` `1.0.0` is planned for **October 24, 2026**. The demo runs the current code; the installation commands below will work from that release.
:::

## Demo

<OtpDemo />

Things to try:

- Paste `123 456` or `123-456`: spaces and dashes are dropped and all six cells fill.
- Type a letter: it is not added, and screen readers hear "Only digits are allowed" once you stop typing.
- Click a filled cell, or move with `←` and `→`, then type to replace that character.
- Submit with a few digits to see "Enter all 6 digits".
- Submit `000000` to see a server-side error, set with `setCustomValidity()`. It goes away as soon as you edit the code.
- Turn on `autosubmit`: the form is sent when you type the last digit, and a notice under the field says so.
- Switch to letters and digits, and type `ab12cd`: letters are upper-cased.

## Installation

::: code-group

```bash [npm]
npm install @teselia/otp vue
```

```bash [pnpm]
pnpm add @teselia/otp vue
```

```html [CDN]
<script src="https://cdn.jsdelivr.net/npm/@teselia/otp@1"></script>
```

:::

The npm build keeps Vue as a peer dependency, so apps that already use Vue don't ship it twice. The CDN build bundles Vue and needs nothing else. There are no other dependencies.

| Build | Size (gzip) |
| --- | --- |
| npm, in an app that already uses Vue | 6.3 KB |
| CDN, including Vue | 29 KB |

Importing the package registers the `<tes-otp>` element. If `tes-otp` is already taken on your page, register it under another name:

```js
import { define } from '@teselia/otp'

define('my-otp')
```

## Usage

The element is a form control. Give it a `name`, and the form submits the code as typed, without spaces or dashes, for example `123456`. Checking the code is up to your server.

### HTML

```html
<script src="https://cdn.jsdelivr.net/npm/@teselia/otp@1"></script>

<form id="verify" action="/verify" method="post">
  <tes-otp
    name="code"
    label="Verification code"
    hint="We sent it to +34 612 ··· 678"
    required
  ></tes-otp>
  <button type="submit">Verify</button>
</form>

<script>
  const form = document.querySelector('#verify')
  const otp = form.querySelector('tes-otp')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const response = await fetch(form.action, { method: 'post', body: new FormData(form) })
    if (!response.ok) {
      otp.setCustomValidity('That code is not valid. Check the message and try again.')
      otp.focus()
    }
  })
</script>
```

The message from `setCustomValidity()` shows right away and is cleared when the user edits the code.

### Vue

Tell the Vue compiler that `tes-` tags are custom elements:

```js
// vite.config.js
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('tes-') },
      },
    }),
  ],
})
```

`v-model` works like on a native input and holds the normalized code:

```vue
<template>
  <tes-otp
    v-model="code"
    name="code"
    label="Verification code"
    @complete="verify($event.detail.value)"
  />
</template>

<script setup>
import '@teselia/otp'
import { ref } from 'vue'

const code = ref('')

function verify(value) {
  console.log('Checking', value)
}
</script>
```

### React

React 19 supports custom elements. Read the value from the form on submit, and use a ref for the element's own events:

```jsx
import '@teselia/otp'
import { useEffect, useRef } from 'react'

export function VerifyForm() {
  const otpRef = useRef(null)

  useEffect(() => {
    const otp = otpRef.current
    const logCode = (event) => console.log(event.detail.value)
    otp.addEventListener('complete', logCode)
    return () => otp.removeEventListener('complete', logCode)
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    console.log(data.get('code'))
  }

  return (
    <form onSubmit={handleSubmit}>
      <tes-otp ref={otpRef} name="code" label="Verification code" required />
      <button type="submit">Verify</button>
    </form>
  )
}
```

In TypeScript, declare `tes-otp` in `JSX.IntrinsicElements` so the tag type-checks.

## API reference

### Attributes and properties

Attributes use kebab-case and map to camelCase properties.

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | — | Visible label and accessible name. **Required.** |
| `name` | `name` | `string` | — | Form field name. |
| `value` | `defaultValue` | `string` | `''` | Initial value. `form.reset()` restores it. |
| — | `value` | `string` | `''` | Current value, normalized. |
| `hint` | `hint` | `string` | — | Help text below the field, for example where the code was sent. |
| `length` | `length` | `number` | `6` | Number of characters, from 1 to 12. |
| `type` | `type` | `'numeric' \| 'alphanumeric'` | `'numeric'` | Digits only, or letters and digits. |
| `autosubmit` | `autosubmit` | `boolean` | `false` | Submits the form when the user types or pastes the last character. |
| `required` | `required` | `boolean` | `false` | The value must not be empty. |
| `disabled` | `disabled` | `boolean` | `false` | Also applies inside a disabled `<fieldset>`. The value is not submitted. |
| `readonly` | `readOnly` | `boolean` | `false` | The value cannot be edited but is still submitted. |
| `autocomplete` | `autocomplete` | `string` | `'one-time-code'` | Autofill hint. Keep the default to get SMS and email codes from the keyboard. |

**What counts as a character.** Spaces, dots and dashes are dropped, so `123 456`, `123-456` and `123.456` all become `123456`. Full-width and Arabic-Indic digits become `0`–`9`. With `type="alphanumeric"`, letters `A`–`Z` are accepted and upper-cased. Anything else is ignored, and a value longer than `length` is cut.

**Read-only properties**

| Property | Type | Description |
| --- | --- | --- |
| `complete` | `boolean` | Whether every cell is filled. |
| `form` | `HTMLFormElement \| null` | The form the element belongs to. |
| `validity`, `validationMessage`, `willValidate` | | Same as on native inputs. |

**Methods:** `checkValidity()`, `reportValidity()`, `setCustomValidity(message)` and `focus()`, which focuses the code field.

### Text and translations

Every text in the component can be replaced, for example to translate it. `{length}` is replaced by the number of characters.

| Attribute | Default (numeric) | Default (alphanumeric) |
| --- | --- | --- |
| `text-length` | `{length}-digit code` | `{length}-character code` |
| `text-required` | `Enter the code` | `Enter the code` |
| `text-incomplete` | `Enter all {length} digits` | `Enter all {length} characters` |
| `text-invalid-character` | `Only digits are allowed` | `Only letters and digits are allowed` |
| `text-autosubmit` | `The code is sent when you enter the last digit` | `The code is sent when you enter the last character` |

`text-length` and `text-invalid-character` are only read by screen readers, never shown. `text-autosubmit` is shown under the field while `autosubmit` is on.

```html
<tes-otp
  lang="es"
  label="Código de verificación"
  text-length="Código de {length} cifras"
  text-required="Introduce el código"
  text-incomplete="Introduce las {length} cifras"
  text-invalid-character="Solo se admiten cifras"
  text-autosubmit="El código se envía al escribir la última cifra"
></tes-otp>
```

### Events

All events bubble and cross the shadow root.

| Event | `detail` | Fires when |
| --- | --- | --- |
| `input` | `{ value, complete }` | The user changes the code. A rejected key fires nothing. |
| `change` | `{ value, complete }` | The field loses focus with a different code, or right before the form is submitted with `Enter` or `autosubmit`. |
| `complete` | `{ value }` | The user's typing, paste or autofill fills the last cell with a new code. |

Like on native inputs, setting `value` from code or resetting the form fires none of them. Inside the listeners, the form data and validity already include the new code.

### Form integration

`<tes-otp>` is a form-associated custom element, so it behaves like a native input:

- The form submits the normalized code under `name`, or an empty string when the field is empty.
- `required` and partial codes block submission and show the message from `text-required` or `text-incomplete`.
- `setCustomValidity(message)` marks the field invalid with your message, for example after the server rejects the code. The next edit, `setCustomValidity('')` or `form.reset()` clears it.
- `form.reset()` restores the `value` attribute.
- A disabled `<fieldset>` disables the element.
- `Enter` submits the form through its first submit button, as native inputs do.
- With `autosubmit`, the form is submitted when the user fills the last cell, through the same path as `Enter`, so validation and `submit` listeners run as usual. A value set from code or restored by the browser never submits.
- The browser restores the value when the user navigates back to the page.

Errors appear when the user leaves the field after typing, or on submit. They update as the user fixes the code.

### CSS custom properties

Set them on the element or on any ancestor. They are the same variables as [Phone](./phone#css-custom-properties), so one theme covers every Teselia component.

| Property | Purpose | Light | Dark |
| --- | --- | --- | --- |
| `--tes-font-family` | Font family | inherited | inherited |
| `--tes-font-size` | Font size | inherited | inherited |
| `--tes-color-text` | Label and characters | `#1f2328` | `#e8eaee` |
| `--tes-color-muted` | Hint and `autosubmit` notice | `#59636e` | `#a3adba` |
| `--tes-color-bg` | Cell background | `#ffffff` | `#16181d` |
| `--tes-color-border` | Cell border | `#7d8590` | `#7f8a99` |
| `--tes-color-focus` | Active cell ring | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-error` | Error border and message | `#c4232b` | `#ff8a80` |
| `--tes-radius` | Cell corner radius | `0.375rem` | `0.375rem` |
| `--tes-space` | Base spacing | `0.5rem` | `0.5rem` |
| `--tes-otp-cell-size` | Cell width and height | `2.75rem` | `2.75rem` |
| `--tes-otp-cell-gap` | Space between cells | `0.5rem` | `0.5rem` |

The dark defaults apply when the page uses a dark `color-scheme`. Every default pair meets WCAG 2.2 AA contrast; if you change the colors, keep text at 4.5:1 and borders and the focus ring at 3:1.

```css
tes-otp {
  --tes-color-focus: #6d28d9;
  --tes-otp-cell-size: 3.25rem;
  --tes-otp-cell-gap: 0.75rem;
}
```

### Parts

Style inner elements with `::part()`.

| Part | Element |
| --- | --- |
| `field` | The whole component. |
| `label` | The visible label. |
| `cells` | The row of cells. |
| `cell` | Each cell. |
| `cell-filled` | A cell that holds a character, together with `cell`. |
| `cell-active` | The cell under the caret while the field has focus, together with `cell`. |
| `hint` | The help text. |
| `notice` | The `autosubmit` notice. |
| `error` | The error message. |

### Custom states

Combine them with `:state()` and `::part()`.

| State | Set while |
| --- | --- |
| `:state(invalid)` | An error message is shown. Like `:user-invalid`, not on page load. |
| `:state(complete)` | Every cell is filled. |
| `:state(empty)` | The field is empty. |

```css
tes-otp::part(cell-filled) {
  background: #f3f6fb;
}

tes-otp:state(complete)::part(cell) {
  border-color: #1a7f37;
}

tes-otp:state(invalid)::part(label) {
  color: #c4232b;
}
```

### Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari.

## Accessibility

`<tes-otp>` is built to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA out of the box, and it is tested with the keyboard first. You only need to give it a `label`.

It is one native text field. The cells are drawn on top of it and hidden from assistive technology, so screen readers, autofill and password managers see a plain input that holds the whole code.

### Keyboard

These are the keys of any text field. Typing on a filled cell replaces its character, so fixing a typo is one keystroke.

| Key | Action |
| --- | --- |
| Typing | Fills the active cell and moves to the next one. On a filled cell, replaces its character. |
| `Backspace` | Deletes the selected character, or the one before the caret at the end. The following characters move left. |
| `Delete` | Deletes the selected character. Does nothing at the end of the code. |
| `Ctrl` / `⌘` + `A` | Selects the whole code; typing replaces it. |
| `←` / `→` | Moves to the previous or next cell. |
| `Home` / `End` | Moves to the first cell, or to the end of the code. |
| `Ctrl` / `⌘` + `V` | Pastes. A complete code replaces the current one. |
| `Enter` | Submits the form. |
| `Tab` | Leaves the field. |

### Screen readers

- The field is read as "Verification code, edit, 6-digit code", followed by the hint and, with `autosubmit`, the notice.
- The value is read as the typed characters, like any text field. Nothing extra is announced on each keystroke.
- A rejected character is announced once typing pauses: "Only digits are allowed". A slip followed right away by a valid key stays silent.
- Errors are read when they appear, and the field is marked as invalid.
- Completing the code is not announced: the value is already read, and with `autosubmit` the page changes.

### WCAG 2.2 criteria

What each criterion means for the people using the field:

| Criterion | In practice |
| --- | --- |
| 1.3.1 Info and Relationships | The label names the field, and the expected length, hint, notice and errors are tied to it. |
| 1.3.5 Identify Input Purpose | `autocomplete="one-time-code"` lets the keyboard offer codes from SMS and email. |
| 1.4.1 Use of Color | The invalid state is a thicker border plus a message, not only a red color. |
| 1.4.3 / 1.4.11 Contrast | Text has at least 4.5:1 contrast, and borders and the focus ring at least 3:1, in light and dark themes. |
| 1.4.10 Reflow | Cells shrink on narrow screens, so an 8-character code fits a 320px wide page with no sideways scrolling. |
| 1.4.12 Text Spacing | Nothing is clipped with increased line, letter and word spacing. |
| 2.1.1 / 2.1.2 Keyboard, No Keyboard Trap | Everything works with the keyboard, and `Tab` always leaves the field. |
| 2.4.7 Focus Visible | The active cell shows a focus ring, also in Windows high contrast mode. |
| 2.5.8 Target Size | Cells are 44px by default and never narrower than 24px. |
| 3.2.2 On Input | Nothing is submitted on input by default. With `autosubmit`, a visible notice says so before the user starts. |
| 3.3.1 / 3.3.3 Error Identification and Suggestion | Errors say what is missing, for example "Enter all 6 digits". They appear after you leave the field, not while you type. |
| 3.3.2 Labels or Instructions | A visible label, an optional hint, and the expected length read by screen readers. |
| 3.3.8 Accessible Authentication (Minimum) | Paste, autofill and password managers fill the code in one step. Nothing blocks paste. |
| 4.1.2 Name, Role, Value | A native text input that holds the whole code. |
| 4.1.3 Status Messages | Rejected characters are announced without moving focus. |

It also adapts to Windows high contrast mode (`forced-colors`), has no animations at all (the caret does not blink), and keeps the code left to right in right-to-left pages while the label and messages follow the page.

### Known limitations

- **External labels do not reach the inner field.** A `<label for>` or `aria-labelledby` outside the component names the element but not the field inside its shadow root, which is the one that receives focus. Use the `label` attribute.
- **External descriptions do not reach the inner field either.** `aria-describedby` on the element is not read with the field. Use the `hint` attribute.
- **Long codes on narrow screens.** Up to 9 cells fit a 320px wide page with the default gap. For 10 to 12 characters, set a smaller `--tes-otp-cell-gap` on narrow screens.
- **Screen readers may read a numeric code as a number** ("one hundred twenty-three thousand…") instead of digit by digit. A native field's value cannot be changed for speech; this is checked in the manual testing below.
- **The WebOTP API is not used.** On Android, Chrome can read an SMS directly through `navigator.credentials.get({ otp })`, which needs a specially formatted message from your server. You can call it yourself and set `value` with the result.
- **Not a verification service.** The component sends nothing over the network: sending, checking and resending codes belong to your page and server.

### Testing

Every change runs the automated suite in Chromium, Firefox and WebKit: typing, pasting through the real clipboard, autofill, input methods, the keyboard and pointer, screen reader attributes and announcements, form submission and reset, contrast of the default colors in both themes, high contrast, right-to-left pages, narrow containers, text spacing, and an [axe-core](https://github.com/dequelabs/axe-core) scan.

Manual testing with real devices and assistive technology:

| What | Browser | Result |
| --- | --- | --- |
| Code autofill from the keyboard | Safari (iOS) | Passed. The keyboard offers a code received by email and fills the field inside the shadow root. |
| Keyboard only | Chrome, Firefox (Windows) | Pending |
| NVDA | Firefox, Brave (Windows) | Pending |
| VoiceOver | Safari (iOS) | Pending |
| High contrast mode | Edge (Windows) | Pending |
| 200% and 400% zoom, 320px width, text spacing | Chrome | Pending |

The full specification is in the [design document](https://github.com/caicesardev/teselia/blob/main/design/otp.md#5-accessibility-specification).

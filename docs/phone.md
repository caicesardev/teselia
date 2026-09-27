# Phone

Accessible international phone input with country calling code. It submits a single normalized value to any native `<form>`.

Design decisions and the full accessibility specification are in the [design document](https://github.com/caicesardev/teselia/blob/main/design/phone.md).

## Demo

<PhoneDemo />

Things to try:

- Type `ger`, `+49` or `de` in the country field, then pick a result with the arrow keys and `Enter`.
- Paste `+44 20 7946 0958` into the number field: the country switches to the United Kingdom.
- Submit the form empty, or with a few digits, to see the validation messages.
- Submit a valid number to see the value that reaches the server, then reset the form.

## Installation

::: code-group

```bash [npm]
npm install @teselia/phone vue
```

```bash [pnpm]
pnpm add @teselia/phone vue
```

```html [CDN]
<script src="https://cdn.jsdelivr.net/npm/@teselia/phone@1"></script>
```

:::

The npm build keeps Vue as a peer dependency, so apps that already use Vue don't ship it twice. The CDN build bundles Vue and needs nothing else.

| Build | Size (gzip) |
| --- | --- |
| npm, in an app that already uses Vue | 43 KB |
| CDN, including Vue | 67 KB |

Most of it is the phone number metadata of [`libphonenumber-js`](https://gitlab.com/catamphetamine/libphonenumber-js), which the component needs to format and validate numbers of every country. The component's own code is 9.0 KB.

Importing the package registers the `<tes-phone>` element. If `tes-phone` is already taken on your page, register it under another name:

```js
import { define } from '@teselia/phone'

define('my-phone')
```

## Usage

The element is a form control. Give it a `name`, and the form submits the number in [E.164](https://en.wikipedia.org/wiki/E.164) format, for example `+34612345678`.

### HTML

```html
<script src="https://cdn.jsdelivr.net/npm/@teselia/phone@1"></script>

<form action="/contact" method="post">
  <tes-phone
    name="phone"
    label="Phone number"
    hint="We will only call you about your order."
    preferred-countries="ES,PT,FR"
    required
  ></tes-phone>
  <button type="submit">Send</button>
</form>

<script>
  document.querySelector('tes-phone').addEventListener('change', (event) => {
    const { value, country, valid } = event.detail
    console.log(value, country, valid)
  })
</script>
```

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

`v-model` works like on a native input and holds the E.164 value:

```vue
<template>
  <tes-phone
    v-model="phone"
    name="phone"
    label="Phone number"
    default-country="ES"
    @countrychange="country = $event.detail.country"
  />
  <p>{{ phone }} ({{ country }})</p>
</template>

<script setup>
import '@teselia/phone'
import { ref } from 'vue'

const phone = ref('')
const country = ref('')
</script>
```

### React

React 19 supports custom elements. Read the value from the form on submit, and use a ref for the element's own events:

```jsx
import '@teselia/phone'
import { useEffect, useRef } from 'react'

export function ContactForm() {
  const phoneRef = useRef(null)

  useEffect(() => {
    const phone = phoneRef.current
    const logCountry = (event) => console.log(event.detail.country)
    phone.addEventListener('countrychange', logCountry)
    return () => phone.removeEventListener('countrychange', logCountry)
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    console.log(data.get('phone'))
  }

  return (
    <form onSubmit={handleSubmit}>
      <tes-phone ref={phoneRef} name="phone" label="Phone number" default-country="ES" required />
      <button type="submit">Send</button>
    </form>
  )
}
```

In TypeScript, declare `tes-phone` in `JSX.IntrinsicElements` so the tag type-checks.

## API reference

### Attributes and properties

Attributes use kebab-case and map to camelCase properties.

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | — | Visible label and accessible name. **Required.** |
| `name` | `name` | `string` | — | Form field name. |
| `value` | `defaultValue` | `string` | `''` | Initial value in E.164. `form.reset()` restores it. |
| — | `value` | `string` | `''` | Current value in E.164. Setting it selects the country and fills the number. |
| `hint` | `hint` | `string` | — | Help text below the field, read by screen readers with the number. |
| `default-country` | `defaultCountry` | ISO code | from the browser | Initial country, for example `ES`. |
| `preferred-countries` | `preferredCountries` | ISO codes | — | Countries listed first, under "Suggested". Comma- or space-separated. |
| `only-countries` | `onlyCountries` | ISO codes | — | Restricts the list to these countries. |
| `required` | `required` | `boolean` | `false` | The value must not be empty. |
| `disabled` | `disabled` | `boolean` | `false` | Also applies inside a disabled `<fieldset>`. The value is not submitted. |
| `readonly` | `readOnly` | `boolean` | `false` | The value cannot be edited but is still submitted. |
| `autocomplete` | `autocomplete` | `string` | `'tel'` | Autofill hint for the number field. |
| `lang` | — | BCP 47 tag | inherited | Language of the country names. Inherited from the closest `lang` attribute. |

When `default-country` is missing, the country comes from the region of the browser language (`en-GB` → United Kingdom). With `only-countries`, a region outside the list falls back to the first allowed preferred country.

**Read-only properties**

| Property | Type | Description |
| --- | --- | --- |
| `country` | `string` | Selected country as an ISO code, for example `'ES'`, or `''`. |
| `callingCode` | `string` | Calling code of the selected country, for example `'34'`. |
| `nationalNumber` | `string` | The number in national format, for example `'612 34 56 78'`. |
| `valid` | `boolean` | Whether the number is valid for its country. |
| `form` | `HTMLFormElement \| null` | The form the element belongs to. |
| `validity`, `validationMessage`, `willValidate` | | Same as on native inputs. |

**Methods:** `checkValidity()`, `reportValidity()` and `focus()`, which focuses the number field.

### Text and translations

Every text in the component can be replaced, for example to translate it. `{country}` is replaced by the country name and calling code, and `{count}` by a number.

| Attribute | Default |
| --- | --- |
| `text-country` | `Country code` |
| `text-suggested` | `Suggested` |
| `text-results` | `Countries available: {count}` |
| `text-no-results` | `No countries found` |
| `text-required` | `Enter a phone number` |
| `text-invalid` | `Enter a valid phone number for {country}` |
| `text-country-required` | `Select a country code` |
| `text-not-allowed` | `Numbers from {country} are not accepted` |
| `text-country-changed` | `Country set to {country}` |

`text-country` names the country field for screen readers. `text-results` and `text-country-changed` are only announced, never shown.

Country names are translated by the browser, in the language of `lang`:

```html
<tes-phone lang="es" label="Teléfono" text-country="Prefijo" text-required="Introduce un teléfono"></tes-phone>
```

### Events

All events bubble, cross the shadow root, and carry `detail: { value, country, valid }`.

| Event | Fires when |
| --- | --- |
| `input` | The user changes the number or the country. |
| `change` | The user commits a change: the number field loses focus with a different number, or a different country is picked. |
| `countrychange` | The country changes for any reason: the user, a pasted number, autofill, the `value` property or a form reset. |

Like on native inputs, setting `value` from code fires neither `input` nor `change`.

### Form integration

`<tes-phone>` is a form-associated custom element, so it behaves like a native input:

- The form submits the E.164 value under `name`, or an empty string when the field is empty.
- `required` and invalid numbers block submission and show the message from `text-required` or `text-invalid`.
- `form.reset()` restores the `value` attribute and the default country.
- A disabled `<fieldset>` disables the element.
- `Enter` in the number field submits the form through its first submit button, as native inputs do. Nothing happens if that button is disabled.
- The browser restores the value when the user navigates back to the page, and autofill works through `autocomplete="tel"`.

Errors appear when the user leaves the number field after typing, or on submit. They update as the user fixes the number.

### CSS custom properties

Set them on the element or on any ancestor. The same variables will theme every Teselia component.

| Property | Purpose | Light | Dark |
| --- | --- | --- | --- |
| `--tes-font-family` | Font family | inherited | inherited |
| `--tes-font-size` | Font size | inherited | inherited |
| `--tes-color-text` | Text | `#1f2328` | `#e8eaee` |
| `--tes-color-muted` | Hint and secondary text | `#59636e` | `#a3adba` |
| `--tes-color-bg` | Field and popup background | `#ffffff` | `#16181d` |
| `--tes-color-border` | Field border | `#7d8590` | `#7f8a99` |
| `--tes-color-accent` | Selected country | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-on-accent` | Text on the accent color | `#ffffff` | `#0d1117` |
| `--tes-color-hover` | Hovered and highlighted option | `#eef3fb` | `#232a36` |
| `--tes-color-focus` | Focus ring | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-error` | Error border and message | `#c4232b` | `#ff8a80` |
| `--tes-radius` | Corner radius | `0.375rem` | `0.375rem` |
| `--tes-space` | Base spacing | `0.5rem` | `0.5rem` |
| `--tes-popup-max-height` | Maximum height of the country list | `18rem` | `18rem` |

The dark defaults apply when the page uses a dark `color-scheme`. Every default pair meets WCAG 2.2 AA contrast; if you change the colors, keep text at 4.5:1 and borders and the focus ring at 3:1.

```css
tes-phone {
  --tes-color-accent: #6d28d9;
  --tes-color-focus: #6d28d9;
  --tes-radius: 0;
}
```

### Parts

Style inner elements with `::part()`.

| Part | Element |
| --- | --- |
| `field` | The whole component. |
| `label` | The visible label. |
| `group` | The row with both controls. |
| `country` | The country field. |
| `number` | The number field. |
| `hint` | The help text. |
| `error` | The error message. |
| `popup` | The popup with the country list. |
| `listbox` | The country list. |
| `group-label` | The "Suggested" heading. |
| `option` | Each country in the list. |
| `option-selected` | The selected country, together with `option`. |
| `no-results` | The message shown when no country matches. |

### Custom states

Combine them with `:state()` and `::part()`.

| State | Set while |
| --- | --- |
| `:state(invalid)` | An error message is shown. Like `:user-invalid`, not on page load. |
| `:state(open)` | The country list is open. |
| `:state(empty)` | The number field is empty. |

```css
tes-phone:state(invalid)::part(label) {
  color: #c4232b;
}

tes-phone:state(open)::part(country) {
  border-color: #0b5fcc;
}
```

### Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari.

## Accessibility

`<tes-phone>` is built to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA out of the box, and it is tested with the keyboard first. You only need to give it a `label`.

### Keyboard

The country field is a combobox: type to filter the list, or use the arrow keys to browse it. The number field is a regular text field, and `Enter` in it submits the form, like in a native input.

| Key | List closed | List open |
| --- | --- | --- |
| Typing | Opens the list and filters it by name, ISO code or calling code | Filters the list |
| `↓` | Opens the list on the selected country | Highlights the next country |
| `↑` | Opens the list on the selected country | Highlights the previous country |
| `Alt` + `↓` | Opens the list | — |
| `Enter` | — | Selects the highlighted country and closes the list |
| `Escape` | Restores the name of the selected country | Closes the list without changing the country |
| `Tab` | Moves to the number field | Closes the list without changing the country, then moves to the number field |
| `Shift` + `Tab` | Moves back, out of the component | Closes the list, then moves back |

- The highlight wraps around at both ends of the list.
- `Home` and `End` move the text cursor, as in any text field.
- `Escape` inside a dialog closes the list first, not the dialog.
- Focus stays in the country field while the list is open. The component never moves focus on its own.

### Screen readers

- Both fields sit in a group named after the label. The country field is read as "Country code, combobox, Spain +34".
- The highlighted country is read as you move through the list, and the chosen one is marked as selected.
- After you stop typing in the country field, the number of results is announced, for example "Countries available: 12", or "No countries found".
- When a pasted or autofilled number changes the country, the change is announced: "Country set to United Kingdom +44".
- The hint is read together with the number field. Errors are read when they appear, and the field is marked as invalid.
- Formatting while typing is silent: the screen reader already reads the new value.

### WCAG 2.2 criteria

What each criterion means for the people using the field:

| Criterion | In practice |
| --- | --- |
| 1.3.1 Info and Relationships | The label names both fields, and the hint and errors are tied to the number field. |
| 1.3.5 Identify Input Purpose | `autocomplete="tel"` lets browsers and assistive tools fill in the number. |
| 1.4.1 Use of Color | The invalid state is a thicker border plus a message, not only a red color. |
| 1.4.3 / 1.4.11 Contrast | Text has at least 4.5:1 contrast, and borders and the focus ring at least 3:1, in light and dark themes. |
| 1.4.10 Reflow | The fields stack on narrow screens, down to 320px, with no sideways scrolling. |
| 2.1.1 / 2.1.2 Keyboard, No Keyboard Trap | Everything works with the keyboard, and `Tab` always leaves the component. |
| 2.4.7 Focus Visible | Focus and the highlighted country are always visible, also in Windows high contrast mode. |
| 2.4.11 Focus Not Obscured | The country list opens above or below the field and never covers it. |
| 2.5.8 Target Size | Fields are 44px tall and each country in the list is 40px tall. |
| 3.2.2 On Input | Picking a country or pasting a number never submits the form or moves focus. |
| 3.3.1 / 3.3.3 Error Identification and Suggestion | Errors say what is wrong and which country the number should match. They appear after you leave the field, not while you type. |
| 3.3.2 Labels or Instructions | A visible label, plus an optional hint. |
| 4.1.2 Name, Role, Value | Native inputs with the ARIA combobox pattern, so assistive technology knows what each part is and what it holds. |
| 4.1.3 Status Messages | Result counts and automatic country changes are announced without moving focus. |

It also adapts to Windows high contrast mode (`forced-colors`), has no animations at all (so nothing moves for people who prefer reduced motion), and mirrors its layout in right-to-left pages while keeping the number left to right.

### Known limitations

- **External labels do not reach the inner fields.** A `<label for>` or `aria-labelledby` outside the component names the element but not the fields inside its shadow root, which are the ones that receive focus. Use the `label` attribute.
- **External descriptions do not reach the inner fields either.** `aria-describedby` on the element is not read with the number field. Use the `hint` attribute.
- **VoiceOver has not been tested yet**, on macOS or iOS. NVDA, the keyboard and high contrast mode have been tested by hand (below), and Safari's keyboard behaviour is covered by automated tests in WebKit. Reports from VoiceOver users are very welcome in the [issue tracker](https://github.com/caicesardev/teselia/issues).
- **Valid does not mean reachable.** Numbers are checked for the right length and prefixes of their country, not whether the line exists or whether it is a mobile or a landline.

### Testing

Every change runs the automated suite in Chromium, Firefox and WebKit: keyboard and pointer interaction, screen reader attributes, announcements, contrast of the default colors in both themes, high contrast and reduced motion, and an [axe-core](https://github.com/dequelabs/axe-core) scan.

Manual testing with assistive technology:

| Assistive technology | Browser | Result |
| --- | --- | --- |
| Keyboard only | Chrome, Firefox (Windows) | Passed. Testing led to `Enter` in the number field submitting the form, like a native input. |
| NVDA | Firefox, Brave (Windows) | Passed. Testing fixed a repeated "Country set to…" announcement that Chromium skipped. Some Spanish voices read a list position such as "1 de 241" as a date; the component sends the right text. |
| VoiceOver | Safari (iOS) | Not tested yet |
| High contrast mode | Edge (Windows) | Passed. Borders, focus, the highlighted and selected countries and the error state stay distinguishable. |
| 200% and 400% zoom, 320px width, text spacing | Chrome | Passed. Checked at 640px and 320px wide (the width 200% and 400% zoom leave on a 1280px screen) and with the WCAG 1.4.12 text spacing override: nothing clipped and no horizontal scroll. |

The full specification is in the [design document](https://github.com/caicesardev/teselia/blob/main/design/phone.md#5-accessibility-specification).

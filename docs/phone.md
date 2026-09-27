# Phone

Accessible international phone input with country calling code. It submits a single normalized value to any native `<form>`.

::: warning In development
`@teselia/phone` is not published yet. Version `1.0.0` is planned for **October 24, 2026**. The demo below runs the current build. Scope and decisions: [design document](https://github.com/caicesardev/teselia/blob/main/design/phone.md).
:::

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

- The `label` attribute gives the field its visible label and accessible name. It is required.
- `element.focus()` and clicks on the label move focus to the input.
- It works with `required`, form reset and disabled fieldsets, like a native input.

The full accessibility specification, including the keyboard model of the country selector, is in the [design document](https://github.com/caicesardev/teselia/blob/main/design/phone.md#5-accessibility-specification).

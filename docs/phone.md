# Phone

Accessible international phone input with country calling code. It submits a single normalized value to any native `<form>`.

::: warning In development
`@teselia/phone` is not published yet. Version `1.0.0` is planned for **October 24, 2026**. The demo below is an early build: you can already filter the country list by typing in the country field and pick a country with the keyboard or the mouse, the number is formatted as you type, the form submits it in E.164 format, and errors appear when you leave the field or submit. Paste a number like +44 20 7946 0958 to see the country switch automatically. Scope and decisions: [design document](https://github.com/caicesardev/teselia/blob/main/design/phone.md).
:::

## Demo

<PhoneDemo />

Submit the form empty to see native validation, type a number and submit again to see the value that reaches the server, or reset it.

## Installation

::: code-group

```bash [npm]
npm install @teselia/phone vue
```

```bash [pnpm]
pnpm add @teselia/phone vue
```

```html [CDN]
<script src="https://cdn.jsdelivr.net/npm/@teselia/phone"></script>
```

:::

The npm build keeps Vue as a peer dependency, so apps that already use Vue don't ship it twice. The CDN build bundles Vue and needs nothing else.

## Usage

Importing the package registers the `<tes-phone>` element:

```js
import '@teselia/phone'
```

```html
<form>
  <tes-phone name="phone" label="Phone number" required></tes-phone>
  <button type="submit">Submit</button>
</form>
```

If `tes-phone` is already taken on your page, register it under another name:

```js
import { define } from '@teselia/phone'

define('my-phone')
```

## Accessibility

- The `label` attribute gives the field its visible label and accessible name. It is required.
- `element.focus()` and clicks on the label move focus to the input.
- It works with `required`, form reset and disabled fieldsets, like a native input.

The full accessibility specification, including the keyboard model of the country selector, is in the [design document](https://github.com/caicesardev/teselia/blob/main/design/phone.md#5-accessibility-specification).

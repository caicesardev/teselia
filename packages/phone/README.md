# @teselia/phone

Accessible international phone input with country calling code, shipped as a framework-agnostic Web Component. It meets WCAG 2.2 AA by default and submits one normalized value in [E.164](https://en.wikipedia.org/wiki/E.164) format to any native `<form>`.

**[Documentation and demo](https://teselia.caicesardev.com/phone)**

- Searchable country selector: type a country name, an ISO code or a calling code.
- Formats the number as you type and validates it for the selected country.
- Pasting an international number selects its country.
- A real form control: `required`, validation messages, reset, disabled fieldsets and autofill.
- Keyboard-first, following the WAI-ARIA combobox pattern. Country names in the page language.
- Themeable with CSS custom properties, `::part()` and `:state()`.

## Install

```bash
npm install @teselia/phone vue
```

Or load the self-contained build from a CDN, with nothing else to install:

```html
<script src="https://cdn.jsdelivr.net/npm/@teselia/phone@1"></script>
```

## Usage

```js
import '@teselia/phone'
```

```html
<form>
  <tes-phone name="phone" label="Phone number" required></tes-phone>
  <button type="submit">Send</button>
</form>
```

The form submits `phone=+34612345678`. Listen to `input`, `change` or `countrychange` for live updates; each event carries `detail: { value, country, valid }`.

Attributes, events, styling, and examples for Vue and React are in the [documentation](https://teselia.caicesardev.com/phone).

## Size

| Build | gzip |
| --- | --- |
| npm (ESM), component code only | 9.0 KB |
| npm (ESM), with `libphonenumber-js`, minified, in an app that already has Vue | 43 KB |
| CDN (IIFE), everything including Vue | 67 KB |

Most of the weight is the phone number metadata of [`libphonenumber-js`](https://gitlab.com/catamphetamine/libphonenumber-js) (the `min` set), which the component needs to format and validate numbers of every country.

## Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari.

## License

[MIT](./LICENSE) © Caio Gomes

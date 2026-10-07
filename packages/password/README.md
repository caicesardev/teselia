# @teselia/password

Accessible password input with a show/hide button and live requirements, shipped as a framework-agnostic Web Component. It renders a native password field, so browser and third-party password managers can fill, save and generate passwords. It meets WCAG 2.2 AA by default and submits the password to any native `<form>`.

**[Documentation and demo](https://teselia.caicesardev.com/password)**

- `purpose="current"` to sign in, `purpose="new"` to choose a new password: the right `autocomplete` for password managers, and `passwordrules` for Safari's generated passwords.
- A text "Show" / "Hide" button. The password is hidden again before the form is submitted, on reset and when the page is left.
- For new passwords, a list of requirements checked as you type: a minimum length by default, plus optional character classes. Screen readers hear only what changed, once typing pauses.
- A Caps Lock warning.
- Paste is never blocked and passwords are never cut. Length counts Unicode characters, as NIST asks.
- A real form control: `required`, validation messages, `setCustomValidity()` for server errors, reset, disabled fieldsets and `Enter` to submit.
- Themeable with CSS custom properties, documented classes and `:state()`.

## Install

```bash
npm install @teselia/password vue
```

Or load the self-contained build from a CDN, with nothing else to install:

```html
<script src="https://cdn.jsdelivr.net/npm/@teselia/password@1"></script>
```

## Usage

```js
import '@teselia/password'
```

```html
<form>
  <input name="email" type="email" autocomplete="username" aria-label="Email" required />
  <tes-password name="password" label="New password" purpose="new" minlength="15" required></tes-password>
  <button type="submit">Create account</button>
</form>
```

The form submits `password` exactly as typed. Listen to `input` or `change` for live updates, with `detail: { value, requirementsMet }`, and to `revealchange`, with `detail: { revealed }`.

Unlike the other Teselia components, this one has no shadow root: Firefox does not fill password fields inside one. Your page styles therefore reach the field, so prefer the documented classes over broad `input` or `button` rules.

Attributes, events, styling, and examples for Vue and React are in the [documentation](https://teselia.caicesardev.com/password).

## Size

| Build | gzip |
| --- | --- |
| npm (ESM), in an app that already has Vue | 6.6 KB |
| CDN (IIFE), everything including Vue | 30 KB |

No dependencies besides Vue.

## Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari.

## License

[MIT](./LICENSE) © Caio Gomes

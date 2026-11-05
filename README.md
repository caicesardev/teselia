# Teselia

Accessible micro components built with Vue 3, shipped as framework-agnostic Web Components. WCAG 2.2 AA by default.

**[teselia.caicesardev.com](https://teselia.caicesardev.com)**

Each component is a small, single-purpose form input that works in plain HTML, Vue, React or any other framework, and takes part in native `<form>` submission and validation.

## Components

| Package | Element | Description | Docs |
| --- | --- | --- | --- |
| [`@teselia/phone`](./packages/phone) | `<tes-phone>` | International phone input with a searchable country selector. Formats as you type and submits E.164. | [Phone](https://teselia.caicesardev.com/phone) |
| [`@teselia/otp`](./packages/otp) | `<tes-otp>` | One-time code input drawn as cells over one real field, so paste, SMS autofill and screen readers work. | [OTP](https://teselia.caicesardev.com/otp) |
| [`@teselia/password`](./packages/password) | `<tes-password>` | Password input with a show/hide button and live requirements. Password managers can fill, save and generate passwords. | [Password](https://teselia.caicesardev.com/password) |

Install one with `npm install @teselia/phone vue`, or load it from a CDN with `<script src="https://cdn.jsdelivr.net/npm/@teselia/phone@1"></script>`.

## Principles

- **Accessible by default.** Designed against WCAG 2.2 AA, keyboard-first, with automated tests in Chromium, Firefox and WebKit plus axe-core.
- **Native forms.** Validation, reset, disabled fieldsets and autofill work like on built-in inputs. Phone and OTP are form-associated custom elements; password renders a native input in the light DOM so password managers work in every browser.
- **Themeable.** Shared CSS custom properties with light and dark defaults, plus `::part()` or documented classes, and custom states.
- **Documented decisions.** Each component has a design document in [`design/`](./design).

## Development

Requires Node 22.12+ and pnpm.

```bash
pnpm install
pnpm test
pnpm docs:dev
```

`pnpm test` runs the unit tests in Node and the browser tests in Chromium, Firefox and WebKit through Playwright (`pnpm exec playwright install` once).

## License

[MIT](./LICENSE) © Caio Gomes

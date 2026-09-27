# Teselia

Accessible micro components built with Vue 3, shipped as framework-agnostic Web Components. WCAG 2.2 AA by default.

**[teselia.caicesardev.com](https://teselia.caicesardev.com)**

Each component is a small, single-purpose form input that works in plain HTML, Vue, React or any other framework, and takes part in native `<form>` submission and validation.

## Components

| Package | Element | Description |
| --- | --- | --- |
| [`@teselia/phone`](./packages/phone) | `<tes-phone>` | International phone input with country calling code. Submits E.164. |

## Principles

- **Accessible by default.** Designed against WCAG 2.2 AA, keyboard-first, tested in Chromium, Firefox and WebKit with axe-core, and manually with screen readers.
- **Native forms.** Form-associated custom elements: validation, reset, disabled fieldsets and autofill work like on built-in inputs.
- **Themeable.** CSS custom properties, `::part()` and custom states, with light and dark defaults.
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

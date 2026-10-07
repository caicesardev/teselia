# Password

Accessible password input with a show/hide button and, for new passwords, requirements that are checked as you type. It renders a native password field, so browser and third-party password managers can fill, save and generate passwords.

Design decisions and the full accessibility specification are in the [design document](https://github.com/caicesardev/teselia/blob/main/design/password.md).

::: warning Not published yet
`@teselia/password` `1.0.0` is planned for **November 4, 2026**. The demos run the current code; the installation commands below will work from that release.
:::

## Demo

### Signing in

<PasswordDemo />

### Choosing a new password

<PasswordDemo purpose="new" />

Things to try:

- Press **Show**, then submit: the password is hidden again before the form is sent.
- Turn Caps Lock on and type: a warning appears under the field.
- In the second demo, watch the requirements change as you type. A screen reader hears only what changed, once you pause.
- Submit a password that contains the word `password`: the demo rejects it the way a server would, with `setCustomValidity()`.
- Paste a long password: it is never cut or blocked.

## Installation

::: code-group

```bash [npm]
npm install @teselia/password vue
```

```bash [pnpm]
pnpm add @teselia/password vue
```

```html [CDN]
<script src="https://cdn.jsdelivr.net/npm/@teselia/password@1"></script>
```

:::

The npm build keeps Vue as a peer dependency, so apps that already use Vue don't ship it twice. The CDN build bundles Vue and needs nothing else. There are no other dependencies.

| Build | Size (gzip) |
| --- | --- |
| npm, in an app that already uses Vue | 6.6 KB |
| CDN, including Vue | 30 KB |

Importing the package registers the `<tes-password>` element. If `tes-password` is already taken on your page, register it under another name:

```js
import { define } from '@teselia/password'

define('my-password')
```

## Usage

The element renders a real `<input type="password">` with the `name` you give it, so the form submits the password exactly as typed. Use `purpose="current"` (the default) to sign in and `purpose="new"` to choose a new password: it tells password managers whether to fill a saved password or offer a new one.

### HTML

```html
<script src="https://cdn.jsdelivr.net/npm/@teselia/password@1"></script>

<form id="sign-up" action="/sign-up" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username" required />

  <tes-password
    name="password"
    label="New password"
    purpose="new"
    minlength="15"
    hint="Use a passphrase you do not use anywhere else."
    required
  ></tes-password>

  <button type="submit">Create account</button>
</form>

<script>
  const form = document.querySelector('#sign-up')
  const password = form.querySelector('tes-password')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const response = await fetch(form.action, { method: 'post', body: new FormData(form) })
    if (response.status === 422) {
      password.setCustomValidity('This password appears in known data breaches. Choose another one.')
      password.focus()
    }
  })
</script>
```

Keep a username or email field in the same form, with `autocomplete="username"`: password managers save the pair together.

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

`v-model` works like on a native input:

```vue
<template>
  <tes-password
    v-model="password"
    name="password"
    label="New password"
    purpose="new"
    @input="requirementsMet = $event.detail.requirementsMet"
  />
</template>

<script setup>
import '@teselia/password'
import { ref } from 'vue'

const password = ref('')
const requirementsMet = ref(false)
</script>
```

### React

React 19 supports custom elements. Read the value from the form on submit:

```jsx
import '@teselia/password'

export function SignInForm() {
  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    console.log(data.get('email'), data.get('password'))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" autoComplete="username" aria-label="Email" required />
      <tes-password name="password" label="Password" required />
      <button type="submit">Sign in</button>
    </form>
  )
}
```

In TypeScript, declare `tes-password` in `JSX.IntrinsicElements` so the tag type-checks.

## Styling: no shadow DOM

Unlike the other Teselia components, `<tes-password>` does **not** use a shadow root. Firefox does not fill a password field inside a shadow root, so the field lives in the page like any other input (see [password managers](#password-managers)). That has two consequences:

- **Your page styles reach the field.** Every rule of the component has zero specificity (`:where()`), so any selector of yours wins. That is useful for theming, but broad rules such as `input { … }`, `button { … }` or a CSS reset also change the field.
- **Typography containers restyle the requirements list.** Inside Tailwind's `prose`, VitePress content or CMS article styles, the list gets their margins and bullets. Opt the element out: `class="not-prose"` with Tailwind Typography, `class="vp-raw"` in VitePress (with `postcssIsolateStyles`), or your system's equivalent.

Style the inner elements with the [documented classes](#classes) instead of `::part()`.

## API reference

### Attributes and properties

Attributes use kebab-case and map to camelCase properties.

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | — | Visible label and accessible name. **Required.** |
| `name` | `name` | `string` | — | Form field name. |
| `value` | `defaultValue` | `string` | `''` | Initial value. `form.reset()` restores it. |
| — | `value` | `string` | `''` | Current value, exactly as typed. |
| `hint` | `hint` | `string` | — | Help text below the field. |
| `purpose` | `purpose` | `'current' \| 'new'` | `'current'` | Signing in, or choosing a new password. |
| `minlength` | `minLength` | `number` | `8` | Minimum length, with `purpose="new"`. Counted in characters, so `🔒` counts once. |
| `maxlength` | `maxLength` | `number` | — | Maximum length, with `purpose="new"`. Longer passwords show an error; they are never cut. |
| `requirements` | `requirements` | `string` | `''` | Extra rules, with `purpose="new"`: any of `lowercase uppercase digit symbol`. |
| `required` | `required` | `boolean` | `false` | The value must not be empty. |
| `disabled` | `disabled` | `boolean` | `false` | Also applies inside a disabled `<fieldset>`. The value is not submitted. |
| `readonly` | `readOnly` | `boolean` | `false` | The value cannot be edited but is still submitted. |
| `autocomplete` | `autocomplete` | `string` | from `purpose` | `current-password` or `new-password`. |

**Which rules to use.** The current NIST guidelines ([SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)) ask for at least **15 characters when the password is the only factor**, and at least 8 when it is part of multi-factor authentication. They forbid composition rules such as "one uppercase letter and one symbol", and recommend allowing at least 64 characters. Prefer `minlength` alone; `requirements` is there for backends that still demand classes. Letters from scripts without case, such as Chinese or Arabic, can never meet `lowercase` or `uppercase`.

**Read-only properties**

| Property | Type | Description |
| --- | --- | --- |
| `revealed` | `boolean` | Whether the password is shown. Also settable. |
| `requirementsMet` | `boolean` | Whether every requirement is met. Always `true` when signing in. |
| `form` | `HTMLFormElement \| null` | The form the field belongs to. |
| `validity`, `validationMessage`, `willValidate` | | Same as on native inputs. |

**Methods:** `checkValidity()`, `reportValidity()`, `setCustomValidity(message)` and `focus()`, which focuses the field.

### Text and translations

Every text can be replaced. `{minlength}` and `{maxlength}` are replaced by the numbers.

| Attribute | Default |
| --- | --- |
| `text-show` / `text-hide` | `Show` / `Hide` |
| `text-show-label` / `text-hide-label` | `Show password` / `Hide password` |
| `text-shown` / `text-hidden` | `Your password is shown` / `Your password is hidden` |
| `text-requirements` | `Your password must have:` |
| `text-rule-length` | `At least {minlength} characters` |
| `text-rule-lowercase` | `A lowercase letter` |
| `text-rule-uppercase` | `An uppercase letter` |
| `text-rule-digit` | `A number` |
| `text-rule-symbol` | `A symbol, like ! or #` |
| `text-rule-met` / `text-rule-unmet` | `done` / `not yet` |
| `text-all-met` | `All requirements met` |
| `text-caps-lock` | `Caps Lock is on` |
| `text-required` | `Enter a password` |
| `text-unmet` | `Your password does not meet all the requirements` |
| `text-too-long` | `Use {maxlength} characters or fewer` |

`text-show-label` and `text-hide-label` are the button's accessible names, so keep the visible word in them. `text-shown`, `text-hidden`, `text-rule-met`, `text-rule-unmet` and `text-all-met` are only read by screen readers.

### Events

All events bubble and cross shadow roots.

| Event | `detail` | Fires when |
| --- | --- | --- |
| `input` | `{ value, requirementsMet }` | The user changes the password. |
| `change` | `{ value, requirementsMet }` | The field loses focus with a different value. |
| `revealchange` | `{ revealed }` | The password is shown or hidden, by the user or from code. |

The inner input's own `input` and `change` events are stopped, so each event reaches your listeners once. Like on native inputs, setting `value` from code fires neither. Inside the listeners, the value and validity are already up to date.

### Form integration

The inner field is a native password input, so the browser handles it like any other:

- The form submits the password under `name`, exactly as typed.
- `required`, a password that misses a rule and one over `maxlength` block submission and show the message from `text-required`, `text-unmet` or `text-too-long`.
- `setCustomValidity(message)` shows a server-side error at once. The next edit, `setCustomValidity('')` or `form.reset()` clears it.
- `Enter` submits the form. `form.reset()` restores the `value` attribute. A disabled `<fieldset>` disables the field.
- The browser does not restore the password when the user navigates back to the page.
- The password is hidden again before the form's `submit` event, on reset and when the page is left, so it never travels or stays on screen as plain text. `form.submit()` skips the `submit` event, so hide it yourself first (`element.revealed = false`) if you call it.

Errors appear when the user leaves the field after typing, or on submit. They update as the user fixes the password.

### CSS custom properties

Set them on the element or on any ancestor. They are the same variables as [Phone](./phone#css-custom-properties) and [OTP](./otp#css-custom-properties), so one theme covers every Teselia component.

| Property | Purpose | Light | Dark |
| --- | --- | --- | --- |
| `--tes-font-family` | Font family | inherited | inherited |
| `--tes-font-size` | Font size | inherited | inherited |
| `--tes-color-text` | Label, password and met rules | `#1f2328` | `#e8eaee` |
| `--tes-color-muted` | Hint and unmet rules | `#59636e` | `#a3adba` |
| `--tes-color-bg` | Field background | `#ffffff` | `#16181d` |
| `--tes-color-border` | Field border | `#7d8590` | `#7f8a99` |
| `--tes-color-accent` | Show/hide button | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-hover` | Hovered button | `#eef3fb` | `#232a36` |
| `--tes-color-focus` | Focus ring | `#0b5fcc` | `#7aa7ff` |
| `--tes-color-error` | Error border and message | `#c4232b` | `#ff8a80` |
| `--tes-color-success` | Check mark of a met rule | `#1f7a3a` | `#4cc26a` |
| `--tes-radius` | Corner radius | `0.375rem` | `0.375rem` |
| `--tes-space` | Base spacing | `0.5rem` | `0.5rem` |

The dark defaults apply when the page uses a dark `color-scheme`. Every default pair meets WCAG 2.2 AA contrast; if you change the colors, keep text at 4.5:1 and borders, icons and the focus ring at 3:1.

### Classes

There is no shadow root, so there is no `::part()`. Target these classes instead. The component's own rules have zero specificity, so a single class of yours is enough.

| Class | Element |
| --- | --- |
| `tes-password__field` | The whole component. |
| `tes-password__label` | The visible label. |
| `tes-password__control` | The box with the input and the button. |
| `tes-password__input` | The password input. |
| `tes-password__toggle` | The show/hide button. |
| `tes-password__hint` | The help text. |
| `tes-password__caps-lock` | The Caps Lock warning. |
| `tes-password__requirements` | The requirements, with their title. |
| `tes-password__requirement` | Each rule. |
| `tes-password__requirement--met` | A rule that is met, together with `tes-password__requirement`. |
| `tes-password__error` | The error message. |

### Custom states

Combine them with `:state()` and the classes.

| State | Set while |
| --- | --- |
| `:state(invalid)` | An error message is shown. Like `:user-invalid`, not on page load. |
| `:state(empty)` | The field is empty. |
| `:state(revealed)` | The password is shown. |
| `:state(requirements-met)` | Every requirement of a new password is met. |
| `:state(caps-lock)` | The Caps Lock warning is shown. |

```css
tes-password:state(requirements-met) .tes-password__control {
  border-color: #1f7a3a;
}

tes-password:state(invalid) .tes-password__label {
  color: #c4232b;
}
```

### Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari.

## Accessibility

`<tes-password>` is built to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA out of the box, and it is tested with the keyboard first. You only need to give it a `label`.

### Keyboard

| Key | Action |
| --- | --- |
| Typing, editing, `Ctrl` / `⌘` + `V` | Native text field behaviour. Nothing is blocked. |
| `Enter` in the field | Submits the form, after hiding the password. |
| `Tab` | Moves from the field to the show/hide button, then out. |
| `Space` / `Enter` on the button | Shows or hides the password. Focus stays on the button. |

### Screen readers

- The field is read with its label, then the hint, the requirements with their state ("At least 12 characters, not yet"), the Caps Lock warning and any error.
- Requirements are announced only when one changes, once typing pauses: "At least 12 characters, done", or "All requirements met". Keystrokes that change no rule, and changes made from code, stay silent.
- The button is read as "Show password" or "Hide password", and pressing it announces "Your password is shown" or "hidden".
- Caps Lock is announced once when it turns on. Errors are read when they appear, and the field is marked as invalid.

### WCAG 2.2 criteria

| Criterion | In practice |
| --- | --- |
| 1.3.1 Info and Relationships | The label names the field, and the hint, requirements, Caps Lock warning and errors are tied to it. |
| 1.3.5 Identify Input Purpose | `autocomplete` tells browsers and password managers whether to fill or to generate. |
| 1.4.1 Use of Color | Met rules change their icon from a circle to a check mark and their hidden text, and errors add a thicker border. |
| 1.4.3 / 1.4.11 Contrast | Text has at least 4.5:1 contrast, and borders, icons and the focus ring at least 3:1, in light and dark themes. |
| 1.4.10 Reflow / 1.4.12 Text Spacing | It fits a 320px wide page, long texts wrap, and nothing is clipped with increased spacing. |
| 2.1.1 / 2.1.2 Keyboard, No Keyboard Trap | Everything works with the keyboard, and `Tab` always leaves. |
| 2.4.7 Focus Visible | The field and the button show a focus ring, also in Windows high contrast mode. |
| 2.5.8 Target Size | The field is 44px tall and the button at least 44px wide. |
| 3.2.2 On Input | Typing never submits the form or moves focus. |
| 3.3.1 / 3.3.3 Error Identification and Suggestion | Errors say what is wrong, and the list says which rule is missing. They appear after you leave the field, not while you type. |
| 3.3.2 Labels or Instructions | A visible label, an optional hint and the requirements before you type. |
| 3.3.7 Redundant Entry | No "confirm password" field: the show button lets people check what they typed. |
| 3.3.8 Accessible Authentication (Minimum) | Paste and password managers always work, and the password can be shown. |
| 4.1.2 Name, Role, Value | A native password input and a native button. |
| 4.1.3 Status Messages | Show/hide, requirement changes and Caps Lock are announced without moving focus. |

It also adapts to Windows high contrast mode (`forced-colors`), has no animations, and follows right-to-left pages: the button moves to the left.

### Password managers

Tested with a test page that compares a plain field, a field inside a shadow root, and the light DOM field this component uses:

| Manager | Save | Fill | Generate |
| --- | --- | --- | --- |
| Chrome and Brave (Windows) | Yes | Yes | Not offered in this setup* |
| Firefox (Windows) | Yes | Yes | Yes |
| iCloud Keychain (Safari, iOS) | Yes | Yes | Yes, following `passwordrules` |

\* Chrome only suggests passwords when the browser is signed in to a Google account with password sync, and Brave removes the feature. A plain field behaved the same.

Firefox did not fill the password inside a shadow root, which is why this component has none.

### Known limitations

- **Page styles reach the field.** See [styling](#styling-no-shadow-dom).
- **External labels and descriptions.** A `<label for>` pointing at the element does not name the inner field. Use the `label` and `hint` attributes.
- **No breach check.** The component never makes network requests. Check passwords on your server and report with `setCustomValidity()`, as in the example above.
- **`form.submit()`** skips the `submit` event, so the password is not hidden automatically before it.
- **Caps Lock on mobile.** Mobile keyboards do not report Caps Lock, so the warning never shows there.
- **Case rules and scripts without case.** See [which rules to use](#attributes-and-properties).

### Testing

Every change runs the automated suite in Chromium, Firefox and WebKit: typing and pasting through the real clipboard, the show/hide button and when it hides again, requirements and their announcements, Caps Lock, validation, events, `v-model`, the form lifecycle, contrast of the default colors in both themes, high contrast, right-to-left pages, narrow containers, text spacing, and an [axe-core](https://github.com/dequelabs/axe-core) scan.

Manual testing with real devices and assistive technology:

| What | Browser | Result |
| --- | --- | --- |
| Password managers: save, fill, generate | Chrome, Brave, Firefox, Safari (iOS) | Passed on the test page (above). Pending with the final component. |
| Keyboard only | Firefox, Brave (Windows) | Pending |
| NVDA | Firefox, Brave (Windows) | Pending |
| VoiceOver | Safari (iOS) | Not tested yet |
| High contrast mode | Edge (Windows) | Pending |
| 200% and 400% zoom, 320px width, text spacing | Chrome | Pending |

The full specification is in the [design document](https://github.com/caicesardev/teselia/blob/main/design/password.md#5-accessibility-specification).

# `@teselia/password` — design document

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-10-07 |
| **Target release** | `1.0.0` on **2026-11-04** |
| **Custom element** | `<tes-password>` |

An accessible password input with a show/hide button and, for new passwords, a list of requirements that are checked as the person types. It renders a native password input in the light DOM, so it submits with any native `<form>` and keeps working with browser and third-party password managers (D2).

This document records the decisions taken before writing code, the options that were considered and why they were discarded. If a decision changes during implementation, update this file in the same pull request.

---

## 1. Goals and non-goals

### Goals

- **WCAG 2.2 AA by default**, including **3.3.8 Accessible Authentication**: paste and password managers always work, nothing blocks them, and people can see what they typed.
- **Works with password managers.** Browser managers (Chrome, Edge, Firefox, Safari and iCloud Keychain) and extensions must be able to fill the field, offer to save on submit, and generate a new password. **This is the biggest risk of the component** (D2).
- **Helps people get it right the first time.** Requirements are visible before typing, checked while typing, and announced without noise. A Caps Lock warning prevents a common silent error.
- **Keyboard-first**, **framework-agnostic**, a **native form citizen** and **small** (no runtime dependency besides Vue), like `@teselia/phone` and `@teselia/otp`.

### Non-goals (for the whole component, not only v1)

- Any network request, including breach checks against Have I Been Pwned (decided with the maintainer: no network, like phone and OTP). The server can check and report with `setCustomValidity()`, and the docs will show how.
- Generating passwords. Password managers already do it, better.
- Hashing, storing or comparing passwords. That belongs to the server.
- A "confirm password" field (D5).

---

## 2. Decisions

### D1. Tag name: `<tes-password>`, package `@teselia/password`

- "Password input" is what people search for.
- It is registered on import, with a `define(tagName = 'tes-password')` export, like the other components.

**Discarded:** `<tes-password-field>` (longer, and no other component uses `-field`) and `<tes-secret>` (vague).

### D2. Where the real `<input>` lives: shadow DOM if password managers support it, light DOM otherwise

Phone and OTP keep their inputs in the shadow root. For OTP, #69 proved that iOS offers one-time codes to an input inside a shadow root. **Passwords are different and riskier:**

- A password manager must **find** the field to fill it, **detect the submission** to offer saving, and recognize **new-password** fields to offer a generated password.
- Managers look for `<input type="password">` elements, usually inside a `<form>`. An input inside a shadow root is invisible to `document.querySelectorAll`, and its form owner is not the page's form: the custom element is. Some extensions now walk open shadow roots; browser managers work inside the browser engine and may or may not. **We do not know, and guessing wrong makes the component harmful**: people who cannot save or fill passwords are pushed towards weak, reused passwords.
- The OTP manual test (#82) already showed a manager that only filled `type="password"` fields, so managers are picky.

**Decision: a spike first (week 1), and its results decide.** The spike page has three fields: a plain light-DOM `<input type="password">` (control), a minimal form-associated element with the input in its shadow root, and a light-DOM input rendered by a custom element (`<tes-password>` with `shadowRoot: false` or a slotted input). For each, it checks **fill**, **save on submit** and **generate** in:

| Manager | Where |
| --- | --- |
| Chrome / Edge built-in | Windows |
| Firefox built-in | Windows |
| iCloud Keychain | Safari on iOS (and macOS if available) |
| Bitwarden or 1Password extension | whichever the maintainer uses |

- **If the shadow-DOM input works** in the browser managers (fill and save) → keep the suite's architecture.
- **If it does not** → the input lives in the light DOM. Two ways, chosen by the spike:
  - **Slotted input:** the author writes `<tes-password><input type="password" name="password"></tes-password>`. It works without JavaScript, managers see a normal field, and the form submits it natively, so `ElementInternals` is not needed. The cost: the API differs from phone and OTP, and the styling of the input must reach the light DOM.
  - **Rendered light DOM:** the component renders its own `<input>` as a child. The same API as the other components, but its styles leak both ways, so they need careful scoping.
- Whatever wins, the docs say which managers were tested, with results, like the OTP docs.

✅ **Spike done in #110 (2026-10-07), on the maintainer's devices, with the page from draft PR #127.**

| Manager | A. light DOM | B. shadow DOM | C. rendered light DOM |
| --- | --- | --- | --- |
| Chrome / Brave (Windows) | save, fill | save, fill | save, fill |
| Firefox (Windows) | save, fill, generate | save, generate, **no fill** | save, fill, generate |
| iCloud Keychain (Safari, iOS) | save, fill, generate | save, fill, generate | save, fill, generate |

- Chrome and Brave did not generate even for the control: Chrome only suggests passwords when signed in to a Google account with password sync, and Brave removes the feature.
- **Safari honours `passwordrules`** in every case: with `allowed: lower, digit; minlength: 10; maxlength: 12`, it generated lowercase letters and digits of that length.
- **Firefox does not fill a password input inside a shadow root.** It fills the username next to it and leaves the password empty.

**Decision: the component renders its whole field in the light DOM** (option C), chosen with the maintainer over a slotted, author-written input. Usage stays the same as the other components: `<tes-password label="Password" name="password">`.

- **Everything goes to the light DOM, not only the input.** The label, hint, requirements, Caps Lock notice and error are linked to the input with `for` and `aria-describedby`. Those references cannot point from the light DOM into a shadow root.
- **Not form-associated.** The native input carries `name` and is a normal form control: the form submits it, `form.reset()` restores it, a disabled `<fieldset>` disables it, and validity and `setCustomValidity` go to it. This is what managers expect, and it is simpler than `ElementInternals`. The element's `value`, `validity`, `checkValidity()` and similar members delegate to the input.
- **Ids are unique per instance**, because they now share the page's id space.
- **Styles** are one stylesheet for the whole document (adopted once when the element is defined). Every selector is wrapped in `:where()` so it has zero specificity, and any page style can override it. Shared tokens work as before.
- **No `::part()`**: it only exists for shadow trees. Documented classes replace the parts (`tes-password__input`, `tes-password__toggle`…). `:state()` works, because custom states live on the element.
- **Known cost:** global page styles (a CSS reset, `input { … }`) also reach the inner elements. The docs will say so.
- Draft PR #127 is closed and never merged.
- ✅ **Scaffold done in #111** (`test/browser/element.test.ts`, three engines, mutation-checked).
  - `defineCustomElement(component, { shadowRoot: false })`. Vue 3.5 then renders into the element itself and **does not inject SFC styles** (it only warns), so the component is a plain `.vue` file and `src/tes-password.css` is imported with `?inline`. `define()` adopts it into `document.adoptedStyleSheets` once per tag name, rewriting `:where(tes-password` to the custom tag.
  - `inheritAttrs: false`: in the light DOM, every attribute that is not a prop (`value`, `class`, `data-*`) would otherwise land on the root `<div>`.
  - **`value` is not a Vue prop.** Vue would define its own `value` property on the element and replace the class getter. The element reads the input; the `value` attribute reaches the template through `$attrs` and is bound with `:value.attr`, so it is the input's native default value and `form.reset()` restores it natively.
  - A value set before the element is connected (Vue's `v-model` can do that) is kept and applied right after `super.connectedCallback()`, which mounts synchronously.
  - Ids come from a module counter (`src/core/ids.ts`). Vue's `useId()` creates one app per custom element, so every instance would get the same id.
  - `focus()` focuses the input; there is no `delegatesFocus` without a shadow root.
  - `test/unit/tokens.test.ts` fails if the token declarations drift from `packages/shared/src/base.css`.

**Discarded:**

- **Shadow DOM (B):** Firefox cannot fill it.
- **Slotted, author-written input:** it works without JavaScript, but it breaks the suite's API, and authors would repeat `name`, `autocomplete` and `passwordrules` on the input.

### D3. Two purposes: signing in and choosing a new password

`purpose="current"` (default) and `purpose="new"`:

| | `current` | `new` |
| --- | --- | --- |
| `autocomplete` | `current-password` | `new-password` |
| Requirements list | none | shown (D4) |
| Length validation | none: old passwords may predate the rules | `minlength`, and `maxlength` if set |
| Typical page | Sign in | Sign up, change or reset password |

- `autocomplete` can still be overridden, but the right token is chosen for people who forget it. It is what tells managers whether to fill or to generate.
- **Discarded:** two components (`<tes-password>` and `<tes-new-password>`). Most of the code is shared, and switching an attribute is easier than switching a tag.

### D4. Requirements: rules, only a minimum length by default

Decided with the maintainer: a configurable list of rules, **only a minimum length by default**, with no strength meter.

- **Why length only.** NIST SP 800-63B recommends a minimum length and no composition rules (no forced uppercase, digits or symbols), because they push people to predictable patterns like `Password1!`. Length is what makes a password hard to guess.
- **Default `minlength`: 8.** NIST's current revision asks for **15** when the password is the only factor, and 8 when it is part of multi-factor authentication. The docs explain this and recommend `minlength="15"` without MFA. *(Verify the exact NIST wording when writing the docs.)*
- **Opt-in rules**, because many backends require them: `requirements="lowercase uppercase digit symbol"` (any subset, space-separated). Each one is a visible list item.
  - "Symbol" means any character that is not a letter, digit or space, so non-Latin scripts are not rejected for missing "symbols".
  - "Lowercase" and "uppercase" use Unicode properties (`\p{Ll}`, `\p{Lu}`), so `ñ` and `É` count.
- **No strength meter.** Meters based on heuristics (the alternative was a home-made score) contradict the rules ("strong" but rejected, or "weak" but accepted). They also add another moving part for screen readers. The zxcvbn-style estimator was discarded for size (about 400 KB).
- **`passwordrules`.** Safari reads the `passwordrules` attribute to generate passwords that meet the site's rules. The component writes it from `minlength`, `maxlength` and `requirements`. The spike checks that Safari honours it where the input lives (D2).
- **How the list behaves** (§5.3): it is visible before typing, linked to the input, and each item shows its state with an icon shape plus text, not color alone.
- ✅ **Rules implemented in #112** (`src/core/rules.ts`, `test/unit/rules.test.ts`, mutation-checked):
  - **Length counts Unicode code points** (`[...value].length`), as NIST asks, so `🔒` counts as one character. Native `minlength` counts UTF-16 units and would count it as two, so the component validates length itself.
  - Lowercase is `\p{Ll}`, uppercase `\p{Lu}` or titlecase `\p{Lt}`, digit `\p{Nd}` (any script: `٧`, `７`), symbol anything that is not a letter, number or white space (`€`, `🔒`, `、`).
  - **Known limit:** letters from scripts without case (Chinese, Arabic, Hebrew…) meet neither `lowercase` nor `uppercase`. Another reason to avoid case rules; the docs will say so.
  - Invalid `minlength` falls back to 8. A `maxlength` below `minlength` is ignored. Unknown requirement names are reported, for a dev warning.
  - `passwordrules` always ends with `allowed: lower, upper, digit, special;`. Without it, Safari would only use the required classes, so `required: lower` alone would produce a lowercase-only password.

### D5. No "confirm password" field

Decided with the maintainer. With a show button, people can check what they typed. Asking twice adds work and errors, especially for people with cognitive or motor disabilities, and GOV.UK advises against it. Pages that still want one can place two components.

### D6. Show/hide button: visible text

Decided with the maintainer: a text button, **"Show"** / **"Hide"**, inside the field at the inline end, as in GOV.UK.

- **Why text.** The eye icon is often misread (is the open eye the current state or the action?), and text survives high contrast mode, translation and zoom.
- **Semantics.** A `<button type="button">` whose visible text says the action. Its accessible name adds the noun: "Show password" / "Hide password" (`text-show-label`, `text-hide-label`). **No `aria-pressed`**: when the name changes with the state, `aria-pressed` would announce the state twice ("Hide password, pressed").
- **Announcement.** Toggling announces "Your password is shown" / "Your password is hidden" through the shared announcer, because some screen readers do not re-read a button whose name changed under focus. Focus stays on the button.
- **Security.**
  - The input switches back to `type="password"` **before the form is submitted** (any submission: button, `Enter`, `requestSubmit()`), on `form.reset()`, and on `pagehide`. A field submitted as `type="text"` can end up in the browser's autofill history.
  - `spellcheck="false"`, `autocapitalize="off"` and `autocorrect="off"` are always set. With the text visible, enhanced spellcheck services could otherwise send the password over the network.
- The button is at least 44px tall, like the field, and never covers the text: the input gets inline padding for it.
- The button is **not** shown while the field is `disabled`. It stays usable while `readonly`, which is harmless.

### D7. Caps Lock warning

When Caps Lock is on while the field has focus (`KeyboardEvent.getModifierState('CapsLock')`), a visible notice says "Caps Lock is on" and is linked to the input. It is also announced once when it turns on.

- It prevents a frequent, invisible error (WCAG 3.3 Input Assistance), and it costs a few lines.
- Browsers only know the Caps Lock state after a key event, so the notice appears on the first keystroke, not on focus.
- Mobile keyboards do not report it, so nothing shows there.

### D8. Value, form state and paste

- **The value is submitted as typed.** No trimming, no normalization: changing a password silently can lock people out. Unicode normalization, if any, is the server's job.
- **No truncation.** There is no `maxlength` on the inner input, because it would cut a pasted or generated password silently, the same lesson as OTP #70. If `maxlength` is set, a longer value is an error (`tooLong`) with a message, never a cut.
- **Paste and drop are never blocked.**
- **Form state.** ~~`setFormValue(value, '')`~~ The field is a native password input (D2), so browsers already **do not restore the password** on back/forward navigation, and autofill works natively.

### D9. Visual design

- The same field as phone's number field: 2.75rem (44px) tall, 1px border that becomes 2px in the error state, the same `--tes-*` tokens.
- The show button sits inside the field at the inline end, so it mirrors in RTL. The password text keeps the page direction, like a native password field.
- The requirements list sits below the field: one line per rule, with a check mark or an empty circle (different shapes, so not color alone) and the text. A met rule uses a new shared token, `--tes-color-success`. Its default must meet 3:1 against the background, like the other non-text tokens.
- No animation.

### D10. Shared code

Reused from `packages/shared`: the announcer, custom states, the tokens and the test support. **Not needed** after D2: implicit submission (a native input in a form already submits on `Enter`) and the form-associated plumbing. `base.css` targets `:host`, which does not exist without a shadow root, so this component declares the same tokens on `tes-password` itself. If a second light DOM component appears, that part moves to `shared`.

`--tes-color-success` goes into `base.css` with its contrast checks in `REQUIRED_TOKEN_CONTRASTS`, so it is ready for the whole suite.

---

## 3. v1 scope

### In

- Everything in D1–D10.
- `label` (required), `hint`, `purpose`, `minlength`, `maxlength`, `requirements`, `required`, `disabled` (also from a `<fieldset>`), `readonly`, `form.reset()`, `Enter` to submit, `setCustomValidity()`.
- The show/hide button, the requirements list, the Caps Lock warning.
- Events (§4.2) and validation (§5.4).
- Theming with tokens, parts and custom states, `forced-colors`, RTL pages and reflow.
- Docs page with a demo (sign in and sign up), API tables, examples (HTML, Vue, React), accessibility notes, password manager results and sizes. npm README.
- Unit tests for the rules, and browser tests in Chromium, Firefox and WebKit with axe.

### Out (explicitly)

- Breach checks, strength meters, password generation and confirmation fields (§1, D4, D5).
- Passkeys and WebAuthn. They are a different flow, not a field.
- Remembering the show/hide choice between visits.

---

## 4. Public API

### 4.1 Attributes and properties

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | — | Visible label and accessible name. **Required.** |
| `name` | `name` | `string` | — | Form field name. |
| `value` | `defaultValue` | `string` | `''` | Initial value. `form.reset()` restores it. Rarely useful for passwords. |
| — | `value` | `string` | `''` | Current value, as typed. |
| `hint` | `hint` | `string` | — | Help text below the field. |
| `purpose` | `purpose` | `'current' \| 'new'` | `'current'` | Signing in, or choosing a new password (D3). |
| `minlength` | `minLength` | `number` | `8` | Minimum length, only with `purpose="new"`. |
| `maxlength` | `maxLength` | `number` | — | Maximum length, only with `purpose="new"`. Validated, never truncated (D8). |
| `requirements` | `requirements` | `string` | `''` | Extra rules: any of `lowercase uppercase digit symbol`, only with `purpose="new"`. |
| `required` | `required` | `boolean` | `false` | The value must not be empty. |
| `disabled` | `disabled` | `boolean` | `false` | Also inherited from a disabled `<fieldset>`. |
| `readonly` | `readOnly` | `boolean` | `false` | Not editable, still submitted. |
| `autocomplete` | `autocomplete` | `string` | from `purpose` | `current-password` or `new-password`. |

**Texts.** `{minlength}` and `{maxlength}` are replaced by the numbers.

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
| `text-required` | `Enter a password` |
| `text-unmet` | `Your password does not meet all the requirements` |
| `text-too-long` | `Use {maxlength} characters or fewer` |
| `text-caps-lock` | `Caps Lock is on` |

**Read-only properties:** `revealed` (boolean, also settable from code), `requirementsMet` (boolean), `form`, `validity`, `validationMessage`, `willValidate`.

**Methods:** `checkValidity()`, `reportValidity()`, `setCustomValidity(message)`, `focus()`.

### 4.2 Events

All events bubble and are composed.

| Event | `detail` | When |
| --- | --- | --- |
| `input` | `{ value, requirementsMet }` | On every user change of the value. |
| `change` | `{ value, requirementsMet }` | When the native input fires `change`: on blur with a different value, or when `Enter` submits the form. |
| `revealchange` | `{ revealed }` | When the password is shown or hidden, by the user or from code. |

Like native inputs, setting `value` from code fires neither `input` nor `change`. Because the input is in the light DOM (D2), its native `input` and `change` events would reach the page too. The element stops them at itself and dispatches its own `CustomEvent` with the same name instead, so a listener on the element or above it gets each event once, with `detail`. The event is not called `visibilitychange`, because a composed, bubbling event with that name would reach the page's `document.visibilitychange` listeners.

### 4.3 Form integration

The inner `<input type="password">` is a normal form control (D2), so submission, reset, disabled fieldsets and history navigation are native. The component:

- copies `name` to the input, and keeps `value` and `defaultValue` in sync with it;
- sets the input's validity with `setCustomValidity`, in this order:
  - a missing value → `text-required`
  - a password that is too short or misses a rule → `text-unmet` (the list says which ones)
  - a password over `maxlength` → `text-too-long`
  - a message from `setCustomValidity` on the element
- hides the password before the form's `submit` event, on `reset` and on `pagehide`.

### 4.4 CSS custom properties

All the shared `--tes-*` tokens, plus a new shared one:

| Property | Purpose | Light | Dark |
| --- | --- | --- | --- |
| `--tes-color-success` | Met requirement | to be chosen, ≥ 3:1 | to be chosen, ≥ 3:1 |

### 4.5 Classes (instead of parts)

There is no shadow root, so `::part()` does not apply (D2). These documented classes take its place. The component's own rules have zero specificity, so any page selector wins:

`tes-password__field`, `__label`, `__control` (the input and the button), `__input`, `__toggle`, `__hint`, `__requirements` (the list), `__requirement`, `__requirement--met`, `__caps-lock`, `__error`.

### 4.6 Custom states

- `:state(invalid)`: an error is shown (follows the visible error, like the other components).
- `:state(empty)`: no characters.
- `:state(revealed)`: the password is shown.
- `:state(requirements-met)`: every requirement is met (`purpose="new"`).
- `:state(caps-lock)`: the Caps Lock warning is shown.

---

## 5. Accessibility specification

### 5.1 WCAG 2.2 AA criteria that shape the design

| Criterion | How it applies |
| --- | --- |
| 1.3.1 Info and Relationships | One labelled input. The hint, requirements, Caps Lock notice and error are linked with `aria-describedby`. |
| 1.3.5 Identify Input Purpose | `autocomplete` from `purpose`. |
| 1.4.1 Use of Color | Met rules change shape (check vs circle) and text, not only color. Errors add a thicker border and a message. |
| 1.4.3 / 1.4.11 Contrast | Shared tokens, plus `--tes-color-success` at 3:1. |
| 1.4.10 Reflow / 1.4.12 Text Spacing | The button never covers the text; the list wraps. No clipping at 320px or with the spacing override. |
| 2.1.1 / 2.1.2 Keyboard | The input, then the button, in tab order. |
| 2.4.7 Focus Visible | Both the input and the button show focus, also in `forced-colors`. |
| 2.5.8 Target Size | The button is at least 44px tall and 44px wide. |
| 3.2.2 On Input | Typing never submits or moves focus. |
| 3.3.1 / 3.3.3 Error Identification, Suggestion | The error says what is wrong; the list says which rule is missing. |
| 3.3.2 Labels or Instructions | Visible label and requirements before typing. |
| 3.3.7 Redundant Entry | No confirm field (D5). |
| 3.3.8 Accessible Authentication (Minimum) | Paste and password managers always work; the show button lets people check what they typed. |
| 4.1.2 Name, Role, Value | A native password input and a native button. |
| 4.1.3 Status Messages | Show/hide, requirement changes and Caps Lock are announced without moving focus. |

### 5.2 Keyboard

| Key | Action |
| --- | --- |
| Typing, editing, `Ctrl`/`⌘` + `V` | Native text field behaviour. Nothing is blocked. |
| `Enter` in the input | Submits the form, natively, after hiding the password. |
| `Tab` | From the input to the show button, then out. |
| `Space` / `Enter` on the button | Shows or hides the password. Focus stays on the button. |

### 5.3 Screen readers

- The input is read as "Password, edit, protected" (or the label), followed by the hint, the requirements and any error.
- The requirements are read with the field. Each item carries its state in text, for example "At least 8 characters, done" / "…, not yet", in a visually hidden suffix (`text-rule-met` / `text-rule-unmet`, to add to §4.1 during implementation).
- **While typing**, once typing pauses (the shared 500 ms announcer), only **changes** are announced: "At least 8 characters, done", or "All requirements met". Nothing is announced for keystrokes that change no rule, and nothing per character.
- Show/hide announces "Your password is shown/hidden". Caps Lock announces once when it turns on.

### 5.4 Error messaging

The same rules as the other components: no errors while typing; they appear on blur after editing and on submit; they update live and clear as soon as the value is valid. `setCustomValidity` errors show immediately and are cleared by the next edit.

### 5.5 Manual testing matrix

| What | Browser | OS |
| --- | --- | --- |
| Keyboard only | Chrome, Firefox | Windows |
| NVDA | Firefox, Brave | Windows |
| Password managers: fill, save, generate (D2) | Chrome, Edge, Firefox, Safari | Windows, iOS |
| Password manager extension (Bitwarden or 1Password) | any | any |
| Windows High Contrast (`forced-colors`) | Edge | Windows |
| 200 % and 400 % zoom, 320 px viewport | Chrome | any |

---

## 6. Definition of done and plan

### Definition of done for `1.0.0`

- [ ] Everything in §3 "In" is implemented.
- [ ] The password manager spike is done and D2 is final, with results in the docs.
- [ ] Unit tests cover the rules (lengths, Unicode letters, symbols in other scripts, `passwordrules` output).
- [ ] Browser tests cover show/hide (including hiding before submit and on reset), requirements and announcements, Caps Lock, paste, form submission/reset/validity and events, in Chromium, Firefox and WebKit.
- [ ] axe reports zero violations in every rendered state (empty, typing, requirements met, invalid, revealed, Caps Lock, disabled, readonly).
- [ ] The manual testing matrix (§5.5) is completed, and results are on the docs page.
- [ ] Bundle size measured and published in the README and docs.
- [ ] `pnpm pack` succeeds before the release.
- [ ] `@teselia/password@1.0.0` published to npm (only after explicit approval).

### Milestones

| Week | Dates | Work |
| --- | --- | --- |
| 1 | 10-08 → 10-14 | **Spike: password managers and the input's location (D2).** Package and docs scaffold. |
| 2 | 10-15 → 10-21 | Field, show/hide, purposes, requirements, Caps Lock, validation, events. |
| 3 | 10-22 → 10-28 | Theming, `forced-colors`, RTL, reflow, docs page and demo, README. |
| 4 | 10-29 → 11-04 | Manual testing, fixes, release **2026-11-04**. |

---

## 7. Open questions

1. ~~**Do password managers fill, save and generate for an input inside a shadow root?**~~ ✅ Not Firefox, which does not fill it. Resolved in #110: the field renders in the light DOM (D2).
2. ~~**Does Safari honour `passwordrules`?**~~ ✅ Yes, in the light DOM and in a shadow root (#110).
3. **Default `minlength`: 8 or 15?** 8 is proposed (NIST's value with multi-factor authentication). It can change after reading the current NIST text closely.
4. **Should the requirements list announce progress at all**, or only be read with the field and at errors? §5.3 proposes announcing changes after a pause; NVDA testing will tell whether it helps or is noise.

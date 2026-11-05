# @teselia/password

## 1.0.1

### Patch Changes

- 8cf389c: Fix missing colors in the published builds. The build lowered `light-dark()` to variables that only exist under a `color-scheme` declaration, so every default color was invalid: fields had no border or background, and the accent and error colors were lost. The npm and CDN builds now keep `light-dark()`, which every supported browser understands. The docs site was not affected, because it uses the source code.

## 1.0.0

### Major Changes

- First stable release of `<tes-password>`: an accessible password field that works with password managers. A native `<input>` in the light DOM keeps saving, filling and generating passwords working in Chrome, Firefox and Safari, and the form submits, resets and validates natively. It includes a show/hide button that hides the password again before the form is submitted, requirements with their state announced once typing pauses, a Caps Lock warning, `setCustomValidity()` for server errors, `purpose="new"` for sign-up forms with `passwordrules`, and theming through CSS custom properties and documented classes. It meets WCAG 2.2 AA and follows NIST SP 800-63B-4: a single length rule by default (at least 8 characters, no maximum), no composition rules unless you add them, and paste allowed.

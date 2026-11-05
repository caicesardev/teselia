# @teselia/password

## 1.0.0

### Major Changes

- First stable release of `<tes-password>`: an accessible password field that works with password managers. A native `<input>` in the light DOM keeps saving, filling and generating passwords working in Chrome, Firefox and Safari, and the form submits, resets and validates natively. It includes a show/hide button that hides the password again before the form is submitted, requirements with their state announced once typing pauses, a Caps Lock warning, `setCustomValidity()` for server errors, `purpose="new"` for sign-up forms with `passwordrules`, and theming through CSS custom properties and documented classes. It meets WCAG 2.2 AA and follows NIST SP 800-63B-4: a single length rule by default (at least 8 characters, no maximum), no composition rules unless you add them, and paste allowed.

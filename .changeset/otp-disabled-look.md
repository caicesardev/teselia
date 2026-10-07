---
'@teselia/otp': patch
---

A disabled field now looks disabled, whether through the `disabled` attribute or a disabled `<fieldset>`: the cells use the muted text color and a muted fill, and the field shows a `not-allowed` cursor. In Windows high contrast mode the cells use the system `GrayText` color. Before, a disabled field looked exactly like an enabled one.

---
'@teselia/phone': patch
---

A disabled field now looks disabled, whether through the `disabled` attribute or a disabled `<fieldset>`: both controls use the muted text color, a muted fill and a `not-allowed` cursor, and the chevron turns muted. In Windows high contrast mode they use the system `GrayText` color. Before, a disabled field looked exactly like an enabled one.

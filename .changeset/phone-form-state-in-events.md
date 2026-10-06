---
'@teselia/phone': patch
---

Listeners of `input`, `change` and `countrychange` now see the new form value and validity. Before, `new FormData(form)` and `checkValidity()` inside a listener returned the state from before the change, for example one digit behind while typing.

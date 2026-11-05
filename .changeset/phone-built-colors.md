---
'@teselia/phone': patch
---

Fix missing colors in the published builds. The build lowered `light-dark()` to variables that only exist under a `color-scheme` declaration, so every default color was invalid: fields had no border or background, and the accent and error colors were lost. The npm and CDN builds now keep `light-dark()`, which every supported browser understands. The docs site was not affected, because it uses the source code.

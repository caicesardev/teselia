---
title: 'Spike: SMS code autofill'
sidebar: false
search: false
head:
  - - meta
    - name: robots
      content: noindex
---

# Spike: SMS code autofill

Test page for [#69](https://github.com/caicesardev/teselia/issues/69). Open it in Safari on an iPhone. From another phone, send yourself a text message such as **"Your verification code is 123456"**. Then tap each field below, and check whether the keyboard offers the code above the keys ("From Messages").

Each field is a plain `<input autocomplete="one-time-code" inputmode="numeric">`. Only where it lives changes.

<form class="spike" @submit.prevent>
  <div class="spike-field">
    <label for="light-dom-code">1. Light DOM input (control)</label>
    <input id="light-dom-code" autocomplete="one-time-code" inputmode="numeric" />
  </div>

  <tes-spike-shadow-input></tes-spike-shadow-input>

  <div class="spike-field">
    <span class="spike-label">3. The real &lt;tes-otp&gt;</span>
    <tes-otp label="Verification code" name="code"></tes-otp>
  </div>
</form>

<script setup>
import { onMounted } from 'vue'

onMounted(() => import('./shadow-input'))
</script>

<style scoped>
.spike {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.spike-field {
  display: grid;
  gap: 0.25rem;
}

.spike-field label,
.spike-label {
  font-weight: 500;
}

.spike-field input {
  min-block-size: 2.75rem;
  padding-inline: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 16px;
}
</style>

## What to report

For each field (1, 2 and 3): **yes**, the keyboard offered the code, or **no**. For each yes, also say whether tapping the suggestion filled the field.

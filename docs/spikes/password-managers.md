---
title: 'Spike: password managers'
sidebar: false
search: false
head:
  - - meta
    - name: robots
      content: noindex
---

# Spike: password managers

Test page for [#110](https://github.com/caicesardev/teselia/issues/110). It checks whether password managers can **fill**, **save** and **generate** passwords for a field, depending on where its `<input type="password">` lives:

- **A. Light DOM** (the control): a plain input in the page.
- **B. Shadow DOM**: the input is inside a form-associated custom element's shadow root, like `<tes-phone>` and `<tes-otp>` today.
- **C. Light DOM rendered by a custom element**: the element creates a plain input as its own child.

Use made-up credentials only. Submitting never sends anything: the form disappears, like a single-page app after signing in. Afterwards, delete the test entries for this site from your password manager.

## Sign in (`current-password`)

<div class="spike-grid">
  <form data-spike-form="A. Sign in, light DOM" class="spike">
    <h3>A. Light DOM</h3>
    <label class="spike-label" for="a-user">Username</label>
    <input class="spike-input" id="a-user" name="username" autocomplete="username" />
    <label class="spike-label" for="a-password">Password</label>
    <input class="spike-input" id="a-password" name="password" type="password" autocomplete="current-password" />
    <button>Sign in</button>
    <p class="spike-readout" data-readout></p>
  </form>
  <form data-spike-form="B. Sign in, shadow DOM" class="spike">
    <h3>B. Shadow DOM</h3>
    <label class="spike-label" for="b-user">Username</label>
    <input class="spike-input" id="b-user" name="username" autocomplete="username" />
    <tes-spike-shadow-password id="b-password" name="password" label="Password" autocomplete="current-password"></tes-spike-shadow-password>
    <button>Sign in</button>
    <p class="spike-readout" data-readout></p>
  </form>
  <form data-spike-form="C. Sign in, rendered light DOM" class="spike">
    <h3>C. Rendered light DOM</h3>
    <label class="spike-label" for="c-user">Username</label>
    <input class="spike-input" id="c-user" name="username" autocomplete="username" />
    <tes-spike-light-password id="c-password" name="password" label="Password" autocomplete="current-password"></tes-spike-light-password>
    <button>Sign in</button>
    <p class="spike-readout" data-readout></p>
  </form>
</div>

## New password (`new-password`)

These fields also carry `passwordrules="minlength: 10; maxlength: 12; required: lower; required: digit; allowed: lower, digit;"`. That is unusual on purpose: a generated password that follows it has **10 to 12 characters, only lowercase letters and digits**. The line under each form describes the value (never the value itself), so you can tell whether a generated password followed the rules.

<div class="spike-grid">
  <form data-spike-form="A. New password, light DOM" class="spike">
    <h3>A. Light DOM</h3>
    <label class="spike-label" for="na-user">Username</label>
    <input class="spike-input" id="na-user" name="username" autocomplete="username" />
    <label class="spike-label" for="na-password">New password</label>
    <input class="spike-input" id="na-password" name="password" type="password" autocomplete="new-password" passwordrules="minlength: 10; maxlength: 12; required: lower; required: digit; allowed: lower, digit;" />
    <button>Create account</button>
    <p class="spike-readout" data-readout></p>
  </form>
  <form data-spike-form="B. New password, shadow DOM" class="spike">
    <h3>B. Shadow DOM</h3>
    <label class="spike-label" for="nb-user">Username</label>
    <input class="spike-input" id="nb-user" name="username" autocomplete="username" />
    <tes-spike-shadow-password id="nb-password" name="password" label="New password" autocomplete="new-password" passwordrules="minlength: 10; maxlength: 12; required: lower; required: digit; allowed: lower, digit;"></tes-spike-shadow-password>
    <button>Create account</button>
    <p class="spike-readout" data-readout></p>
  </form>
  <form data-spike-form="C. New password, rendered light DOM" class="spike">
    <h3>C. Rendered light DOM</h3>
    <label class="spike-label" for="nc-user">Username</label>
    <input class="spike-input" id="nc-user" name="username" autocomplete="username" />
    <tes-spike-light-password id="nc-password" name="password" label="New password" autocomplete="new-password" passwordrules="minlength: 10; maxlength: 12; required: lower; required: digit; allowed: lower, digit;"></tes-spike-light-password>
    <button>Create account</button>
    <p class="spike-readout" data-readout></p>
  </form>
</div>

## What to report

For each password manager and each field (A, B, C):

1. **Fill:** after a password for this site is saved, does the manager offer it (key icon, dropdown or keyboard suggestion) and fill the password?
2. **Save:** after submitting a sign-in form with a new username, does the manager offer to save the password?
3. **Generate:** in the "New password" forms, does it suggest a strong password? If so, what does the line under the form say (length and character types)?

<script setup>
import { onMounted } from 'vue'

onMounted(() => import('./password-fields'))
</script>

<style>
.spike-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}

.spike {
  display: grid;
  gap: 0.5rem;
  align-content: start;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.vp-doc .spike h3 {
  margin: 0 0 0.25rem;
  padding: 0;
  border: 0;
  font-size: 1rem;
}

.spike-label {
  font-weight: 500;
}

.spike-input,
tes-spike-shadow-password {
  box-sizing: border-box;
  inline-size: 100%;
}

.spike-input {
  min-block-size: 2.75rem;
  padding-inline: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 16px;
}

.spike button {
  justify-self: start;
  min-block-size: 2.75rem;
  margin-block-start: 0.5rem;
  padding-inline: 1rem;
  border-radius: 6px;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  font-weight: 500;
}

.spike-readout,
.spike-done {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'

const submitted = ref<Record<string, FormDataEntryValue> | null>(null)

function showSubmittedData(event: SubmitEvent): void {
  const form = event.target as HTMLFormElement
  submitted.value = Object.fromEntries(new FormData(form))
}

function clearSubmittedData(): void {
  submitted.value = null
}
</script>

<template>
  <form class="demo" @submit.prevent="showSubmittedData" @reset="clearSubmittedData">
    <tes-phone name="phone" label="Phone number" required />

    <div class="actions">
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </div>

    <output class="result" aria-live="polite">
      <template v-if="submitted">
        <span class="result-label">FormData</span>
        <code>{{ JSON.stringify(submitted) }}</code>
      </template>
    </output>
  </form>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 1rem;
  justify-items: start;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

button[type='submit'] {
  border-color: transparent;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

button[type='submit']:hover {
  background: var(--vp-button-brand-hover-bg);
}

button[type='submit']:active {
  background: var(--vp-button-brand-active-bg);
}

button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.result {
  display: grid;
  gap: 0.25rem;
  min-block-size: 1.5rem;
}

.result-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
</style>

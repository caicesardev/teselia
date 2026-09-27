<template>
  <form
    class="demo"
    @submit.prevent="showSubmittedData"
    @reset="clearSubmittedData"
    @input="updateLiveState"
    @countrychange="updateLiveState"
  >
    <tes-phone
      ref="phone"
      name="phone"
      label="Phone number"
      hint="We will only use it to contact you about your order."
      preferred-countries="ES,PT,FR,GB"
      required
    />

    <div class="actions">
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </div>

    <dl class="readout">
      <div>
        <dt>value</dt>
        <dd><code>{{ JSON.stringify(live.value) }}</code></dd>
      </div>
      <div>
        <dt>country</dt>
        <dd><code>{{ JSON.stringify(live.country) }}</code></dd>
      </div>
      <div>
        <dt>valid</dt>
        <dd><code>{{ live.valid }}</code></dd>
      </div>
    </dl>

    <output class="result" aria-live="polite">
      <template v-if="submitted">
        <span class="result-label">FormData</span>
        <code>{{ JSON.stringify(submitted) }}</code>
      </template>
    </output>
  </form>
</template>

<script setup lang="ts">
import type { TesPhoneElement } from '@teselia/phone'
import { nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue'

interface PhoneDetail {
  value: string
  country: string
  valid: boolean
}

const phone = useTemplateRef<TesPhoneElement>('phone')
const live = reactive<PhoneDetail>({ value: '', country: '', valid: false })
const submitted = ref<Record<string, FormDataEntryValue> | null>(null)

function readLiveState(element: TesPhoneElement): void {
  Object.assign(live, { value: element.value, country: element.country, valid: element.valid })
}

function updateLiveState(event: Event): void {
  if (event instanceof CustomEvent) Object.assign(live, event.detail as PhoneDetail)
}

function showSubmittedData(event: SubmitEvent): void {
  const form = event.target as HTMLFormElement
  submitted.value = Object.fromEntries(new FormData(form))
}

function clearSubmittedData(): void {
  submitted.value = null
  setTimeout(readLiveStateOfPhone)
}

function readLiveStateOfPhone(): void {
  if (phone.value) readLiveState(phone.value)
}

onMounted(async () => {
  await nextTick()
  readLiveStateOfPhone()
})
</script>

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

.readout {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.5rem;
  margin: 0;
  font-size: 0.875rem;
}

.readout div {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.readout dt {
  color: var(--vp-c-text-2);
}

.readout dd {
  margin: 0;
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

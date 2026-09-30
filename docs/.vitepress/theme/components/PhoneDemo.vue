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

    <div class="demo-actions">
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </div>

    <dl class="demo-readout">
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

    <div class="demo-result" role="status">
      <template v-if="submitted">
        <span class="demo-result-label">FormData</span>
        <code>{{ JSON.stringify(submitted) }}</code>
      </template>
    </div>
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

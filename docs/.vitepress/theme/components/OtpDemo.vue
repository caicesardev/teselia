<template>
  <div class="demo-stack">
    <fieldset class="demo-options">
      <legend>Options</legend>
      <label><input v-model="type" type="radio" value="numeric" /> Digits</label>
      <label><input v-model="type" type="radio" value="alphanumeric" /> Letters and digits</label>
      <label><input v-model="autosubmit" type="checkbox" /> <code>autosubmit</code></label>
    </fieldset>

    <form
      class="demo"
      @submit.prevent="verifyCode"
      @reset="clearSubmittedData"
      @input="updateLiveState"
    >
      <tes-otp
        ref="otp"
        name="code"
        label="Verification code"
        hint="We sent it to +34 612 ··· 678"
        :type="type"
        :autosubmit="autosubmit"
        required
      />

      <div class="demo-actions">
        <button type="submit">Verify</button>
        <button type="reset">Reset</button>
      </div>

      <dl class="demo-readout">
        <div>
          <dt>value</dt>
          <dd><code>{{ JSON.stringify(live.value) }}</code></dd>
        </div>
        <div>
          <dt>complete</dt>
          <dd><code>{{ live.complete }}</code></dd>
        </div>
      </dl>

      <div class="demo-result" role="status">
        <template v-if="submitted">
          <span class="demo-result-label">FormData</span>
          <code>{{ JSON.stringify(submitted) }}</code>
        </template>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { TesOtpElement } from '@teselia/otp'
import { reactive, ref, useTemplateRef, watch } from 'vue'

type CodeType = 'numeric' | 'alphanumeric'

interface OtpDetail {
  value: string
  complete: boolean
}

const REJECTED_CODE = /^0+$/

const otp = useTemplateRef<TesOtpElement>('otp')
const type = ref<CodeType>('numeric')
const autosubmit = ref(false)
const live = reactive<OtpDetail>({ value: '', complete: false })
const submitted = ref<Record<string, FormDataEntryValue> | null>(null)

function readLiveState(): void {
  if (otp.value) Object.assign(live, { value: otp.value.value, complete: otp.value.complete })
}

function updateLiveState(event: Event): void {
  if (event instanceof CustomEvent) Object.assign(live, event.detail as OtpDetail)
}

function verifyCode(event: SubmitEvent): void {
  const form = event.target as HTMLFormElement
  const element = otp.value
  if (element && REJECTED_CODE.test(element.value)) {
    submitted.value = null
    element.setCustomValidity('That code is not valid. Check the message and try again.')
    return
  }
  submitted.value = Object.fromEntries(new FormData(form))
}

function clearSubmittedData(): void {
  submitted.value = null
  setTimeout(readLiveState)
}

watch(type, () => {
  submitted.value = null
  setTimeout(readLiveState)
})
</script>

<template>
  <form
    class="demo"
    @submit.prevent="submit"
    @reset="clearSubmittedData"
    @input="updateLiveState"
    @revealchange="updateRevealed"
  >
    <tes-password
      ref="password"
      class="vp-raw"
      name="password"
      :label="signingUp ? 'New password' : 'Password'"
      :purpose="purpose"
      :minlength="signingUp ? 12 : undefined"
      :requirements="signingUp ? 'digit' : undefined"
      :hint="signingUp ? 'Use a passphrase you do not use anywhere else.' : undefined"
      required
    />

    <div class="demo-actions">
      <button type="submit">{{ signingUp ? 'Create account' : 'Sign in' }}</button>
      <button type="reset">Reset</button>
    </div>

    <dl class="demo-readout">
      <div>
        <dt>value</dt>
        <dd><code>{{ JSON.stringify(live.value) }}</code></dd>
      </div>
      <div>
        <dt>requirementsMet</dt>
        <dd><code>{{ live.requirementsMet }}</code></dd>
      </div>
      <div>
        <dt>revealed</dt>
        <dd><code>{{ live.revealed }}</code></dd>
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
import type { TesPasswordElement } from '@teselia/password'
import { computed, reactive, ref, useTemplateRef } from 'vue'

const { purpose = 'current' } = defineProps<{ purpose?: 'current' | 'new' }>()

interface LiveState {
  value: string
  requirementsMet: boolean
  revealed: boolean
}

const BREACHED_WORD = 'password'

const password = useTemplateRef<TesPasswordElement>('password')
const signingUp = computed(() => purpose === 'new')
const live = reactive<LiveState>({ value: '', requirementsMet: purpose !== 'new', revealed: false })
const submitted = ref<Record<string, FormDataEntryValue> | null>(null)

function updateLiveState(event: Event): void {
  if (!(event instanceof CustomEvent)) return
  live.value = event.detail.value
  live.requirementsMet = event.detail.requirementsMet
}

function updateRevealed(event: Event): void {
  if (event instanceof CustomEvent) live.revealed = event.detail.revealed
}

function submit(event: SubmitEvent): void {
  const element = password.value
  if (signingUp.value && element?.value.toLowerCase().includes(BREACHED_WORD)) {
    submitted.value = null
    element.setCustomValidity('This password appears in known data breaches. Choose another one.')
    return
  }
  submitted.value = Object.fromEntries(new FormData(event.target as HTMLFormElement))
}

function clearSubmittedData(): void {
  submitted.value = null
  setTimeout(() => {
    live.value = password.value?.value ?? ''
    live.requirementsMet = password.value?.requirementsMet ?? true
  })
}
</script>

<template>
  <form class="demo" @submit.prevent="showSubmittedData" @reset="clearSubmittedData">
    <tes-password class="vp-raw" name="password" label="Password" />

    <div class="demo-actions">
      <button type="submit">Sign in</button>
      <button type="reset">Reset</button>
    </div>

    <div class="demo-result" role="status">
      <template v-if="submitted">
        <span class="demo-result-label">FormData</span>
        <code>{{ JSON.stringify(submitted) }}</code>
      </template>
    </div>
  </form>
</template>

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

import { type ComputedRef, computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { resolveLocale } from '../core/locale'

export function useLocale(host: HTMLElement): ComputedRef<string> {
  const langChanges = ref(0)
  const langObserver = new MutationObserver(() => langChanges.value++)

  onMounted(() => {
    for (const target of [host, document.documentElement]) {
      langObserver.observe(target, { attributes: true, attributeFilter: ['lang'] })
    }
  })
  onBeforeUnmount(() => langObserver.disconnect())

  return computed(() => {
    void langChanges.value
    return resolveLocale([
      host.closest('[lang]')?.getAttribute('lang'),
      document.documentElement.lang,
      navigator.language,
    ])
  })
}

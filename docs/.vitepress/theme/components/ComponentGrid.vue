<template>
  <section id="components" class="component-grid" aria-labelledby="components-title">
    <h2 id="components-title">Components</h2>
    <ul>
      <li v-for="component in components" :key="component.link">
        <a :href="withBase(component.link)">
          <span class="component-header">
            <code>{{ component.tag }}</code>
            <span class="component-status" :class="{ released: component.released }">{{ component.status }}</span>
          </span>
          <span class="component-name">{{ component.name }}</span>
          <span class="component-summary">{{ component.summary }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { withBase } from 'vitepress'

const components = [
  {
    name: 'Phone',
    tag: '<tes-phone>',
    link: '/phone',
    status: 'v1.0',
    released: true,
    summary: 'International phone input with a searchable country selector. Formats as you type and submits E.164.',
  },
  {
    name: 'OTP',
    tag: '<tes-otp>',
    link: '/otp',
    status: 'Coming Oct 24',
    released: false,
    summary: 'One-time code input drawn as cells over one real field, so paste, SMS autofill and screen readers work.',
  },
]
</script>

<style scoped>
.component-grid {
  padding-block: 2.5rem 3rem;
}

h2 {
  margin: 0 0 1rem;
  padding: 0;
  border: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.component-grid li {
  margin: 0;
}

a {
  display: grid;
  gap: 0.5rem;
  block-size: 100%;
  box-sizing: border-box;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.25s;
}

a:hover {
  border-color: var(--vp-c-brand-1);
}

a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.component-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
}

.component-header code {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.component-status {
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  font-size: 0.75rem;
  font-weight: 500;
}

.component-status.released {
  background: var(--vp-c-brand-soft);
}

.component-name {
  font-size: 1.125rem;
  font-weight: 600;
}

.component-summary {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  a {
    transition: none;
  }
}
</style>

import { defineConfig } from 'vitest/config'

// Root config: each package under packages/* provides its own vitest config
// (unit tests in Node, component tests in real browsers). See design/phone.md §6.1.
export default defineConfig({
  test: {
    projects: ['packages/*'],
    passWithNoTests: true,
  },
})

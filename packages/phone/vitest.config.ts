import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { emulateMedia } from './src/testing/commands.ts'

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'phone:unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.browser.test.ts'],
        },
      },
      {
        extends: './vite.config.ts',
        optimizeDeps: {
          include: ['libphonenumber-js/min', 'axe-core'],
        },
        test: {
          name: 'phone:browser',
          fileParallelism: false,
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            commands: { emulateMedia },
            instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
          },
        },
      },
    ],
  },
})

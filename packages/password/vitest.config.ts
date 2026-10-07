import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { emulateMedia } from '@teselia/shared/test/commands'

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'password:unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        extends: './vite.config.ts',
        optimizeDeps: {
          include: ['axe-core'],
        },
        test: {
          name: 'password:browser',
          fileParallelism: false,
          include: ['test/browser/**/*.test.ts'],
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

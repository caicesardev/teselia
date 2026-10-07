import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'password:unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
        },
      },
    ],
  },
})

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isSelfContainedCdnBuild = mode === 'iife'

  return {
    plugins: [
      vue({
        features: {
          optionsAPI: false,
          prodDevtools: false,
        },
      }),
    ],
    define: isSelfContainedCdnBuild
      ? { 'process.env.NODE_ENV': JSON.stringify('production') }
      : {},
    build: {
      emptyOutDir: !isSelfContainedCdnBuild,
      sourcemap: true,
      lib: {
        entry: 'src/index.ts',
        name: 'TeseliaPassword',
        formats: isSelfContainedCdnBuild ? ['iife'] : ['es'],
        fileName: () => (isSelfContainedCdnBuild ? 'tes-password.iife.js' : 'tes-password.js'),
      },
      rolldownOptions: {
        external: isSelfContainedCdnBuild ? [] : ['vue'],
      },
    },
  }
})

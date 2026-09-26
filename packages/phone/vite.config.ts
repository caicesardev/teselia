import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const bundleVueForCdn = mode === 'iife'

  return {
    plugins: [
      vue({
        features: {
          optionsAPI: false,
          prodDevtools: false,
        },
      }),
    ],
    define: bundleVueForCdn ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
    build: {
      emptyOutDir: !bundleVueForCdn,
      sourcemap: true,
      lib: {
        entry: 'src/index.ts',
        name: 'TeseliaPhone',
        formats: bundleVueForCdn ? ['iife'] : ['es'],
        fileName: () => (bundleVueForCdn ? 'tes-phone.iife.js' : 'tes-phone.js'),
      },
      rolldownOptions: {
        external: bundleVueForCdn ? [] : ['vue'],
      },
    },
  }
})

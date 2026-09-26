import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const dependenciesLeftToConsumerBundler = ['vue', /^libphonenumber-js(\/|$)/]

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
        name: 'TeseliaPhone',
        formats: isSelfContainedCdnBuild ? ['iife'] : ['es'],
        fileName: () => (isSelfContainedCdnBuild ? 'tes-phone.iife.js' : 'tes-phone.js'),
      },
      rolldownOptions: {
        external: isSelfContainedCdnBuild ? [] : dependenciesLeftToConsumerBundler,
      },
    },
  }
})

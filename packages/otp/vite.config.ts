import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { supportedBrowsers } from '../../scripts/build-targets.ts'

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
      cssTarget: supportedBrowsers,
      emptyOutDir: !isSelfContainedCdnBuild,
      sourcemap: true,
      lib: {
        entry: 'src/index.ts',
        name: 'TeseliaOtp',
        formats: isSelfContainedCdnBuild ? ['iife'] : ['es'],
        fileName: () => (isSelfContainedCdnBuild ? 'tes-otp.iife.js' : 'tes-otp.js'),
      },
      rolldownOptions: {
        external: isSelfContainedCdnBuild ? [] : ['vue'],
      },
    },
  }
})

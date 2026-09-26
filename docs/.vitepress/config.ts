import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const isTeseliaElement = (tag: string): boolean => tag.startsWith('tes-')

const phoneSource = fileURLToPath(new URL('../../packages/phone/src/index.ts', import.meta.url))

export default defineConfig({
  lang: 'en',
  title: 'Teselia',
  description:
    'Accessible micro components built with Vue 3, shipped as framework-agnostic Web Components. WCAG 2.2 AA by default.',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://teselia.caicesardev.com' },

  vue: {
    template: {
      compilerOptions: { isCustomElement: isTeseliaElement },
    },
  },

  vite: {
    resolve: {
      alias: { '@teselia/phone': phoneSource },
    },
  },

  themeConfig: {
    nav: [{ text: 'Phone', link: '/phone' }],

    sidebar: [
      {
        text: 'Components',
        items: [{ text: 'Phone', link: '/phone' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/caicesardev/teselia' }],

    editLink: {
      pattern: 'https://github.com/caicesardev/teselia/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Teselia by caicesardev',
    },

    search: { provider: 'local' },
  },
})

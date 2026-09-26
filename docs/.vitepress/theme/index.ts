import '@teselia/phone'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PhoneDemo from './components/PhoneDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PhoneDemo', PhoneDemo)
  },
} satisfies Theme

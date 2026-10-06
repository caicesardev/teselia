import '@teselia/otp'
import '@teselia/phone'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ComponentGrid from './components/ComponentGrid.vue'
import OtpDemo from './components/OtpDemo.vue'
import PhoneDemo from './components/PhoneDemo.vue'
import './custom.css'
import './demo.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ComponentGrid', ComponentGrid)
    app.component('OtpDemo', OtpDemo)
    app.component('PhoneDemo', PhoneDemo)
  },
} satisfies Theme

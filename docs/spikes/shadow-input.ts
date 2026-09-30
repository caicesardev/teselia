const styles = new CSSStyleSheet()
styles.replaceSync(`
  :host { display: grid; gap: 0.25rem; }
  label { font-weight: 500; }
  input { font-size: 16px; min-block-size: 2.75rem; padding-inline: 0.75rem; }
`)

class SpikeShadowInput extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open', delegatesFocus: true })
    root.adoptedStyleSheets = [styles]

    const label = Object.assign(document.createElement('label'), {
      htmlFor: 'code',
      textContent: '2. Input inside a shadow root',
    })
    const input = Object.assign(document.createElement('input'), {
      id: 'code',
      autocomplete: 'one-time-code',
      inputMode: 'numeric',
    })
    root.append(label, input)
  }
}

if (!customElements.get('tes-spike-shadow-input')) {
  customElements.define('tes-spike-shadow-input', SpikeShadowInput)
}

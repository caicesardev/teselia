const shadowStyles = new CSSStyleSheet()
shadowStyles.replaceSync(`
  :host { display: grid; gap: 0.25rem; }
  label { font-weight: 500; }
  input { box-sizing: border-box; inline-size: 100%; min-block-size: 2.75rem; padding-inline: 0.75rem; font-size: 16px; }
`)

function createPasswordInput(element: HTMLElement): HTMLInputElement {
  const input = Object.assign(document.createElement('input'), {
    id: `${element.id}-input`,
    type: 'password',
    name: element.getAttribute('name') ?? 'password',
    spellcheck: false,
  })
  input.setAttribute('autocomplete', element.getAttribute('autocomplete') ?? 'current-password')
  const rules = element.getAttribute('passwordrules')
  if (rules) input.setAttribute('passwordrules', rules)
  return input
}

function createLabel(element: HTMLElement, input: HTMLInputElement): HTMLLabelElement {
  return Object.assign(document.createElement('label'), {
    htmlFor: input.id,
    textContent: element.getAttribute('label') ?? 'Password',
  })
}

class SpikeShadowPassword extends HTMLElement {
  static formAssociated = true
  readonly internals = this.attachInternals()

  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open', delegatesFocus: true })
    root.adoptedStyleSheets = [shadowStyles]
    const input = createPasswordInput(this)
    input.addEventListener('input', () => this.internals.setFormValue(input.value, ''))
    root.append(createLabel(this, input), input)
  }
}

class SpikeLightPassword extends HTMLElement {
  connectedCallback(): void {
    if (this.querySelector('input')) return
    this.style.display = 'grid'
    this.style.gap = '0.25rem'
    const input = createPasswordInput(this)
    input.className = 'spike-input'
    const label = createLabel(this, input)
    label.className = 'spike-label'
    this.append(label, input)
  }
}

function describe(value: string): string {
  if (!value) return 'empty'
  const classes = [
    /\p{Ll}/u.test(value) && 'lowercase',
    /\p{Lu}/u.test(value) && 'uppercase',
    /\d/.test(value) && 'digits',
    /[^\p{L}\d]/u.test(value) && 'symbols',
  ].filter(Boolean)
  return `${value.length} characters: ${classes.join(', ')}`
}

function passwordValue(form: HTMLFormElement): string {
  return String(new FormData(form).get('password') ?? '')
}

function watchForm(form: HTMLFormElement): void {
  const readout = form.querySelector<HTMLElement>('[data-readout]')
  const update = (): void => {
    if (readout) readout.textContent = `Password value: ${describe(passwordValue(form))}`
  }
  form.addEventListener('input', update)
  setInterval(update, 500)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const done = document.createElement('p')
    done.className = 'spike-done'
    done.textContent = `Submitted "${form.dataset.spikeForm}". Reload the page to try again.`
    setTimeout(() => form.replaceWith(done), 300)
  })
}

if (!customElements.get('tes-spike-shadow-password')) {
  customElements.define('tes-spike-shadow-password', SpikeShadowPassword)
}
if (!customElements.get('tes-spike-light-password')) {
  customElements.define('tes-spike-light-password', SpikeLightPassword)
}

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-spike-form]')) watchForm(form)

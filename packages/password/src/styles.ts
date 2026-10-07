import css from './tes-password.css?inline'

const HOST_SELECTOR = ':where(tes-password'

export function stylesFor(tagName: string): string {
  return css.replaceAll(HOST_SELECTOR, `:where(${tagName}`)
}

export function adoptStyles(tagName: string): void {
  if (typeof document === 'undefined' || typeof CSSStyleSheet === 'undefined') return

  const sheet = new CSSStyleSheet()
  sheet.replaceSync(stylesFor(tagName))
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
}

import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

const addedStyles: HTMLStyleElement[] = []

function addPageStyles(css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  addedStyles.push(style)
}

function find(el: TesPasswordElement, className: string): HTMLElement {
  return el.querySelector(`.tes-password__${className}`) as HTMLElement
}

async function renderInContainer(attributes: string, inlineSize: string): Promise<TesPasswordElement> {
  const el = await renderPassword(attributes)
  ;(el.parentElement as HTMLElement).style.inlineSize = inlineSize
  return el
}

function showCapsLock(el: TesPasswordElement): void {
  passwordInput(el).focus()
  passwordInput(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, modifierCapsLock: true }))
}

function expectNoClipping(element: HTMLElement, name: string): void {
  expect(element.scrollWidth, name).toBeLessThanOrEqual(element.clientWidth)
  expect(element.scrollHeight, name).toBeLessThanOrEqual(element.clientHeight)
}

afterEach(async () => {
  document.body.innerHTML = ''
  for (const style of addedStyles.splice(0)) style.remove()
  await commands.emulateMedia({ forcedColors: 'none' })
})

describe('forced colors (Windows High Contrast)', () => {
  it('keeps the focus ring on the field and on the show button', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()
    const el = await renderPassword('')

    passwordInput(el).focus()
    await userEvent.keyboard('a')
    const field = getComputedStyle(find(el, 'control'))
    expect(field.outlineStyle).toBe('solid')
    expect(field.outlineColor).not.toBe(field.borderTopColor)

    await userEvent.tab()
    const button = getComputedStyle(find(el, 'toggle'))
    expect(button.outlineStyle).toBe('solid')
    expect(button.outlineColor).not.toBe(button.backgroundColor)
  })

  it('keeps the show button text and the field border visible', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()
    const el = await renderPassword('')

    const button = getComputedStyle(find(el, 'toggle'))
    const field = getComputedStyle(find(el, 'control'))
    expect(button.color).not.toBe(button.backgroundColor)
    expect(field.borderTopStyle).toBe('solid')
    expect(field.borderTopColor).not.toBe(field.backgroundColor)
  })

  it('tells met and unmet rules apart by shape and text, and the error by a thicker border', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()
    const el = await renderPassword('purpose="new" requirements="digit" required')
    passwordInput(el).focus()
    await userEvent.keyboard('abcdefgh')
    passwordInput(el).blur()

    const [met, unmet] = [...el.querySelectorAll<HTMLElement>('.tes-password__requirement')]
    expect(met?.querySelector('.tes-password__icon--met path')).not.toBeNull()
    expect(unmet?.querySelector('.tes-password__icon--unmet circle')).not.toBeNull()
    for (const icon of el.querySelectorAll<SVGElement>('.tes-password__icon')) {
      expect(getComputedStyle(icon).stroke).not.toBe('none')
      expect(getComputedStyle(icon).stroke).not.toBe(getComputedStyle(find(el, 'field')).backgroundColor)
    }
    await expect.poll(() => getComputedStyle(find(el, 'control')).borderTopWidth).toBe('2px')
  })

  it('has no axe violations with every message shown', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()
    const el = await renderPassword('purpose="new" hint="A long passphrase" required')
    showCapsLock(el)
    el.reportValidity()

    await expectNoAxeViolations(el)
  })
})

describe('right-to-left pages', () => {
  async function renderRtl(attributes = ''): Promise<TesPasswordElement> {
    const el = await renderPassword(`lang="ar" ${attributes}`)
    ;(el.parentElement as HTMLElement).dir = 'rtl'
    return el
  }

  it('places the show button at the inline end, on the left', async () => {
    const el = await renderRtl()
    const input = passwordInput(el).getBoundingClientRect()
    const button = find(el, 'toggle').getBoundingClientRect()

    expect(button.right).toBeLessThanOrEqual(input.left)
  })

  it('keeps the page direction for the field and the messages, like a native password field', async () => {
    const el = await renderRtl('purpose="new" hint="عبارة مرور طويلة"')

    expect(getComputedStyle(passwordInput(el)).direction).toBe('rtl')
    expect(getComputedStyle(find(el, 'hint')).direction).toBe('rtl')
  })

  it('puts each requirement icon at the inline start, on the right', async () => {
    const el = await renderRtl('purpose="new"')
    const requirement = find(el, 'requirement')
    const icon = requirement.querySelector('.tes-password__icon') as SVGElement
    const text = requirement.querySelector('span') as HTMLElement

    expect(icon.getBoundingClientRect().left).toBeGreaterThanOrEqual(text.getBoundingClientRect().right)
  })

  it('has no axe violations', async () => {
    await expectNoAxeViolations(await renderRtl('purpose="new" hint="عبارة مرور طويلة"'))
  })
})

describe('reflow', () => {
  it('fits a 288px container with a long translated button label', async () => {
    const el = await renderInContainer('purpose="new" text-show="Mostrar contraseña"', '288px')
    const host = el.getBoundingClientRect()

    expect(host.width).toBeLessThanOrEqual(288)
    expect(find(el, 'control').getBoundingClientRect().right).toBeLessThanOrEqual(host.right + 0.5)
    expect(passwordInput(el).getBoundingClientRect().width).toBeGreaterThanOrEqual(100)
  })

  it('wraps long requirement texts instead of overflowing', async () => {
    const el = await renderInContainer(
      'purpose="new" text-rule-length="Use at least {minlength} characters, and longer passphrases are better"',
      '200px',
    )
    const host = el.getBoundingClientRect()

    expect(find(el, 'requirement').getBoundingClientRect().right).toBeLessThanOrEqual(host.right + 0.5)
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth)
  })

  it('does not clip text with the WCAG text spacing override', async () => {
    addPageStyles(`
      * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
      p { margin-bottom: 2em !important; }
    `)
    const el = await renderInContainer('purpose="new" requirements="digit symbol" hint="Use a long passphrase" required', '288px')
    showCapsLock(el)
    el.reportValidity()
    await expect.poll(() => find(el, 'error').textContent).not.toBe('')

    for (const name of ['label', 'hint', 'caps-lock', 'requirements-title', 'error']) expectNoClipping(find(el, name), name)
    for (const item of el.querySelectorAll<HTMLElement>('.tes-password__requirement')) expectNoClipping(item, 'requirement')
    expectNoClipping(find(el, 'toggle'), 'toggle')
  })
})

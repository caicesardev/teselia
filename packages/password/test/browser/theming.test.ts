import { REQUIRED_TOKEN_CONTRASTS, contrastRatio, resolveColor } from '@teselia/shared/test'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { passwordInput, renderPassword } from '../support/password'

const addedStyles: HTMLStyleElement[] = []

function addPageStyles(css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  addedStyles.push(style)
}

function find(el: TesPasswordElement, className: string): HTMLElement | null {
  return el.querySelector(`.tes-password__${className}`)
}

async function renderInScheme(colorScheme: 'light' | 'dark'): Promise<TesPasswordElement> {
  const el = await renderPassword('purpose="new"')
  ;(el.parentElement as HTMLElement).style.colorScheme = colorScheme
  return el
}

async function type(el: TesPasswordElement, keys: string): Promise<void> {
  passwordInput(el).focus()
  await userEvent.keyboard(`{End}${keys}`)
}

const DOCUMENTED_CLASSES = [
  'field',
  'label',
  'control',
  'input',
  'toggle',
  'hint',
  'caps-lock',
  'requirements',
  'requirement',
  'requirement--met',
  'error',
]

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--tes-color-success')
  for (const style of addedStyles.splice(0)) style.remove()
})

describe.each(['light', 'dark'] as const)('default design tokens in %s color scheme', (scheme) => {
  it.each(REQUIRED_TOKEN_CONTRASTS)('%s on %s meets %s:1', async (foreground, background, minimum) => {
    const el = await renderInScheme(scheme)

    expect(contrastRatio(el, `var(${foreground})`, `var(${background})`)).toBeGreaterThanOrEqual(minimum)
  })

  it('paints the field and a met requirement with the scheme palette', async () => {
    const el = await renderInScheme(scheme)
    await type(el, 'abcdefgh')
    const control = find(el, 'control') as HTMLElement
    const check = el.querySelector('.tes-password__icon--met') as SVGElement

    expect(resolveColor(el, getComputedStyle(control).backgroundColor)).toEqual(resolveColor(el, 'var(--_bg)'))
    expect(resolveColor(el, getComputedStyle(check).stroke)).toEqual(resolveColor(el, 'var(--_success)'))
  })
})

describe('design tokens', () => {
  it('lets consumers set --tes-color-success from :root', async () => {
    document.documentElement.style.setProperty('--tes-color-success', 'rgb(0, 128, 0)')
    const el = await renderPassword('purpose="new"')
    await type(el, 'abcdefgh')

    expect(getComputedStyle(el.querySelector('.tes-password__icon--met') as SVGElement).stroke).toBe('rgb(0, 128, 0)')
  })
})

describe('documented classes', () => {
  it('are all rendered, in the states where they apply', async () => {
    const el = await renderPassword('purpose="new" requirements="digit" hint="A long passphrase" required')
    await type(el, 'abcdefgh')
    passwordInput(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, modifierCapsLock: true }))
    el.reportValidity()

    for (const name of DOCUMENTED_CLASSES) {
      await expect.poll(() => find(el, name), { message: name }).not.toBeNull()
    }
  })

  it('let any page style override the component', async () => {
    addPageStyles(`
      .tes-password__toggle { color: rgb(1, 2, 3); }
      .tes-password__control { border-radius: 0px; }
      .tes-password__requirement--met { color: rgb(4, 5, 6); }
    `)
    const el = await renderPassword('purpose="new"')
    await type(el, 'abcdefgh')

    expect(getComputedStyle(find(el, 'toggle') as HTMLElement).color).toBe('rgb(1, 2, 3)')
    expect(getComputedStyle(find(el, 'control') as HTMLElement).borderTopLeftRadius).toBe('0px')
    expect(getComputedStyle(find(el, 'requirement--met') as HTMLElement).color).toBe('rgb(4, 5, 6)')
  })
})

describe('custom states', () => {
  it('is :state(empty) only while there are no characters', async () => {
    const el = await renderPassword('')
    expect(el.matches(':state(empty)')).toBe(true)

    await type(el, 'a')
    expect(el.matches(':state(empty)')).toBe(false)
  })

  it('is :state(revealed) while the password is shown', async () => {
    const el = await renderPassword('')

    el.revealed = true
    await expect.poll(() => el.matches(':state(revealed)')).toBe(true)

    el.revealed = false
    await expect.poll(() => el.matches(':state(revealed)')).toBe(false)
  })

  it('is :state(requirements-met) only for a new password that meets every rule', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')
    const signIn = await renderPassword('')
    expect(el.matches(':state(requirements-met)')).toBe(false)
    expect(signIn.matches(':state(requirements-met)')).toBe(false)

    await type(el, 'abcdefg1')

    await expect.poll(() => el.matches(':state(requirements-met)')).toBe(true)
  })

  it('is :state(caps-lock) while the warning is shown', async () => {
    const el = await renderPassword('')
    passwordInput(el).focus()

    passwordInput(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, modifierCapsLock: true }))
    await expect.poll(() => el.matches(':state(caps-lock)')).toBe(true)

    passwordInput(el).blur()
    await expect.poll(() => el.matches(':state(caps-lock)')).toBe(false)
  })

  it('is :state(invalid) only while an error is shown, like :user-invalid', async () => {
    const el = await renderPassword('required')
    expect(el.checkValidity()).toBe(false)
    expect(el.matches(':state(invalid)')).toBe(false)

    el.reportValidity()
    await expect.poll(() => el.matches(':state(invalid)')).toBe(true)

    await type(el, 'a')
    await expect.poll(() => el.matches(':state(invalid)')).toBe(false)
  })

  it('lets page styles combine :state() with the documented classes', async () => {
    addPageStyles('tes-password:state(revealed) .tes-password__control { border-color: rgb(7, 8, 9); }')
    const el = await renderPassword('')

    el.revealed = true

    await expect.poll(() => getComputedStyle(find(el, 'control') as HTMLElement).borderTopColor).toBe('rgb(7, 8, 9)')
  })
})

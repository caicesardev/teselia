import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

const ANNOUNCEMENT = { timeout: 3000 }

function requirements(el: TesPasswordElement): HTMLElement | null {
  return el.querySelector('.tes-password__requirements')
}

function items(el: TesPasswordElement): HTMLLIElement[] {
  return [...el.querySelectorAll<HTMLLIElement>('.tes-password__requirement')]
}

function itemTexts(el: TesPasswordElement): string[] {
  return items(el).map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '')
}

function metStates(el: TesPasswordElement): boolean[] {
  return items(el).map((item) => item.classList.contains('tes-password__requirement--met'))
}

function liveRegion(el: TesPasswordElement): string {
  return el.querySelector('[role="status"]')?.textContent?.trim() ?? ''
}

async function type(el: TesPasswordElement, keys: string): Promise<void> {
  passwordInput(el).focus()
  await userEvent.keyboard(`{End}${keys}`)
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('requirements list', () => {
  it('is not shown when signing in', async () => {
    const el = await renderPassword('requirements="digit"')

    expect(requirements(el)).toBeNull()
    expect(passwordInput(el).hasAttribute('aria-describedby')).toBe(false)
  })

  it('shows the minimum length before typing, unmet, for a new password', async () => {
    const el = await renderPassword('purpose="new"')

    expect(requirements(el)?.checkVisibility()).toBe(true)
    expect(itemTexts(el)).toEqual(['At least 8 characters, not yet'])
    expect(metStates(el)).toEqual([false])
  })

  it('lists the length first and then the extra rules in a fixed order', async () => {
    const el = await renderPassword('purpose="new" minlength="12" requirements="symbol digit uppercase lowercase"')

    expect(itemTexts(el)).toEqual([
      'At least 12 characters, not yet',
      'A lowercase letter, not yet',
      'An uppercase letter, not yet',
      'A number, not yet',
      'A symbol, like ! or #, not yet',
    ])
  })

  it('is read with the field: title and every rule with its state', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')

    await expect
      .element(passwordInput(el))
      .toHaveAccessibleDescription(/^Your password must have:\s+At least 8 characters\s*, not yet\s+A number\s*, not yet$/)
  })

  it('marks each rule as the user types, by shape and text, not color alone', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')

    await type(el, 'abcdefgh')

    expect(metStates(el)).toEqual([true, false])
    expect(itemTexts(el)).toEqual(['At least 8 characters, done', 'A number, not yet'])
    const [met, unmet] = items(el)
    expect(met?.querySelector('.tes-password__icon--met')).not.toBeNull()
    expect(unmet?.querySelector('.tes-password__icon--unmet')).not.toBeNull()
    expect(met?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('follows values set from code and form resets', async () => {
    const el = await renderPassword('purpose="new" name="password" value="short"', 'form')

    el.value = 'long enough'
    await expect.poll(() => metStates(el)).toEqual([true])

    el.closest('form')?.reset()
    await expect.poll(() => metStates(el)).toEqual([false])
  })

  it('follows rule changes', async () => {
    const el = await renderPassword('purpose="new" value="abcdefgh"')
    expect(metStates(el)).toEqual([true])

    el.setAttribute('minlength', '10')
    el.setAttribute('requirements', 'digit')

    await expect.poll(() => itemTexts(el)).toEqual(['At least 10 characters, not yet', 'A number, not yet'])
  })

  it('takes custom texts, with {minlength}', async () => {
    const el = await renderPassword(
      'purpose="new" minlength="10" requirements="digit" text-requirements="Tu contraseña necesita:" text-rule-length="Al menos {minlength} caracteres" text-rule-digit="Un número" text-rule-met="hecho" text-rule-unmet="pendiente"',
    )

    await expect
      .element(passwordInput(el))
      .toHaveAccessibleDescription(/^Tu contraseña necesita:\s+Al menos 10 caracteres\s*, pendiente\s+Un número\s*, pendiente$/)
  })

  it('exposes requirementsMet, always true when signing in', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')
    expect(el.requirementsMet).toBe(false)

    await type(el, 'abcdefgh1')
    expect(el.requirementsMet).toBe(true)

    const signIn = await renderPassword('')
    expect(signIn.requirementsMet).toBe(true)
  })

  it('has no axe violations with met and unmet rules', async () => {
    const el = await renderPassword('purpose="new" requirements="digit symbol"')
    await type(el, 'abcdefgh')

    await expectNoAxeViolations(el)
  })
})

describe('requirement announcements', () => {
  it('announces what changed once typing pauses', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')

    await type(el, 'abcdefgh')
    expect(liveRegion(el)).toBe('')
    await expect.poll(() => liveRegion(el), ANNOUNCEMENT).toBe('At least 8 characters, done')

    await type(el, '1')
    await expect.poll(() => liveRegion(el), ANNOUNCEMENT).toBe('All requirements met')

    await type(el, '{Backspace}')
    await expect.poll(() => liveRegion(el), ANNOUNCEMENT).toBe('A number, not yet')
  })

  it('announces several changes at once, in list order', async () => {
    const el = await renderPassword('purpose="new" requirements="uppercase digit"')

    await type(el, 'Abcdefg1')

    await expect.poll(() => liveRegion(el), ANNOUNCEMENT).toBe('All requirements met')
    await type(el, '{Backspace}{Backspace}')
    await expect.poll(() => liveRegion(el), ANNOUNCEMENT).toBe('At least 8 characters, not yet. A number, not yet')
  })

  it('stays silent for keystrokes that change no rule', async () => {
    const el = await renderPassword('purpose="new"')
    await type(el, 'abc')
    await pause(800)

    expect(liveRegion(el)).toBe('')
  })

  it('stays silent for changes from code, and does not announce them later', async () => {
    const el = await renderPassword('purpose="new"')

    el.value = 'long enough'
    await pause(800)
    expect(liveRegion(el)).toBe('')

    await type(el, '!')
    await pause(800)
    expect(liveRegion(el)).toBe('')
  })
})

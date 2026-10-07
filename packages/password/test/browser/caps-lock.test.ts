import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

let engineReportsCapsLock = false

function notice(el: TesPasswordElement): HTMLElement | null {
  return el.querySelector('.tes-password__caps-lock')
}

function describedIds(el: TesPasswordElement): string[] {
  return (passwordInput(el).getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
}

function liveRegion(el: TesPasswordElement): HTMLElement {
  return el.querySelector('[role="status"]') as HTMLElement
}

function press(el: TesPasswordElement, type: 'keydown' | 'keyup', capsLock: boolean): void {
  passwordInput(el).dispatchEvent(
    new KeyboardEvent(type, { key: 'a', bubbles: true, cancelable: true, modifierCapsLock: capsLock }),
  )
}

async function focused(attributes: string): Promise<TesPasswordElement> {
  const el = await renderPassword(attributes)
  passwordInput(el).focus()
  return el
}

beforeAll(() => {
  engineReportsCapsLock = new KeyboardEvent('keydown', { modifierCapsLock: true }).getModifierState('CapsLock')
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Caps Lock warning', () => {
  it('is not shown before any key reports Caps Lock', async () => {
    const el = await focused('')

    expect(notice(el)).toBeNull()
    expect(passwordInput(el).hasAttribute('aria-describedby')).toBe(false)
  })

  it('appears while Caps Lock is on, linked to the field, and goes away when it is off', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('')

    press(el, 'keydown', true)
    await expect.poll(() => notice(el)?.textContent?.trim()).toBe('Caps Lock is on')
    expect(notice(el)?.checkVisibility()).toBe(true)
    expect(describedIds(el)).toEqual([notice(el)?.id])

    press(el, 'keyup', false)
    await expect.poll(() => notice(el)).toBeNull()
  })

  it('also reads Caps Lock from a click in the field, before any key', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('')

    passwordInput(el).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, modifierCapsLock: true }))

    await expect.poll(() => notice(el)).not.toBeNull()
  })

  it('goes away when the field loses focus', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('')
    press(el, 'keydown', true)
    await expect.poll(() => notice(el)).not.toBeNull()

    passwordInput(el).blur()

    await expect.poll(() => notice(el)).toBeNull()
  })

  it('is announced once when it turns on, not on every key', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('')
    const messages: string[] = []
    new MutationObserver(() => messages.push(liveRegion(el).textContent?.trim() ?? '')).observe(liveRegion(el), {
      childList: true,
      characterData: true,
      subtree: true,
    })

    press(el, 'keydown', true)
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Caps Lock is on')
    press(el, 'keyup', true)
    press(el, 'keydown', true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(messages.filter((message) => message === 'Caps Lock is on')).toHaveLength(1)
  })

  it('is announced again when Caps Lock turns on again', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('')

    press(el, 'keydown', true)
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Caps Lock is on')
    press(el, 'keydown', false)
    liveRegion(el).textContent = ''
    press(el, 'keydown', true)

    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Caps Lock is on')
  })

  it('takes a custom text', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('text-caps-lock="Bloq Mayús activado"')

    press(el, 'keydown', true)

    await expect.poll(() => notice(el)?.textContent?.trim()).toBe('Bloq Mayús activado')
  })

  it('comes after the requirements in the description', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('purpose="new"')

    press(el, 'keydown', true)

    await expect.poll(() => describedIds(el)).toHaveLength(2)
    expect(describedIds(el)).toEqual([el.querySelector('.tes-password__requirements')?.id, notice(el)?.id])
  })

  it('has no axe violations while shown', async (context) => {
    if (!engineReportsCapsLock) context.skip()
    const el = await focused('purpose="new"')
    press(el, 'keydown', true)
    await expect.poll(() => notice(el)).not.toBeNull()

    await expectNoAxeViolations(el)
  })
})

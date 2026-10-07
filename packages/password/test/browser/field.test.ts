import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

async function copyToClipboard(text: string): Promise<void> {
  const source = document.createElement('textarea')
  source.value = text
  document.body.append(source)
  source.select()
  await userEvent.copy()
  source.remove()
}

function formOf(el: TesPasswordElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('purpose', () => {
  it('signs in by default: current-password, no passwordrules', async () => {
    const el = await renderPassword('')

    expect(passwordInput(el).getAttribute('autocomplete')).toBe('current-password')
    expect(passwordInput(el).hasAttribute('passwordrules')).toBe(false)
  })

  it('asks for a new password with new-password and passwordrules from the rules', async () => {
    const el = await renderPassword('purpose="new" minlength="12" maxlength="64" requirements="digit symbol"')

    expect(passwordInput(el).getAttribute('autocomplete')).toBe('new-password')
    expect(passwordInput(el).getAttribute('passwordrules')).toBe(
      'minlength: 12; maxlength: 64; required: digit; required: special; allowed: lower, upper, digit, special;',
    )
  })

  it('uses the default minimum of 8 in passwordrules', async () => {
    const el = await renderPassword('purpose="new"')

    expect(passwordInput(el).getAttribute('passwordrules')).toBe('minlength: 8; allowed: lower, upper, digit, special;')
  })

  it('ignores the rules when signing in, because old passwords may predate them', async () => {
    const el = await renderPassword('minlength="12" requirements="digit"')

    expect(passwordInput(el).hasAttribute('passwordrules')).toBe(false)
  })

  it('follows purpose and rule changes', async () => {
    const el = await renderPassword('')

    el.setAttribute('purpose', 'new')
    await expect.poll(() => passwordInput(el).getAttribute('autocomplete')).toBe('new-password')

    el.setAttribute('requirements', 'uppercase')
    await expect.poll(() => passwordInput(el).getAttribute('passwordrules')).toContain('required: upper;')

    el.purpose = 'current'
    await expect.poll(() => passwordInput(el).getAttribute('autocomplete')).toBe('current-password')
    expect(el.getAttribute('purpose')).toBe('current')
  })

  it('treats an unknown purpose as signing in', async () => {
    const el = await renderPassword('purpose="signup"')

    expect(passwordInput(el).getAttribute('autocomplete')).toBe('current-password')
  })

  it('lets an explicit autocomplete win', async () => {
    const el = await renderPassword('purpose="new" autocomplete="section-signup new-password"')

    expect(passwordInput(el).getAttribute('autocomplete')).toBe('section-signup new-password')
  })

  it('reflects minLength and maxLength like a native input', async () => {
    const el = await renderPassword('purpose="new" minlength="10"')
    expect(el.minLength).toBe(10)
    expect(el.maxLength).toBe(-1)

    el.maxLength = 20
    expect(el.getAttribute('maxlength')).toBe('20')
    await expect.poll(() => passwordInput(el).getAttribute('passwordrules')).toContain('maxlength: 20;')
  })
})

describe('typing and pasting', () => {
  it('turns off spellcheck, autocapitalization and autocorrection explicitly', async () => {
    const el = await renderPassword('')

    expect(passwordInput(el).getAttribute('spellcheck')).toBe('false')
    expect(passwordInput(el).getAttribute('autocapitalize')).toBe('off')
    expect(passwordInput(el).getAttribute('autocorrect')).toBe('off')
  })

  it('never cuts a pasted password, even over maxlength', async () => {
    const long = `${'Tr0ub4dor&3-'.repeat(15)}🔒`
    const el = await renderPassword('name="password" purpose="new" maxlength="64"', 'form')
    await copyToClipboard(long)
    passwordInput(el).focus()

    await userEvent.paste()

    expect(passwordInput(el).hasAttribute('maxlength')).toBe(false)
    expect(el.value).toBe(long)
    expect(new FormData(formOf(el)).get('password')).toBe(long)
  })

  it('never blocks paste or drop', async () => {
    const el = await renderPassword('purpose="new"')
    const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true })
    const drop = new DragEvent('drop', { bubbles: true, cancelable: true })

    passwordInput(el).dispatchEvent(paste)
    passwordInput(el).dispatchEvent(drop)

    expect(paste.defaultPrevented).toBe(false)
    expect(drop.defaultPrevented).toBe(false)
  })

  it('keeps the value exactly as typed, spaces and all', async () => {
    const el = await renderPassword('name="password"', 'form')
    passwordInput(el).focus()

    await userEvent.keyboard(' correct horse ')

    expect(new FormData(formOf(el)).get('password')).toBe(' correct horse ')
  })

  it('has no axe violations for a new password', async () => {
    await expectNoAxeViolations(await renderPassword('purpose="new" requirements="digit"'))
  })
})

describe('developer warnings', () => {
  it('warns about an unknown purpose', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await renderPassword('purpose="signup"')

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`purpose` must be "current" or "new"'))
  })

  it('warns about unknown requirements, naming them', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await renderPassword('purpose="new" requirements="digit numbers"')

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown requirements ignored: numbers'))
  })

  it('warns when rules are set for signing in, where they do not apply', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await renderPassword('requirements="digit"')

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only apply with `purpose="new"`'))
  })
})

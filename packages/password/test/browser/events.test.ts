import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { passwordInput, renderPassword } from '../support/password'

interface RecordedEvent {
  type: string
  isCustom: boolean
  bubbles: boolean
  composed: boolean
  detail: unknown
}

function recordEvents(target: EventTarget, names: string[]): RecordedEvent[] {
  const recorded: RecordedEvent[] = []
  for (const name of names) {
    target.addEventListener(name, (event) => {
      recorded.push({
        type: event.type,
        isCustom: event instanceof CustomEvent,
        bubbles: event.bubbles,
        composed: event.composed,
        detail: event instanceof CustomEvent ? event.detail : undefined,
      })
    })
  }
  return recorded
}

async function copyToClipboard(text: string): Promise<void> {
  const source = document.createElement('textarea')
  source.value = text
  document.body.append(source)
  source.select()
  await userEvent.copy()
  source.remove()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('input event', () => {
  it('fires once per keystroke, only as a bubbling, composed CustomEvent', async () => {
    const el = await renderPassword('')
    const recorded = recordEvents(document, ['input'])
    passwordInput(el).focus()

    await userEvent.keyboard('ab')

    expect(recorded).toHaveLength(2)
    expect(recorded.every((event) => event.isCustom && event.bubbles && event.composed)).toBe(true)
    expect(recorded.at(-1)?.detail).toEqual({ value: 'ab', requirementsMet: true })
  })

  it('carries requirementsMet, and listeners see the new value and validity', async () => {
    const el = await renderPassword('purpose="new" requirements="digit"')
    const seen: { detail: unknown; value: string; valid: boolean }[] = []
    el.addEventListener('input', (event: Event) => {
      seen.push({ detail: (event as CustomEvent).detail, value: el.value, valid: el.checkValidity() })
    })
    passwordInput(el).focus()

    await userEvent.keyboard('abcdefg1')

    expect(seen.at(-2)).toEqual({ detail: { value: 'abcdefg', requirementsMet: false }, value: 'abcdefg', valid: false })
    expect(seen.at(-1)).toEqual({ detail: { value: 'abcdefg1', requirementsMet: true }, value: 'abcdefg1', valid: true })
  })

  it('fires once for a paste', async () => {
    const el = await renderPassword('')
    const recorded = recordEvents(document, ['input'])
    await copyToClipboard('correct horse battery staple')
    passwordInput(el).focus()

    await userEvent.paste()

    expect(recorded.map((event) => event.detail)).toEqual([
      { value: 'correct horse battery staple', requirementsMet: true },
    ])
  })
})

describe('change event', () => {
  it('fires once when the field loses focus with a different value, as a CustomEvent', async () => {
    const el = await renderPassword('')
    const recorded = recordEvents(document, ['change'])
    passwordInput(el).focus()

    await userEvent.keyboard('secret')
    await userEvent.tab()
    await userEvent.tab()

    expect(recorded).toHaveLength(1)
    expect(recorded[0]).toMatchObject({ isCustom: true, bubbles: true, composed: true })
    expect(recorded[0]?.detail).toEqual({ value: 'secret', requirementsMet: true })
  })

  it('does not fire when the field is left untouched', async () => {
    const el = await renderPassword('value="secret"')
    const recorded = recordEvents(document, ['change'])

    passwordInput(el).focus()
    await userEvent.tab()

    expect(recorded).toEqual([])
  })
})

describe('changes from code', () => {
  it('fire neither input nor change, like a native input', async () => {
    const el = await renderPassword('name="password" value="initial"', 'form')
    const recorded = recordEvents(document, ['input', 'change'])

    el.value = 'from code'
    el.setAttribute('value', 'new default')
    el.closest('form')?.reset()

    expect(recorded).toEqual([])
  })
})

describe('revealchange event', () => {
  it('is not affected by stopping the native events', async () => {
    const el = await renderPassword('')
    const recorded = recordEvents(document, ['revealchange'])

    el.revealed = true

    expect(recorded.map((event) => event.detail)).toEqual([{ revealed: true }])
  })
})

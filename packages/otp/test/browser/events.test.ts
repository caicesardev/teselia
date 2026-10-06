import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, renderOtp } from '../support/otp'

type EventName = 'input' | 'change' | 'complete'

interface RecordedEvent {
  type: string
  isCustom: boolean
  bubbles: boolean
  composed: boolean
  detail: unknown
}

function recordEvents(target: EventTarget, names: EventName[] = ['input', 'change', 'complete']): RecordedEvent[] {
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

const typesOf = (recorded: RecordedEvent[]): string[] => recorded.map((event) => event.type)

async function pasteInto(el: TesOtpElement, text: string): Promise<void> {
  const source = document.createElement('input')
  source.value = text
  document.body.append(source)
  source.select()
  await userEvent.copy()
  source.remove()
  codeInput(el).focus()
  await userEvent.paste()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('input event', () => {
  it('fires once per accepted keystroke, as a bubbling, composed CustomEvent only', async () => {
    const el = await renderOtp('')
    const recorded = recordEvents(document, ['input'])

    await userEvent.type(codeInput(el), '12')

    expect(recorded).toHaveLength(2)
    expect(recorded.every((event) => event.isCustom && event.bubbles && event.composed)).toBe(true)
    expect(recorded.at(-1)?.detail).toEqual({ value: '12', complete: false })
  })

  it('does not fire for a rejected key', async () => {
    const el = await renderOtp('')
    const recorded = recordEvents(el, ['input'])

    await userEvent.type(codeInput(el), 'a')

    expect(recorded).toEqual([])
  })

  it('does not fire for a value set from code', async () => {
    const el = await renderOtp('')
    const recorded = recordEvents(el)

    el.value = '123456'
    el.setAttribute('value', '654321')

    expect(recorded).toEqual([])
  })
})

describe('complete event', () => {
  it('fires when typing fills the last cell, with the code', async () => {
    const el = await renderOtp('')
    const recorded = recordEvents(el, ['input', 'complete'])

    await userEvent.type(codeInput(el), '12345')
    expect(typesOf(recorded)).not.toContain('complete')

    await userEvent.keyboard('6')
    expect(recorded.at(-2)).toMatchObject({ type: 'input', detail: { value: '123456', complete: true } })
    expect(recorded.at(-1)).toMatchObject({ type: 'complete', isCustom: true, bubbles: true, composed: true, detail: { value: '123456' } })
  })

  it('fires once for a pasted code', async () => {
    const el = await renderOtp('')
    const recorded = recordEvents(el, ['input', 'complete'])

    await pasteInto(el, '123 456')

    expect(typesOf(recorded)).toEqual(['input', 'complete'])
  })

  it('fires again when the user corrects a character of a complete code', async () => {
    const el = await renderOtp('value="123456"')
    const recorded = recordEvents(el, ['complete'])
    codeInput(el).focus()

    await userEvent.keyboard('{End}7')

    expect(recorded.map((event) => event.detail)).toEqual([{ value: '123457' }])
  })

  it('does not fire when the same complete code is pasted again', async () => {
    const el = await renderOtp('value="123456"')
    const recorded = recordEvents(el, ['complete'])

    await pasteInto(el, '123456')

    expect(recorded).toEqual([])
  })

  it('does not fire for a value set from code or a form reset', async () => {
    const el = await renderOtp('value="123456"', 'form')
    const recorded = recordEvents(el, ['complete'])

    el.value = '654321'
    el.closest('form')?.reset()

    expect(recorded).toEqual([])
  })
})

describe('change event', () => {
  it('fires once when the field loses focus with a different value', async () => {
    const el = await renderOtp('')
    const recorded = recordEvents(document, ['change'])

    await userEvent.type(codeInput(el), '123')
    await userEvent.tab()

    expect(recorded).toHaveLength(1)
    expect(recorded[0]).toMatchObject({ isCustom: true, bubbles: true, composed: true, detail: { value: '123', complete: false } })
  })

  it('does not fire when the value is back to what it was on focus', async () => {
    const el = await renderOtp('value="12"')
    const recorded = recordEvents(el, ['change'])
    codeInput(el).focus()

    await userEvent.keyboard('{End}3{Backspace}')
    await userEvent.tab()

    expect(recorded).toEqual([])
  })

  it('does not fire when the field is left untouched', async () => {
    const el = await renderOtp('value="12"')
    const recorded = recordEvents(el, ['change'])

    codeInput(el).focus()
    await userEvent.tab()

    expect(recorded).toEqual([])
  })
})

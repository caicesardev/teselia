import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import { combobox, numberInput, renderPhone, typeInCombobox } from './testing/phone'

type PublicEventName = 'input' | 'change' | 'countrychange'

interface RecordedEvent {
  type: string
  isCustom: boolean
  bubbles: boolean
  composed: boolean
  detail: unknown
}

function recordEvents(target: EventTarget, names: PublicEventName[] = ['input', 'change', 'countrychange']) {
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

async function selectCountryByKeyboard(el: TesPhoneElement, search: string): Promise<void> {
  await typeInCombobox(el, search)
  await userEvent.keyboard('{ArrowDown}{Enter}')
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('public input event', () => {
  it('fires once per keystroke in the number field, as our own CustomEvent only', async () => {
    const el = await renderPhone('default-country="ES"')
    const recorded = recordEvents(el, ['input'])

    await userEvent.type(numberInput(el), '612')

    expect(recorded).toHaveLength(3)
    expect(recorded.every((event) => event.isCustom)).toBe(true)
  })

  it('carries the current value, country and validity in detail', async () => {
    const el = await renderPhone('default-country="ES"')
    const recorded = recordEvents(el, ['input'])

    await userEvent.type(numberInput(el), '612345678')

    expect(recorded.at(-1)?.detail).toEqual({ value: '+34612345678', country: 'ES', valid: true })
    expect(recorded.at(0)?.detail).toEqual({ value: '', country: 'ES', valid: false })
  })

  it('does not leak while typing a search in the country combobox', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    const recorded = recordEvents(el)

    await typeInCombobox(el, 'united')

    expect(recorded).toEqual([])
  })

  it('is not fired when the value is set from code', async () => {
    const el = await renderPhone('default-country="ES"')
    const recorded = recordEvents(el, ['input', 'change'])

    el.value = '+34612345678'

    expect(recorded).toEqual([])
  })
})

describe('public change event', () => {
  it('fires once when leaving the number field after changing it', async () => {
    const el = await renderPhone('default-country="ES"')
    const recorded = recordEvents(el, ['change'])

    await userEvent.type(numberInput(el), '612345678')
    await userEvent.tab()

    expect(recorded).toHaveLength(1)
    expect(recorded[0]?.detail).toEqual({ value: '+34612345678', country: 'ES', valid: true })
  })

  it('does not fire when leaving the number field without changes', async () => {
    const el = await renderPhone('default-country="ES" value="+34612345678"')
    const recorded = recordEvents(el, ['change'])

    numberInput(el).focus()
    await userEvent.tab()

    expect(recorded).toEqual([])
  })
})

describe('country selection events', () => {
  it('fires countrychange, input and change once when the user picks a new country', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await userEvent.type(numberInput(el), '912345678')
    await userEvent.tab({ shift: true })
    const recorded = recordEvents(el)

    await selectCountryByKeyboard(el, 'portugal')

    expect(typesOf(recorded)).toEqual(['countrychange', 'input', 'change'])
    for (const event of recorded) {
      expect(event.detail).toEqual({ value: '+351912345678', country: 'PT', valid: true })
    }
  })

  it('fires nothing when the user re-selects the current country', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    const recorded = recordEvents(el)

    combobox(el).focus()
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(recorded).toEqual([])
  })

  it('fires countrychange (only) when the value set from code changes the country', async () => {
    const el = await renderPhone('default-country="ES"')
    const recorded = recordEvents(el)

    el.value = '+442079460958'

    expect(typesOf(recorded)).toEqual(['countrychange'])
    expect(recorded[0]?.detail).toMatchObject({ country: 'GB', value: '+442079460958' })
  })

  it('fires countrychange when a form reset restores the default country', async () => {
    const el = await renderPhone('name="phone" default-country="ES" lang="en"', 'form')
    await selectCountryByKeyboard(el, 'portugal')
    const recorded = recordEvents(el, ['countrychange'])

    ;(el.closest('form') as HTMLFormElement).reset()

    expect(recorded).toHaveLength(1)
    expect(recorded[0]?.detail).toMatchObject({ country: 'ES' })
  })
})

describe('event propagation', () => {
  it('bubbles and crosses shadow boundaries (composed)', async () => {
    const el = await renderPhone('default-country="ES"')
    const recorded = recordEvents(document, ['input'])

    await userEvent.type(numberInput(el), '6')

    expect(recorded).toHaveLength(1)
    expect(recorded[0]).toMatchObject({ isCustom: true, bubbles: true, composed: true })
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesPhoneElement } from './index'
import {
  combobox,
  expectNoAxeViolations,
  isExpanded,
  liveRegion,
  popup,
  renderPhone,
  typeInCombobox,
} from './testing/phone'

const SETTLE_MS = 900

function recordAnnouncements(el: TesPhoneElement): string[] {
  const announced: string[] = []
  const region = liveRegion(el)
  new MutationObserver(() => {
    const text = region.textContent?.trim() ?? ''
    if (text) announced.push(text)
  }).observe(region, { childList: true, characterData: true, subtree: true })
  return announced
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function noResultsMessage(el: TesPhoneElement): HTMLElement | null {
  return el.shadowRoot?.querySelector('.no-results') ?? null
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('country combobox announcements: live region', () => {
  it('is a polite status region, present and empty before any interaction', async () => {
    const el = await renderPhone('default-country="ES"')
    const region = liveRegion(el)

    expect(region.getAttribute('role')).toBe('status')
    expect(region.textContent?.trim()).toBe('')
  })

  it('is visually hidden but stays in the accessibility tree', async () => {
    const region = liveRegion(await renderPhone('default-country="ES"'))
    const style = getComputedStyle(region)

    expect(style.display).not.toBe('none')
    expect(style.visibility).not.toBe('hidden')
    expect(region.getBoundingClientRect().width).toBeLessThanOrEqual(1)
  })
})

describe('country combobox announcements: results while filtering', () => {
  it('announces how many countries match once typing pauses', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await typeInCombobox(el, 'united')

    expect(liveRegion(el).textContent?.trim()).toBe('')
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Countries available: 3')
  })

  it('announces only the final count, not every keystroke', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    const announced = recordAnnouncements(el)

    await typeInCombobox(el, 'u')
    await wait(150)
    await userEvent.keyboard('ni')
    await wait(150)
    await userEvent.keyboard('ted')
    await wait(SETTLE_MS)

    expect(announced).toEqual(['Countries available: 3'])
  })

  it('announces again when a new query yields the same count', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    const announced = recordAnnouncements(el)

    await typeInCombobox(el, 'united')
    await wait(SETTLE_MS)
    await userEvent.keyboard('{Backspace}d')
    await wait(SETTLE_MS)

    expect(announced).toEqual(['Countries available: 3', 'Countries available: 3'])
  })

  it('does not announce counts while navigating with the arrow keys', async () => {
    const el = await renderPhone('default-country="ES"')
    combobox(el).focus()

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await wait(SETTLE_MS)

    expect(liveRegion(el).textContent?.trim()).toBe('')
  })

  it('clears the announcement when the listbox closes', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await typeInCombobox(el, 'united')
    await expect.poll(() => liveRegion(el).textContent?.trim()).not.toBe('')

    await userEvent.keyboard('{Escape}')

    expect(liveRegion(el).textContent?.trim()).toBe('')
  })

  it('uses text-results with the {count} placeholder', async () => {
    const el = await renderPhone('default-country="ES" lang="en" text-results="Resultados: {count}"')

    await typeInCombobox(el, 'united')

    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Resultados: 3')
  })
})

describe('country combobox announcements: no results', () => {
  it('shows and announces "No countries found", with the listbox collapsed', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')

    await typeInCombobox(el, 'zzz')

    expect(popup(el).matches(':popover-open')).toBe(true)
    expect(noResultsMessage(el)?.textContent?.trim()).toBe('No countries found')
    expect(isExpanded(el)).toBe(false)
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('No countries found')
  })

  it('shows the options again when the query matches', async () => {
    const el = await renderPhone('default-country="ES" lang="en"')
    await typeInCombobox(el, 'zzz')

    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}spa')

    expect(noResultsMessage(el)).toBeNull()
    expect(isExpanded(el)).toBe(true)
  })

  it('uses text-no-results for both the message and the announcement', async () => {
    const el = await renderPhone('default-country="ES" text-no-results="Sin resultados"')

    await typeInCombobox(el, 'zzz')

    expect(noResultsMessage(el)?.textContent?.trim()).toBe('Sin resultados')
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Sin resultados')
  })

  it('has no axe violations while showing no results', async () => {
    const el = await renderPhone('default-country="ES"')
    await typeInCombobox(el, 'zzz')

    await expectNoAxeViolations(el)
  })
})

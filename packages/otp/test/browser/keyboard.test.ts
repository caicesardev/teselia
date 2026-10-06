import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

function activeCells(el: TesOtpElement): number[] {
  return Array.from(el.shadowRoot?.querySelectorAll('.cell') ?? []).flatMap((cell, index) =>
    cell.classList.contains('active') ? [index] : [],
  )
}

async function renderBetweenButtons(attributes: string): Promise<TesOtpElement> {
  const el = await renderOtp(attributes)
  const before = Object.assign(document.createElement('button'), { textContent: 'Before' })
  const after = Object.assign(document.createElement('button'), { textContent: 'After' })
  el.before(before)
  el.after(after)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Backspace', () => {
  it('deletes the character before the caret at the end of a partial code', async () => {
    const el = await renderOtp('')
    codeInput(el).focus()

    await userEvent.keyboard('123{Backspace}')

    expect(el.value).toBe('12')
    expect(activeCells(el)).toEqual([2])
  })

  it('deletes the last character of a complete code, then keeps going backwards', async () => {
    const el = await renderOtp('')
    codeInput(el).focus()

    await userEvent.keyboard('123456{Backspace}{Backspace}')

    expect(el.value).toBe('1234')
  })

  it('deletes the selected character, and the following ones move left like in a text field', async () => {
    const el = await renderOtp('value="123456"')
    codeInput(el).focus()

    await userEvent.keyboard('{Home}{ArrowRight}{Backspace}')

    expect(el.value).toBe('13456')
    expect(activeCells(el)).toEqual([1])
  })
})

describe('Delete', () => {
  it('deletes the selected character', async () => {
    const el = await renderOtp('value="123456"')
    codeInput(el).focus()

    await userEvent.keyboard('{Home}{Delete}')

    expect(el.value).toBe('23456')
  })

  it('does nothing at the end of a partial code', async () => {
    const el = await renderOtp('value="12"')
    codeInput(el).focus()

    await userEvent.keyboard('{End}{Delete}')

    expect(el.value).toBe('12')
  })
})

describe('select all', () => {
  it('marks every filled cell, and typing replaces the whole code', async () => {
    const el = await renderOtp('value="123456"')
    codeInput(el).focus()

    await userEvent.keyboard('{Control>}a{/Control}')
    expect(activeCells(el)).toEqual([0, 1, 2, 3, 4, 5])

    await userEvent.keyboard('9')
    expect(el.value).toBe('9')
  })
})

describe('Tab', () => {
  it('moves focus in and out of the field in both directions', async () => {
    const el = await renderBetweenButtons('value="12"')
    ;(el.previousElementSibling as HTMLButtonElement).focus()

    await userEvent.tab()
    expect(el.shadowRoot?.activeElement).toBe(codeInput(el))

    await userEvent.tab()
    expect(document.activeElement?.textContent).toBe('After')
    expect(activeCells(el)).toEqual([])

    await userEvent.tab({ shift: true })
    expect(el.shadowRoot?.activeElement).toBe(codeInput(el))

    await userEvent.tab({ shift: true })
    expect(document.activeElement?.textContent).toBe('Before')
  })
})

describe('focus indicator', () => {
  it('draws a 2px focus ring around the active cell only', async () => {
    const el = await renderOtp('')
    codeInput(el).focus()
    await userEvent.keyboard('1')

    const cells = Array.from(el.shadowRoot?.querySelectorAll<HTMLElement>('.cell') ?? [])
    const outlines = cells.map((cell) => getComputedStyle(cell).outlineStyle)
    expect(outlines).toEqual(['none', 'solid', 'none', 'none', 'none', 'none'])
    expect(getComputedStyle(cells[1] as HTMLElement).outlineWidth).toBe('2px')
  })

  it('has no axe violations while moving through the cells', async () => {
    const el = await renderOtp('value="1234"')
    codeInput(el).focus()
    await userEvent.keyboard('{Home}{ArrowRight}')

    await expectNoAxeViolations(el)
  })
})

describe('held arrow keys', () => {
  it.each([
    ['partial', '1234', 4],
    ['complete', '123456', 5],
  ])('move the active cell on every repeat of a held → in a %s code, before the key is released', async (_, value, last) => {
    const el = await renderOtp(`value="${value}"`)
    codeInput(el).focus()
    await userEvent.keyboard('{Home}')

    await userEvent.keyboard('{ArrowRight>2}')
    await expect.poll(() => activeCells(el)).toEqual([2])

    await userEvent.keyboard(`{ArrowRight>${last}}`)
    await expect.poll(() => activeCells(el)).toEqual([last])
    await userEvent.keyboard('{/ArrowRight}')
  })

  it('moves the active cell on every repeat of a held ← in a partial code', async () => {
    const el = await renderOtp('value="1234"')
    codeInput(el).focus()
    await userEvent.keyboard('{End}')

    await userEvent.keyboard('{ArrowLeft>2}')
    await expect.poll(() => activeCells(el)).toEqual([2])
    await userEvent.keyboard('{/ArrowLeft}')
  })
})

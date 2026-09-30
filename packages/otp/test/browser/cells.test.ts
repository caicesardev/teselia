import { afterEach, describe, expect, it } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

function cellElements(el: TesOtpElement): HTMLElement[] {
  return Array.from(el.shadowRoot?.querySelectorAll<HTMLElement>('.cell') ?? [])
}

function drawnCells(el: TesOtpElement): string {
  return cellElements(el)
    .map((cell) => {
      const character = cell.textContent?.trim() || '_'
      return cell.classList.contains('active') ? `[${character}]` : character
    })
    .join('')
}

async function focusAndType(el: TesOtpElement, text: string): Promise<void> {
  codeInput(el).focus()
  await userEvent.keyboard(text)
}

afterEach(async () => {
  document.body.innerHTML = ''
  await commands.emulateMedia({ forcedColors: 'none' })
})

describe('cells', () => {
  it('draws one cell per character, hidden from assistive technology', async () => {
    const el = await renderOtp('value="123"')

    expect(cellElements(el)).toHaveLength(6)
    expect(drawnCells(el)).toBe('123___')
    expect(el.shadowRoot?.querySelector('.cells')?.getAttribute('aria-hidden')).toBe('true')
    await expect.element(page.getByRole('textbox', { name: 'Verification code' })).toBeInTheDocument()
  })

  it('shows no active cell while the field is not focused', async () => {
    const el = await renderOtp('value="123"')

    expect(drawnCells(el)).not.toContain('[')
  })

  it('follows a value set from code', async () => {
    const el = await renderOtp('')

    el.value = '42'

    await expect.poll(() => drawnCells(el)).toBe('42____')
  })
})

describe('active cell', () => {
  it('moves to the next empty cell as the user types, with a caret in it', async () => {
    const el = await renderOtp('')

    await focusAndType(el, '123')

    expect(drawnCells(el)).toBe('123[_]__')
    expect(cellElements(el)[3]?.querySelector('.caret')).not.toBeNull()
  })

  it('selects the previous character with the left arrow, so typing replaces it', async () => {
    const el = await renderOtp('')
    await focusAndType(el, '123')

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(drawnCells(el)).toBe('1[2]3___')
    expect([codeInput(el).selectionStart, codeInput(el).selectionEnd]).toEqual([1, 2])

    await userEvent.keyboard('9')
    expect(el.value).toBe('193')
    expect(drawnCells(el)).toBe('19[3]___')
  })

  it('moves forward with the right arrow, back to the empty cell at the end', async () => {
    const el = await renderOtp('')
    await focusAndType(el, '123{ArrowLeft}')

    await userEvent.keyboard('{ArrowRight}')

    expect(drawnCells(el)).toBe('123[_]__')
  })

  it('jumps to the first character with Home and past the last one with End', async () => {
    const el = await renderOtp('')
    await focusAndType(el, '123')

    await userEvent.keyboard('{Home}')
    expect(drawnCells(el)).toBe('[1]23___')

    await userEvent.keyboard('{End}')
    expect(drawnCells(el)).toBe('123[_]__')
  })

  it('keeps the last cell active on a complete code, so a new key replaces it', async () => {
    const el = await renderOtp('')

    await focusAndType(el, '1234567')

    expect(el.value).toBe('123457')
    expect(drawnCells(el)).toBe('12345[7]')
  })

  it('deletes the selected character with Backspace', async () => {
    const el = await renderOtp('')
    await focusAndType(el, '123{ArrowLeft}{ArrowLeft}')

    await userEvent.keyboard('{Backspace}')

    expect(el.value).toBe('13')
  })
})

describe('pointer', () => {
  it('selects the character of the clicked cell', async () => {
    const el = await renderOtp('value="123456"')

    await userEvent.click(cellElements(el)[1] as HTMLElement, { force: true })

    expect(drawnCells(el)).toBe('1[2]3456')
    expect([codeInput(el).selectionStart, codeInput(el).selectionEnd]).toEqual([1, 2])
  })

  it('moves to the end of a partial code when an empty cell is clicked', async () => {
    const el = await renderOtp('value="12"')

    await userEvent.click(cellElements(el)[5] as HTMLElement, { force: true })

    expect(drawnCells(el)).toBe('12[_]___')
  })
})

describe('hidden text field', () => {
  it('hides the real text and caret behind the cells', async () => {
    const el = await renderOtp('value="123"')
    const style = getComputedStyle(codeInput(el))

    expect(style.color).toBe('rgba(0, 0, 0, 0)')
    expect(style.caretColor).toBe('rgba(0, 0, 0, 0)')
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })

  it('stays hidden and keeps a visible active cell in forced colors mode', async () => {
    await commands.emulateMedia({ forcedColors: 'active' })
    const el = await renderOtp('')
    await focusAndType(el, '12')

    expect(getComputedStyle(codeInput(el)).color).toBe('rgba(0, 0, 0, 0)')
    const activeCell = getComputedStyle(cellElements(el)[2] as HTMLElement)
    expect(activeCell.outlineStyle).toBe('solid')
    expect(activeCell.outlineColor).not.toBe('rgba(0, 0, 0, 0)')
  })

  it('has no axe violations while typing', async () => {
    const el = await renderOtp('')
    await focusAndType(el, '12')

    await expectNoAxeViolations(el)
  })
})

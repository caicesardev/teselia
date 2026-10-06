import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, expectNoAxeViolations, renderOtp } from '../support/otp'

const addedStyles: HTMLStyleElement[] = []

function addPageStyles(css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  addedStyles.push(style)
}

function cellElements(el: TesOtpElement): HTMLElement[] {
  return Array.from(el.shadowRoot?.querySelectorAll<HTMLElement>('.cell') ?? [])
}

function shadowElement(el: TesOtpElement, selector: string): HTMLElement {
  return el.shadowRoot?.querySelector(selector) as HTMLElement
}

async function renderInContainer(attributes: string, inlineSize: string): Promise<TesOtpElement> {
  const el = await renderOtp(attributes)
  ;(el.parentElement as HTMLElement).style.inlineSize = inlineSize
  return el
}

function expectNoClipping(element: HTMLElement): void {
  expect(element.scrollWidth, element.className || element.tagName).toBeLessThanOrEqual(element.clientWidth)
  expect(element.scrollHeight, element.className || element.tagName).toBeLessThanOrEqual(element.clientHeight)
}

afterEach(async () => {
  document.body.innerHTML = ''
  for (const style of addedStyles.splice(0)) style.remove()
  await commands.emulateMedia({ forcedColors: 'none' })
})

describe('forced colors (Windows High Contrast)', () => {
  it('keeps active, filled and invalid cells distinguishable', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderOtp('required')
    codeInput(el).focus()
    await userEvent.keyboard('12')
    codeInput(el).blur()
    await expect.poll(() => el.matches(':state(invalid)')).toBe(true)
    codeInput(el).focus()
    await userEvent.keyboard('{End}')
    await expect.poll(() => cellElements(el)[2]?.classList.contains('active')).toBe(true)

    const [filled, , active] = cellElements(el).map((cell) => getComputedStyle(cell))
    expect(filled?.color).not.toBe(filled?.backgroundColor)
    expect(active?.outlineStyle).toBe('solid')
    expect(active?.outlineColor).not.toBe(active?.backgroundColor)
    expect(active?.outlineColor).not.toBe(active?.borderTopColor)
    expect(filled?.borderTopWidth).toBe('2px')
  })

  it('draws the caret of an empty active cell', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderOtp('')
    codeInput(el).focus()

    await expect.poll(() => shadowElement(el, '.caret')).toBeTruthy()
    const caret = getComputedStyle(shadowElement(el, '.caret'))
    const cell = getComputedStyle(cellElements(el)[0] as HTMLElement)
    expect(caret.backgroundColor).not.toBe(cell.backgroundColor)
  })

  it('keeps a one-pixel border on valid cells, so the error border stays thicker', async (context) => {
    await commands.emulateMedia({ forcedColors: 'active' })
    if (!matchMedia('(forced-colors: active)').matches) context.skip()

    const el = await renderOtp('')

    expect(getComputedStyle(cellElements(el)[0] as HTMLElement).borderTopWidth).toBe('1px')
  })
})

describe('right-to-left pages', () => {
  async function renderRtl(attributes = ''): Promise<TesOtpElement> {
    const el = await renderOtp(`lang="ar" ${attributes}`)
    ;(el.parentElement as HTMLElement).dir = 'rtl'
    return el
  }

  it('keeps the cells and the input left-to-right', async () => {
    const el = await renderRtl('value="123"')
    const [first, second, third] = cellElements(el).map((cell) => cell.getBoundingClientRect())

    expect(first?.left).toBeLessThan(second?.left ?? 0)
    expect(second?.left).toBeLessThan(third?.left ?? 0)
    expect(cellElements(el).map((cell) => cell.textContent).join('')).toBe('123')
    expect(getComputedStyle(codeInput(el)).direction).toBe('ltr')
  })

  it('still follows the page direction for the label and messages', async () => {
    const el = await renderRtl('hint="رمز التحقق"')

    expect(getComputedStyle(shadowElement(el, 'label')).direction).toBe('rtl')
    expect(getComputedStyle(shadowElement(el, '.hint')).direction).toBe('rtl')
  })

  it('places the code at the inline start, on the right', async () => {
    const el = await renderRtl()
    const field = shadowElement(el, '.field').getBoundingClientRect()
    const cells = shadowElement(el, '.cells').getBoundingClientRect()

    expect(Math.abs(field.right - cells.right)).toBeLessThan(1)
  })

  it('selects the cell under the pointer', async () => {
    const el = await renderRtl('value="123456"')
    const target = cellElements(el)[1] as HTMLElement

    await userEvent.click(target, { force: true })

    await expect.poll(() => [codeInput(el).selectionStart, codeInput(el).selectionEnd]).toEqual([1, 2])
  })

  it('moves the active cell to the right while typing', async () => {
    const el = await renderRtl()
    codeInput(el).focus()

    await userEvent.keyboard('12')

    const active = cellElements(el).findIndex((cell) => cell.classList.contains('active'))
    expect(active).toBe(2)
  })
})

describe('reflow', () => {
  it('fits eight cells in a 288px container, each at least 24px wide', async () => {
    const el = await renderInContainer('length="8"', '288px')
    const host = el.getBoundingClientRect()
    const cells = cellElements(el).map((cell) => cell.getBoundingClientRect())

    expect(host.width).toBeLessThanOrEqual(288)
    for (const cell of cells) {
      expect(cell.width).toBeGreaterThanOrEqual(24)
      expect(cell.right).toBeLessThanOrEqual(host.right + 0.5)
    }
    expect(new Set(cells.map((cell) => Math.round(cell.width))).size).toBe(1)
  })

  it('shrinks the cells only as much as the container needs', async () => {
    const el = await renderInContainer('', '288px')
    const cells = cellElements(el).map((cell) => cell.getBoundingClientRect())

    expect(cells[0]?.width).toBeLessThan(44)
    expect((cells.at(-1)?.right ?? 0) - (cells[0]?.left ?? 0)).toBeCloseTo(288, 0)
  })

  it('never shrinks a cell below 24px', async () => {
    const el = await renderInContainer('length="12"', '288px')

    for (const cell of cellElements(el)) expect(cell.getBoundingClientRect().width).toBe(24)
  })

  it('keeps the cells at full size and the input over them when there is room', async () => {
    const el = await renderInContainer('length="8"', '600px')
    const cells = shadowElement(el, '.cells').getBoundingClientRect()
    const input = codeInput(el).getBoundingClientRect()

    expect(cellElements(el)[0]?.getBoundingClientRect().width).toBe(44)
    expect([input.left, input.width]).toEqual([cells.left, cells.width])
  })

  it('keeps the input over the shrunk cells', async () => {
    const el = await renderInContainer('length="8"', '288px')
    const cells = shadowElement(el, '.cells').getBoundingClientRect()
    const input = codeInput(el).getBoundingClientRect()

    expect([input.left, input.width]).toEqual([cells.left, cells.width])
  })

  it('does not clip text with the WCAG text spacing override', async () => {
    addPageStyles(`
      * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
      p { margin-bottom: 2em !important; }
    `)
    const el = await renderInContainer(
      'length="8" value="123456" hint="We sent the code to your phone" autosubmit required',
      '288px',
    )
    el.reportValidity()
    await expect.poll(() => shadowElement(el, '.error').textContent).not.toBe('')

    for (const cell of cellElements(el)) expectNoClipping(cell)
    for (const selector of ['label', '.hint', '.notice', '.error']) expectNoClipping(shadowElement(el, selector))
  })

  it('has no axe violations in a narrow right-to-left page', async () => {
    const el = await renderInContainer('lang="ar" length="8"', '288px')
    ;(el.parentElement as HTMLElement).dir = 'rtl'

    await expectNoAxeViolations(el)
  })
})

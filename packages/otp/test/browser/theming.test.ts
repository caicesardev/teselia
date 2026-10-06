import { REQUIRED_TOKEN_CONTRASTS, contrastRatio, resolveColor } from '@teselia/shared/test'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { TesOtpElement } from '../../src/index'
import { codeInput, renderOtp } from '../support/otp'

const addedStyles: HTMLStyleElement[] = []

function addPageStyles(css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  addedStyles.push(style)
}

function parts(el: TesOtpElement, name: string): HTMLElement[] {
  return [...(el.shadowRoot?.querySelectorAll<HTMLElement>(`[part~="${name}"]`) ?? [])]
}

function firstCell(el: TesOtpElement): HTMLElement {
  return parts(el, 'cell')[0] as HTMLElement
}

async function renderInScheme(colorScheme: 'light' | 'dark'): Promise<TesOtpElement> {
  const el = await renderOtp('')
  ;(el.parentElement as HTMLElement).style.colorScheme = colorScheme
  return el
}

const REQUIRED_PARTS = ['field', 'label', 'cells', 'cell', 'hint', 'notice', 'error']

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--tes-color-border')
  for (const style of addedStyles.splice(0)) style.remove()
})

describe.each(['light', 'dark'] as const)('default design tokens in %s color scheme', (scheme) => {
  it.each(REQUIRED_TOKEN_CONTRASTS)('%s on %s meets %s:1', async (foreground, background, minimum) => {
    const el = await renderInScheme(scheme)

    expect(contrastRatio(el, `var(${foreground})`, `var(${background})`)).toBeGreaterThanOrEqual(minimum)
  })

  it('paints the cells with the scheme palette', async () => {
    const el = await renderInScheme(scheme)
    const opposite = await renderInScheme(scheme === 'light' ? 'dark' : 'light')

    const background = (otp: TesOtpElement) => resolveColor(otp, getComputedStyle(firstCell(otp)).backgroundColor)
    expect(background(el)).toEqual(resolveColor(el, 'var(--_bg)'))
    expect(background(el)).not.toEqual(background(opposite))
  })
})

describe('design tokens', () => {
  it('lets consumers override the shared tokens from any ancestor, including :root', async () => {
    document.documentElement.style.setProperty('--tes-color-border', 'rgb(255, 0, 0)')
    const el = await renderOtp('')

    expect(getComputedStyle(firstCell(el)).borderTopColor).toBe('rgb(255, 0, 0)')
  })

  it('applies radius and font tokens set on the element', async () => {
    const el = await renderOtp('')

    el.style.setProperty('--tes-radius', '12px')
    el.style.setProperty('--tes-font-family', 'monospace')

    expect(getComputedStyle(firstCell(el)).borderTopLeftRadius).toBe('12px')
    expect(getComputedStyle(firstCell(el)).fontFamily).toContain('monospace')
  })

  it('draws cells of 44 × 44 px by default, 0.5rem apart', async () => {
    const el = await renderOtp('')
    const [first, second] = parts(el, 'cell').map((cell) => cell.getBoundingClientRect())

    expect(first?.width).toBe(44)
    expect(first?.height).toBe(44)
    expect((second?.left ?? 0) - (first?.right ?? 0)).toBe(8)
  })

  it('sizes and spaces the cells with --tes-otp-cell-size and --tes-otp-cell-gap', async () => {
    const el = await renderOtp('')

    el.style.setProperty('--tes-otp-cell-size', '3.5rem')
    el.style.setProperty('--tes-otp-cell-gap', '2px')
    const [first, second] = parts(el, 'cell').map((cell) => cell.getBoundingClientRect())

    expect(first?.width).toBe(56)
    expect(first?.height).toBe(56)
    expect((second?.left ?? 0) - (first?.right ?? 0)).toBe(2)
  })

  it('keeps the real input covering every cell, whatever the size', async () => {
    const el = await renderOtp('')

    el.style.setProperty('--tes-otp-cell-size', '3.5rem')
    const input = codeInput(el).getBoundingClientRect()
    const cells = (parts(el, 'cells')[0] as HTMLElement).getBoundingClientRect()

    expect(input.width).toBe(cells.width)
    expect(input.height).toBe(cells.height)
  })
})

describe('parts', () => {
  it('exposes every documented part, with one cell per character', async () => {
    const el = await renderOtp('hint="Check your messages" autosubmit length="4"')

    for (const name of REQUIRED_PARTS) {
      expect(parts(el, name), name).not.toHaveLength(0)
    }
    expect(parts(el, 'cell')).toHaveLength(4)
  })

  it('lets page styles reach the cells through ::part()', async () => {
    addPageStyles('tes-otp::part(cell) { background-color: rgb(1, 2, 3); }')
    const el = await renderOtp('')

    expect(getComputedStyle(firstCell(el)).backgroundColor).toBe('rgb(1, 2, 3)')
  })

  it('adds cell-filled only to the cells that hold a character', async () => {
    addPageStyles('tes-otp::part(cell-filled) { color: rgb(4, 5, 6); }')
    const el = await renderOtp('value="12"')

    const colors = parts(el, 'cell').map((cell) => getComputedStyle(cell).color)

    expect(colors.filter((color) => color === 'rgb(4, 5, 6)')).toHaveLength(2)
    expect(parts(el, 'cell-filled')).toEqual(parts(el, 'cell').slice(0, 2))
  })

  it('adds cell-active to the cell under the caret only while the field has focus', async () => {
    const el = await renderOtp('value="12"')
    expect(parts(el, 'cell-active')).toEqual([])

    codeInput(el).focus()
    await userEvent.keyboard('{End}')
    await expect.poll(() => parts(el, 'cell-active')).toEqual([parts(el, 'cell')[2]])

    codeInput(el).blur()
    await expect.poll(() => parts(el, 'cell-active')).toEqual([])
  })
})

describe('custom states', () => {
  it('is :state(empty) only while there are no characters', async () => {
    const el = await renderOtp('')
    expect(el.matches(':state(empty)')).toBe(true)

    await userEvent.type(codeInput(el), '1')
    expect(el.matches(':state(empty)')).toBe(false)

    await userEvent.keyboard('{Backspace}')
    expect(el.matches(':state(empty)')).toBe(true)
  })

  it('is :state(complete) only while every cell is filled, for any length', async () => {
    const el = await renderOtp('length="4"')

    await userEvent.type(codeInput(el), '123')
    expect(el.matches(':state(complete)')).toBe(false)

    await userEvent.keyboard('4')
    expect(el.matches(':state(complete)')).toBe(true)

    el.setAttribute('length', '6')
    await expect.poll(() => el.matches(':state(complete)')).toBe(false)
  })

  it('follows values set from code and form resets', async () => {
    const el = await renderOtp('value="123456"', 'form')
    expect(el.matches(':state(complete)')).toBe(true)

    el.value = ''
    await expect.poll(() => el.matches(':state(empty)')).toBe(true)

    el.closest('form')?.reset()
    await expect.poll(() => el.matches(':state(complete)')).toBe(true)
  })

  it('is :state(invalid) only while an error is shown, like :user-invalid', async () => {
    const el = await renderOtp('required')
    expect(el.checkValidity()).toBe(false)
    expect(el.matches(':state(invalid)')).toBe(false)

    await userEvent.type(codeInput(el), '12')
    codeInput(el).blur()
    await expect.poll(() => el.matches(':state(invalid)')).toBe(true)

    codeInput(el).focus()
    await userEvent.keyboard('{End}3456')
    await expect.poll(() => el.matches(':state(invalid)')).toBe(false)
  })

  it('lets page styles combine :state() with ::part()', async () => {
    addPageStyles('tes-otp:state(complete)::part(cell) { border-color: rgb(7, 8, 9); }')
    const el = await renderOtp('')

    await userEvent.type(codeInput(el), '123456')

    await expect.poll(() => getComputedStyle(firstCell(el)).borderTopColor).toBe('rgb(7, 8, 9)')
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import type { TesPhoneElement } from './index'
import './index'

type Rgb = [number, number, number]

async function renderInScheme(colorScheme: 'light' | 'dark'): Promise<TesPhoneElement> {
  const wrapper = document.createElement('div')
  wrapper.style.colorScheme = colorScheme
  wrapper.innerHTML = '<tes-phone label="Phone number"></tes-phone>'
  document.body.append(wrapper)

  const el = wrapper.querySelector('tes-phone') as TesPhoneElement
  await expect.poll(() => el.shadowRoot?.querySelector('input')).toBeTruthy()
  return el
}

function resolveColor(el: TesPhoneElement, cssColor: string): Rgb {
  const probe = document.createElement('span')
  probe.style.color = cssColor
  el.shadowRoot?.append(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()

  const context = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
  context.fillStyle = computed
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return [r ?? 0, g ?? 0, b ?? 0]
}

function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (channel: number): number => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

const TEXT_MINIMUM = 4.5
const NON_TEXT_MINIMUM = 3

const requiredContrasts: Array<[foreground: string, background: string, minimum: number]> = [
  ['--_text', '--_bg', TEXT_MINIMUM],
  ['--_muted', '--_bg', TEXT_MINIMUM],
  ['--_error', '--_bg', TEXT_MINIMUM],
  ['--_on-accent', '--_accent', TEXT_MINIMUM],
  ['--_text', '--_hover', TEXT_MINIMUM],
  ['--_border', '--_bg', NON_TEXT_MINIMUM],
  ['--_focus', '--_bg', NON_TEXT_MINIMUM],
  ['--_accent', '--_bg', NON_TEXT_MINIMUM],
]

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--tes-color-border')
})

describe.each(['light', 'dark'] as const)('default design tokens in %s color scheme', (scheme) => {
  it.each(requiredContrasts)('%s on %s meets %s:1', async (foreground, background, minimum) => {
    const el = await renderInScheme(scheme)

    const ratio = contrastRatio(
      resolveColor(el, `var(${foreground})`),
      resolveColor(el, `var(${background})`),
    )

    expect(ratio).toBeGreaterThanOrEqual(minimum)
  })

  it('uses a different palette than the other scheme', async () => {
    const el = await renderInScheme(scheme)
    const opposite = await renderInScheme(scheme === 'light' ? 'dark' : 'light')

    expect(resolveColor(el, 'var(--_bg)')).not.toEqual(resolveColor(opposite, 'var(--_bg)'))
  })
})

describe('design token overrides and sizing', () => {
  it('lets consumers override tokens from any ancestor, including :root', async () => {
    document.documentElement.style.setProperty('--tes-color-border', 'rgb(255, 0, 0)')
    const el = await renderInScheme('light')

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement

    expect(getComputedStyle(input).borderTopColor).toBe('rgb(255, 0, 0)')
  })

  it('renders controls well above the 24 × 24 px minimum target size', async () => {
    const el = await renderInScheme('light')

    const { height } = (el.shadowRoot?.querySelector('input') as HTMLInputElement).getBoundingClientRect()

    expect(height).toBeGreaterThanOrEqual(44)
  })
})

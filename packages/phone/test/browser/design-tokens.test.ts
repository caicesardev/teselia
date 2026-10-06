import { afterEach, describe, expect, it } from 'vitest'
import type { TesPhoneElement } from '../../src/index'
import '../../src/index'
import { REQUIRED_TOKEN_CONTRASTS, contrastRatio, resolveColor } from '@teselia/shared/test'

async function renderInScheme(colorScheme: 'light' | 'dark'): Promise<TesPhoneElement> {
  const wrapper = document.createElement('div')
  wrapper.style.colorScheme = colorScheme
  wrapper.innerHTML = '<tes-phone label="Phone number"></tes-phone>'
  document.body.append(wrapper)

  const el = wrapper.querySelector('tes-phone') as TesPhoneElement
  await expect.poll(() => el.shadowRoot?.querySelector<HTMLInputElement>('#number')).toBeTruthy()
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--tes-color-border')
})

describe.each(['light', 'dark'] as const)('default design tokens in %s color scheme', (scheme) => {
  it.each(REQUIRED_TOKEN_CONTRASTS)('%s on %s meets %s:1', async (foreground, background, minimum) => {
    const el = await renderInScheme(scheme)

    expect(contrastRatio(el, `var(${foreground})`, `var(${background})`)).toBeGreaterThanOrEqual(minimum)
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

    const input = el.shadowRoot?.querySelector<HTMLInputElement>('#number') as HTMLInputElement

    expect(getComputedStyle(input).borderTopColor).toBe('rgb(255, 0, 0)')
  })

  it('renders controls well above the 24 × 24 px minimum target size', async () => {
    const el = await renderInScheme('light')

    const { height } = (el.shadowRoot?.querySelector<HTMLInputElement>('#number') as HTMLInputElement).getBoundingClientRect()

    expect(height).toBeGreaterThanOrEqual(44)
  })
})

type Rgb = [number, number, number]

const TEXT_MINIMUM = 4.5
const NON_TEXT_MINIMUM = 3

export const REQUIRED_TOKEN_CONTRASTS: Array<[foreground: string, background: string, minimum: number]> = [
  ['--_text', '--_bg', TEXT_MINIMUM],
  ['--_muted', '--_bg', TEXT_MINIMUM],
  ['--_error', '--_bg', TEXT_MINIMUM],
  ['--_on-accent', '--_accent', TEXT_MINIMUM],
  ['--_text', '--_hover', TEXT_MINIMUM],
  ['--_border', '--_bg', NON_TEXT_MINIMUM],
  ['--_focus', '--_bg', NON_TEXT_MINIMUM],
  ['--_accent', '--_bg', NON_TEXT_MINIMUM],
]

export function resolveColor(host: HTMLElement, cssColor: string): Rgb {
  const probe = document.createElement('span')
  probe.style.color = cssColor
  host.shadowRoot?.append(probe)
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

export function contrastRatio(host: HTMLElement, foreground: string, background: string): number {
  const luminances = [foreground, background].map((color) => relativeLuminance(resolveColor(host, color)))
  const [lighter, darker] = luminances.sort((x, y) => y - x)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

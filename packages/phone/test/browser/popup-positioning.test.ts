import { afterEach, describe, expect, it } from 'vitest'

const anchoredPopupStyles = `
  input {
    anchor-name: --country;
    block-size: 2.75rem;
    inline-size: 8rem;
  }

  [popover] {
    position-anchor: --country;
    position-area: block-end span-inline-end;
    position-try-fallbacks: flip-block;
    inset: auto;
    margin: 0;
    padding: 0;
    min-inline-size: anchor-size(inline);
    max-block-size: 12rem;
    overflow: auto;
  }

  [role='option'] {
    block-size: 2rem;
  }
`

interface AnchoredPopup {
  host: HTMLElement
  root: ShadowRoot
  input: HTMLInputElement
  listbox: HTMLElement
}

function renderAnchoredPopup(hostStyles: string): AnchoredPopup {
  const host = document.createElement('div')
  host.style.cssText = hostStyles
  document.body.append(host)

  const root = host.attachShadow({ mode: 'open' })
  const options = Array.from({ length: 8 }, (_, i) => `<li role="option">Country ${i}</li>`).join('')
  root.innerHTML = `
    <style>${anchoredPopupStyles}</style>
    <input role="combobox" aria-label="Country code" aria-controls="countries" />
    <ul id="countries" role="listbox" popover="manual">${options}</ul>
  `

  return {
    host,
    root,
    input: root.querySelector('input') as HTMLInputElement,
    listbox: root.querySelector('[role="listbox"]') as HTMLElement,
  }
}

function centerOf(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('country listbox positioning (Popover API + CSS anchor positioning)', () => {
  it('is not clipped by an ancestor with overflow: hidden', () => {
    const { host, root, listbox } = renderAnchoredPopup(
      'position: relative; overflow: hidden; block-size: 3rem; margin: 2rem',
    )

    listbox.showPopover()

    const hostBottom = host.getBoundingClientRect().bottom
    const optionBelowClipEdge = Array.from(listbox.querySelectorAll('li')).find(
      (option) => centerOf(option.getBoundingClientRect()).y > hostBottom,
    )
    expect(optionBelowClipEdge).toBeDefined()

    const { x, y } = centerOf((optionBelowClipEdge as HTMLElement).getBoundingClientRect())
    expect(root.elementFromPoint(x, y)).toBe(optionBelowClipEdge)
  })

  it('opens directly below the input, aligned to its start and at least as wide', () => {
    const { input, listbox } = renderAnchoredPopup('margin: 2rem')

    listbox.showPopover()

    const inputRect = input.getBoundingClientRect()
    const listRect = listbox.getBoundingClientRect()
    expect(Math.abs(listRect.top - inputRect.bottom)).toBeLessThanOrEqual(1)
    expect(Math.abs(listRect.left - inputRect.left)).toBeLessThanOrEqual(1)
    expect(listRect.width).toBeGreaterThanOrEqual(inputRect.width - 1)
  })

  it('flips above the input when there is no room below', () => {
    const { input, listbox } = renderAnchoredPopup('position: fixed; inset-block-end: 0.5rem; inset-inline-start: 2rem')

    listbox.showPopover()

    const inputRect = input.getBoundingClientRect()
    const listRect = listbox.getBoundingClientRect()
    expect(Math.abs(listRect.bottom - inputRect.top)).toBeLessThanOrEqual(1)
    expect(listRect.bottom).toBeLessThanOrEqual(window.innerHeight)
  })

  it('stays on top of page elements with the highest z-index', () => {
    const { host, listbox } = renderAnchoredPopup('margin: 2rem')
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647'
    document.body.append(overlay)

    listbox.showPopover()

    const { x, y } = centerOf(listbox.getBoundingClientRect())
    expect(document.elementFromPoint(x, y)).toBe(host)
  })

  it('keeps focus on the combobox input when it opens', () => {
    const { root, input, listbox } = renderAnchoredPopup('margin: 2rem')
    input.focus()

    listbox.showPopover()

    expect(root.activeElement).toBe(input)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  activeDescendant,
  combobox,
  expectNoAxeViolations,
  isExpanded,
  listbox,
  numberInput,
  options,
  renderPhone,
  typeInCombobox,
} from '../support/phone'

async function focusCombobox(attributes = 'default-country="ES" lang="en"') {
  const el = await renderPhone(attributes)
  combobox(el).focus()
  return el
}

function optionIds(el: Parameters<typeof options>[0]): string[] {
  return options(el).map((option) => option.id)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('country combobox keyboard: ArrowDown', () => {
  it('opens a closed listbox and highlights the selected country', async () => {
    const el = await focusCombobox()

    await userEvent.keyboard('{ArrowDown}')

    expect(isExpanded(el)).toBe(true)
    expect(activeDescendant(el)).toBe('option-ES')
  })

  it('scrolls the highlighted option into view', async () => {
    const el = await focusCombobox()

    await userEvent.keyboard('{ArrowDown}')

    const list = listbox(el).getBoundingClientRect()
    const highlighted = (el.shadowRoot?.getElementById('option-ES') as HTMLElement).getBoundingClientRect()
    expect(highlighted.top).toBeGreaterThanOrEqual(list.top)
    expect(highlighted.bottom).toBeLessThanOrEqual(list.bottom)
  })

  it('moves the highlight to the next option when open', async () => {
    const el = await focusCombobox()
    await userEvent.keyboard('{ArrowDown}')
    const ids = optionIds(el)

    await userEvent.keyboard('{ArrowDown}')

    expect(activeDescendant(el)).toBe(ids[ids.indexOf('option-ES') + 1])
  })

  it('wraps from the last option to the first', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'united')
    await userEvent.keyboard('{ArrowUp}')
    expect(activeDescendant(el)).toBe('option-US')

    await userEvent.keyboard('{ArrowDown}')

    expect(activeDescendant(el)).toBe('option-AE')
  })

  it('highlights the first match after typing', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'united')

    await userEvent.keyboard('{ArrowDown}')

    expect(activeDescendant(el)).toBe('option-AE')
  })
})

describe('country combobox keyboard: ArrowUp', () => {
  it('opens a closed listbox and highlights the selected country', async () => {
    const el = await focusCombobox()

    await userEvent.keyboard('{ArrowUp}')

    expect(isExpanded(el)).toBe(true)
    expect(activeDescendant(el)).toBe('option-ES')
  })

  it('moves the highlight to the previous option when open', async () => {
    const el = await focusCombobox()
    await userEvent.keyboard('{ArrowDown}')
    const ids = optionIds(el)

    await userEvent.keyboard('{ArrowUp}')

    expect(activeDescendant(el)).toBe(ids[ids.indexOf('option-ES') - 1])
  })

  it('highlights the last match after typing', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'united')

    await userEvent.keyboard('{ArrowUp}')

    expect(activeDescendant(el)).toBe('option-US')
  })
})

describe('country combobox keyboard: Alt+ArrowDown', () => {
  it('opens the listbox without highlighting anything', async () => {
    const el = await focusCombobox()

    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')

    expect(isExpanded(el)).toBe(true)
    expect(activeDescendant(el)).toBeNull()
  })
})

describe('country combobox keyboard: Enter', () => {
  it('selects the highlighted country, closes and keeps focus in the combobox', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'germ')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{Enter}')

    expect(el.country).toBe('DE')
    expect(combobox(el).value).toBe('Germany +49')
    expect(isExpanded(el)).toBe(false)
    expect(el.shadowRoot?.activeElement).toBe(combobox(el))
  })

  it('selects nothing when no option is highlighted', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'germ')

    await userEvent.keyboard('{Enter}')

    expect(el.country).toBe('ES')
    expect(isExpanded(el)).toBe(true)
  })

  it('does not reach the page while the listbox is open', async () => {
    const el = await focusCombobox()
    let submitted = false
    el.closest('main')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.defaultPrevented) submitted = true
    })
    await typeInCombobox(el, 'germ')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{Enter}')

    expect(submitted).toBe(false)
  })
})

describe('country combobox keyboard: Escape', () => {
  it('closes the listbox and restores the selected country', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'germ')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{Escape}')

    expect(isExpanded(el)).toBe(false)
    expect(el.country).toBe('ES')
    expect(combobox(el).value).toBe('Spain +34')
  })

  it('does not propagate while closing the listbox, so an enclosing dialog stays open', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'germ')
    let escapeReachedPage = false
    const recordEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') escapeReachedPage = true
    }
    document.addEventListener('keydown', recordEscape)

    await userEvent.keyboard('{Escape}')
    document.removeEventListener('keydown', recordEscape)

    expect(escapeReachedPage).toBe(false)
  })

  it('restores the selected country when closed after typing a query with no matches', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'zzz')
    expect(isExpanded(el)).toBe(false)

    await userEvent.keyboard('{Escape}')

    expect(combobox(el).value).toBe('Spain +34')
  })
})

describe('country combobox keyboard: Home and End', () => {
  it('move the caret in the text without changing the highlight', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'united')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{Home}')
    expect(combobox(el).selectionStart).toBe(0)

    await userEvent.keyboard('{End}')
    expect(combobox(el).selectionStart).toBe('united'.length)
    expect(activeDescendant(el)).toBe('option-AE')
    expect(isExpanded(el)).toBe(true)
  })
})

describe('country combobox keyboard: Tab', () => {
  it('closes without changing the selection and moves focus to the number field', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'germ')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.tab()

    expect(isExpanded(el)).toBe(false)
    expect(el.country).toBe('ES')
    expect(el.shadowRoot?.activeElement).toBe(numberInput(el))
  })
})

describe('country combobox keyboard: highlight', () => {
  it('clears the highlight when the query changes', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'united')
    await userEvent.keyboard('{ArrowDown}')

    await userEvent.keyboard('{Backspace}')

    expect(activeDescendant(el)).toBeNull()
  })

  it('shows a visible highlight that differs from other options', async () => {
    const el = await focusCombobox()
    await typeInCombobox(el, 'united')
    await userEvent.keyboard('{ArrowDown}')

    const [highlighted, other] = options(el)
    const style = (option: HTMLElement | undefined) => getComputedStyle(option as HTMLElement)

    expect(style(highlighted).boxShadow).not.toBe('none')
    expect(style(other).boxShadow).toBe('none')
    expect(style(highlighted).backgroundColor).not.toBe(style(other).backgroundColor)
  })

  it('has no axe violations while an option is highlighted', async () => {
    const el = await focusCombobox()
    await userEvent.keyboard('{ArrowDown}')

    await expectNoAxeViolations(el)
  })
})

describe('country combobox keyboard: replacing the selected country', () => {
  function collapseSelectionToEnd(input: HTMLInputElement): void {
    input.setSelectionRange(input.value.length, input.value.length)
  }

  it('starts a new search even if the text was not selected on focus', async () => {
    const el = await focusCombobox()
    collapseSelectionToEnd(combobox(el))

    await userEvent.keyboard('united')

    expect(combobox(el).value).toBe('united')
    expect(optionIds(el)).toEqual(['option-AE', 'option-GB', 'option-US'])
  })

  it('clears the selected country text on Backspace and shows every country', async () => {
    const el = await focusCombobox()
    collapseSelectionToEnd(combobox(el))

    await userEvent.keyboard('{Backspace}')

    expect(combobox(el).value).toBe('')
    expect(isExpanded(el)).toBe(true)
    expect(options(el).length).toBeGreaterThan(200)
  })

  it('keeps editing normally once a search has started', async () => {
    const el = await focusCombobox()
    await userEvent.keyboard('unitedx{Backspace}')

    expect(combobox(el).value).toBe('united')
  })
})

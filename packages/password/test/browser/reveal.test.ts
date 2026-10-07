import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import type { TesPasswordElement } from '../../src/index'
import { expectNoAxeViolations, passwordInput, renderPassword } from '../support/password'

function toggle(el: TesPasswordElement): HTMLButtonElement {
  return el.querySelector('.tes-password__toggle') as HTMLButtonElement
}

function visibleToggleText(el: TesPasswordElement): string {
  const texts = [...toggle(el).querySelectorAll<HTMLElement>('.tes-password__toggle-text')]
  return texts
    .filter((text) => getComputedStyle(text).visibility === 'visible')
    .map((text) => text.textContent?.trim())
    .join('|')
}

function liveRegion(el: TesPasswordElement): HTMLElement {
  return el.querySelector('[role="status"]') as HTMLElement
}

function formOf(el: TesPasswordElement): HTMLFormElement {
  return el.closest('form') as HTMLFormElement
}

function recordRevealChanges(el: TesPasswordElement): unknown[] {
  const details: unknown[] = []
  el.addEventListener('revealchange', (event) => details.push((event as CustomEvent).detail))
  return details
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('show/hide button', () => {
  it('is a text button named after its action, without aria-pressed', async () => {
    const el = await renderPassword('')

    expect(toggle(el).type).toBe('button')
    expect(visibleToggleText(el)).toBe('Show')
    expect(toggle(el).hasAttribute('aria-pressed')).toBe(false)
    await expect.element(page.getByRole('button', { name: 'Show password' })).toBeVisible()
  })

  it('shows and hides the password on click, keeping the value untouched', async () => {
    const el = await renderPassword('value="correct horse"')

    await userEvent.click(toggle(el))

    expect(passwordInput(el).type).toBe('text')
    expect(visibleToggleText(el)).toBe('Hide')
    await expect.element(page.getByRole('button', { name: 'Hide password' })).toBeVisible()
    expect(el.revealed).toBe(true)

    await userEvent.click(toggle(el))

    expect(passwordInput(el).type).toBe('password')
    expect(visibleToggleText(el)).toBe('Show')
    expect(el.value).toBe('correct horse')
  })

  it('is reached with Tab after the input, and works with Space and Enter while keeping focus', async () => {
    const el = await renderPassword('')
    passwordInput(el).focus()

    await userEvent.tab()
    expect(document.activeElement).toBe(toggle(el))

    await userEvent.keyboard(' ')
    expect(passwordInput(el).type).toBe('text')
    expect(document.activeElement).toBe(toggle(el))

    await userEvent.keyboard('{Enter}')
    expect(passwordInput(el).type).toBe('password')
    expect(document.activeElement).toBe(toggle(el))
  })

  it('never submits the form', async () => {
    const el = await renderPassword('name="password"', 'form')
    let submissions = 0
    formOf(el).addEventListener('submit', (event) => {
      event.preventDefault()
      submissions += 1
    })

    await userEvent.click(toggle(el))

    expect(submissions).toBe(0)
  })

  it('announces the new state when the user toggles it', async () => {
    const el = await renderPassword('')

    await userEvent.click(toggle(el))
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Your password is shown')

    await userEvent.click(toggle(el))
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Your password is hidden')
  })

  it('takes custom texts', async () => {
    const el = await renderPassword(
      'text-show="Mostrar" text-hide="Ocultar" text-show-label="Mostrar contraseña" text-hide-label="Ocultar contraseña" text-shown="Contraseña visible" text-hidden="Contraseña oculta"',
    )
    expect(visibleToggleText(el)).toBe('Mostrar')
    expect(toggle(el).getAttribute('aria-label')).toBe('Mostrar contraseña')

    await userEvent.click(toggle(el))

    expect(visibleToggleText(el)).toBe('Ocultar')
    expect(toggle(el).getAttribute('aria-label')).toBe('Ocultar contraseña')
    await expect.poll(() => liveRegion(el).textContent?.trim()).toBe('Contraseña visible')
  })

  it('has no axe violations while the password is shown', async () => {
    const el = await renderPassword('value="correct horse"')
    await userEvent.click(toggle(el))

    await expectNoAxeViolations(el)
  })
})

describe('revealed property and revealchange event', () => {
  it('shows and hides from code, firing revealchange each time the state changes', async () => {
    const el = await renderPassword('')
    const changes = recordRevealChanges(el)

    el.revealed = true
    el.revealed = true
    await expect.poll(() => passwordInput(el).type).toBe('text')
    el.revealed = false

    expect(changes).toEqual([{ revealed: true }, { revealed: false }])
  })

  it('fires a bubbling, composed CustomEvent for user toggles too', async () => {
    const el = await renderPassword('')
    const events: CustomEvent[] = []
    document.addEventListener('revealchange', (event) => events.push(event as CustomEvent), { once: true })

    await userEvent.click(toggle(el))

    expect(events[0]?.detail).toEqual({ revealed: true })
    expect(events[0]?.bubbles && events[0]?.composed).toBe(true)
  })

  it('does not announce changes made from code', async () => {
    const el = await renderPassword('')

    el.revealed = true
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(liveRegion(el).textContent?.trim()).toBe('')
  })
})

describe('hiding the password again', () => {
  it('hides it before the form submit event, whichever way the form is submitted', async () => {
    const el = await renderPassword('name="password" value="secret"', 'form')
    const typesAtSubmit: string[] = []
    formOf(el).addEventListener('submit', (event) => {
      event.preventDefault()
      typesAtSubmit.push(passwordInput(el).type)
    })
    const submitButton = Object.assign(document.createElement('button'), { textContent: 'Sign in' })
    formOf(el).append(submitButton)

    el.revealed = true
    passwordInput(el).focus()
    await userEvent.keyboard('{Enter}')

    el.revealed = true
    await userEvent.click(submitButton)

    el.revealed = true
    await expect.poll(() => passwordInput(el).type).toBe('text')
    formOf(el).requestSubmit()

    expect(typesAtSubmit).toEqual(['password', 'password', 'password'])
    expect(el.revealed).toBe(false)
  })

  it('hides it on form reset', async () => {
    const el = await renderPassword('name="password"', 'form')
    el.revealed = true

    formOf(el).reset()

    expect(el.revealed).toBe(false)
    await expect.poll(() => passwordInput(el).type).toBe('password')
  })

  it('hides it when the page is hidden for navigation', async () => {
    const el = await renderPassword('')
    el.revealed = true

    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))

    expect(el.revealed).toBe(false)
  })

  it('leaves passwords in other forms alone', async () => {
    const first = await renderPassword('name="password"', 'form')
    const second = await renderPassword('name="password"', 'form')
    formOf(first).addEventListener('submit', (event) => event.preventDefault())
    second.revealed = true

    formOf(first).requestSubmit()
    formOf(first).reset()

    expect(second.revealed).toBe(true)
  })

  it('stops listening once the element is removed', async () => {
    const el = await renderPassword('')
    el.revealed = true
    const changes = recordRevealChanges(el)

    el.remove()
    await new Promise((resolve) => setTimeout(resolve))
    window.dispatchEvent(new PageTransitionEvent('pagehide'))

    expect(changes).toEqual([])
  })
})

describe('layout', () => {
  it.each([
    ['', 'Show and Hide'],
    ['text-show="Mostrar" text-hide="Ocultar"', 'translated labels'],
  ])('keeps the button and the input the same width when toggled, with %j (%s)', async (attributes) => {
    const el = await renderPassword(attributes)
    const widths = () => [toggle(el).getBoundingClientRect().width, passwordInput(el).getBoundingClientRect().width]
    const hidden = widths()

    el.revealed = true
    await expect.poll(() => passwordInput(el).type).toBe('text')
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(widths()).toEqual(hidden)
  })

  it('sits inside the field at the end, never covering the text', async () => {
    const el = await renderPassword('')
    const input = passwordInput(el).getBoundingClientRect()
    const button = toggle(el).getBoundingClientRect()
    const control = (el.querySelector('.tes-password__control') as HTMLElement).getBoundingClientRect()

    expect(input.right).toBeLessThanOrEqual(button.left)
    expect(button.right).toBeLessThanOrEqual(control.right)
    expect(control.height).toBe(44)
    expect(button.width).toBeGreaterThanOrEqual(44)
    expect(button.height).toBeGreaterThanOrEqual(42)
    expect(button.height).toBeLessThanOrEqual(control.height)
    const [show, hide] = [...toggle(el).querySelectorAll('.tes-password__toggle-text')].map((text) => text.getBoundingClientRect())
    expect(hide?.top).toBe(show?.top)
    expect((show?.bottom ?? 0) <= button.bottom && (show?.top ?? 0) >= button.top).toBe(true)
  })

  it('keeps a long translated label inside the field', async () => {
    const el = await renderPassword('text-show="Mostrar contraseña"')
    const button = toggle(el).getBoundingClientRect()
    const control = (el.querySelector('.tes-password__control') as HTMLElement).getBoundingClientRect()

    expect(button.right).toBeLessThanOrEqual(control.right)
    expect(passwordInput(el).getBoundingClientRect().width).toBeGreaterThan(0)
  })
})

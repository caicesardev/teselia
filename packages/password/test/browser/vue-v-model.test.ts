import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, h, nextTick, ref, vModelText, withDirectives } from 'vue'
import type { TesPasswordElement } from '../../src/index'
import { passwordInput } from '../support/password'

async function mountWithVModel(initial: string) {
  const model = ref(initial)
  const updates: string[] = []
  const container = document.createElement('main')
  document.body.append(container)

  createApp({
    render: () =>
      withDirectives(
        h('tes-password', {
          label: 'Password',
          'onUpdate:modelValue': (value: string) => {
            model.value = value
            updates.push(value)
          },
        }),
        [[vModelText, model.value]],
      ),
  }).mount(container)

  const el = container.querySelector('tes-password') as TesPasswordElement
  await expect.poll(() => el.querySelector('.tes-password__input')).toBeTruthy()
  return { el, model, updates }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Vue v-model', () => {
  it('fills the field from the initial model value', async () => {
    const { el } = await mountWithVModel('correct horse')

    expect(el.value).toBe('correct horse')
    expect(passwordInput(el).value).toBe('correct horse')
  })

  it('updates the model once per keystroke, with the value as typed', async () => {
    const { el, model, updates } = await mountWithVModel('')
    passwordInput(el).focus()

    await userEvent.keyboard(' a B')

    expect(model.value).toBe(' a B')
    expect(updates).toEqual([' ', ' a', ' a ', ' a B'])
  })

  it('updates the field when the model changes', async () => {
    const { el, model } = await mountWithVModel('')

    model.value = 'battery staple'
    await nextTick()

    expect(el.value).toBe('battery staple')
    expect(passwordInput(el).value).toBe('battery staple')
  })
})

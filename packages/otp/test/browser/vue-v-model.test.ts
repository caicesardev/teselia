import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, h, nextTick, ref, vModelText, withDirectives } from 'vue'
import type { TesOtpElement } from '../../src/index'
import { codeInput } from '../support/otp'

async function mountWithVModel(initial: string) {
  const model = ref(initial)
  const container = document.createElement('main')
  document.body.append(container)

  createApp({
    render: () =>
      withDirectives(
        h('tes-otp', {
          label: 'Verification code',
          'onUpdate:modelValue': (value: string) => {
            model.value = value
          },
        }),
        [[vModelText, model.value]],
      ),
  }).mount(container)

  const el = container.querySelector('tes-otp') as TesOtpElement
  await expect.poll(() => el.shadowRoot?.querySelector('#code')).toBeTruthy()
  return { el, model }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Vue v-model', () => {
  it('fills the cells from the initial model value', async () => {
    const { el } = await mountWithVModel('123456')

    expect(el.value).toBe('123456')
    expect(codeInput(el).value).toBe('123456')
  })

  it('updates the model with the normalized code as the user types', async () => {
    const { el, model } = await mountWithVModel('')

    await userEvent.type(codeInput(el), '12a3')

    expect(model.value).toBe('123')
  })

  it('updates the field when the model changes', async () => {
    const { el, model } = await mountWithVModel('')

    model.value = '654321'
    await nextTick()

    expect(el.value).toBe('654321')
  })
})

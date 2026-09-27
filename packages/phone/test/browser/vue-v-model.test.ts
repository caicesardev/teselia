import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, h, nextTick, ref, vModelText, withDirectives } from 'vue'
import type { TesPhoneElement } from '../../src/index'
import '../../src/index'
import { numberInput } from '../support/phone'

async function mountWithVModel(initial: string) {
  const model = ref(initial)
  const container = document.createElement('main')
  document.body.append(container)

  createApp({
    render: () =>
      withDirectives(
        h('tes-phone', {
          label: 'Phone number',
          defaultCountry: 'ES',
          'onUpdate:modelValue': (value: string) => {
            model.value = value
          },
        }),
        [[vModelText, model.value]],
      ),
  }).mount(container)

  const el = container.querySelector('tes-phone') as TesPhoneElement
  await expect.poll(() => el.shadowRoot?.querySelector('#number')).toBeTruthy()
  return { el, model }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Vue v-model', () => {
  it('fills the field from the initial model value', async () => {
    const { el } = await mountWithVModel('+442079460958')

    expect(el.country).toBe('GB')
    expect(numberInput(el).value).toBe('020 7946 0958')
  })

  it('updates the model with the E.164 value as the user types', async () => {
    const { el, model } = await mountWithVModel('')

    await userEvent.type(numberInput(el), '612345678')

    expect(model.value).toBe('+34612345678')
  })

  it('updates the field when the model changes', async () => {
    const { el, model } = await mountWithVModel('')

    model.value = '+33612345678'
    await nextTick()

    expect(el.country).toBe('FR')
    expect(el.value).toBe('+33612345678')
  })
})

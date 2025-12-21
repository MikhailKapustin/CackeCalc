import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import IngredientForm from '@/components/ingredients/IngredientForm.vue'

describe('IngredientForm', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(IngredientForm, {
      global: {
        plugins: [createPinia(), Quasar]
      }
    })
  })

  it('should render all form fields', () => {
    expect(wrapper.find('[data-test="ingredient-name"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-price"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-amount"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-unit"]').exists()).toBe(true)
  })

  it('should validate required name field', async () => {
    const nameInput = wrapper.find('[data-test="ingredient-name"]')

    await nameInput.setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Название обязательно')
  })

  it('should validate price as positive number', async () => {
    // Set values directly on the component's data
    wrapper.vm.formData.name = 'Тест'
    wrapper.vm.formData.purchasePrice = -10
    wrapper.vm.formData.purchaseAmount = 1

    await wrapper.vm.$nextTick()

    // Call submit directly
    wrapper.vm.onSubmit()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Цена должна быть положительным числом')
  })

  it('should emit save event with correct data', async () => {
    // Set values directly on the component's data
    wrapper.vm.formData.name = 'Мука'
    wrapper.vm.formData.purchasePrice = 120
    wrapper.vm.formData.purchaseAmount = 2
    wrapper.vm.formData.purchaseUnit = 'kg'
    wrapper.vm.formData.type = 'weight'

    await wrapper.vm.$nextTick()

    // Call submit directly
    wrapper.vm.onSubmit()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'Мука',
      purchasePrice: 120,
      purchaseAmount: 2,
      purchaseUnit: 'kg',
      type: 'weight'
    })
  })

  it('should calculate and display price per base unit', async () => {
    // Set values directly on the component's data
    wrapper.vm.formData.purchasePrice = 120
    wrapper.vm.formData.purchaseAmount = 2
    wrapper.vm.formData.purchaseUnit = 'kg'

    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="price-per-unit"]').text()).toContain('0.06')
  })

  it('should prefill form when editing existing ingredient', async () => {
    const ingredient = {
      id: 1,
      name: 'Мука',
      purchasePrice: 120,
      purchaseAmount: 2,
      purchaseUnit: 'kg',
      type: 'weight',
      pricePerBaseUnit: 0.06
    }

    wrapper = mount(IngredientForm, {
      props: { ingredient, mode: 'edit' },
      global: {
        plugins: [createPinia(), Quasar]
      }
    })

    expect(wrapper.find('[data-test="ingredient-name"]').element.value).toBe('Мука')
    expect(wrapper.find('[data-test="purchase-price"]').element.value).toBe('120')
  })
})

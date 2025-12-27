import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import OrderCalculator from '@/components/calculator/OrderCalculator.vue'
import { useRecipesStore } from '@/stores/recipes'

describe('OrderCalculator', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useRecipesStore()

    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        sellingPrice: 2000,
        sellingUnit: 'kg',
        totalCost: 500
      },
      {
        id: 2,
        name: 'Капкейк',
        sellingPrice: 150,
        sellingUnit: 'pcs',
        totalCost: 50
      }
    ]

    wrapper = mount(OrderCalculator, {
      global: {
        plugins: [Quasar]
      }
    })
  })

  it('should display recipe selector', () => {
    expect(wrapper.find('[data-test="recipe-select"]').exists()).toBe(true)
  })

  it('should display weight/quantity input', () => {
    expect(wrapper.find('[data-test="weight-input"]').exists()).toBe(true)
  })

  it('should calculate total price correctly', async () => {
    // Set values directly via component instance
    wrapper.vm.selectedRecipeId = 1
    wrapper.vm.weight = 2.5
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('5 000')
  })

  it('should display profit for confectioner (not in receipt)', async () => {
    wrapper.vm.selectedRecipeId = 1
    wrapper.vm.weight = 2
    await wrapper.vm.$nextTick()

    // Прибыль: (2000 - 500) × 2 = 3000₽
    expect(wrapper.find('[data-test="profit"]').text()).toContain('3 000')
    expect(wrapper.find('[data-test="profit"]').classes()).toContain('text-caption')
  })

  it('should show share button when total is calculated', async () => {
    wrapper.vm.selectedRecipeId = 1
    wrapper.vm.weight = 2
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="share-button"]').exists()).toBe(true)
  })

  it('should generate receipt text when share button clicked', async () => {
    wrapper.vm.selectedRecipeId = 1
    wrapper.vm.weight = 2.5
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-test="share-button"]').trigger('click')

    expect(wrapper.emitted('share')).toBeTruthy()
  })

  it('should update total when weight changes', async () => {
    wrapper.vm.selectedRecipeId = 1
    wrapper.vm.weight = 2
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('4 000')

    wrapper.vm.weight = 3
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('6 000')
  })

  it('should handle piece-based recipes', async () => {
    wrapper.vm.selectedRecipeId = 2
    wrapper.vm.weight = 10
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('1 500')
    expect(wrapper.find('[data-test="unit-label"]').text()).toBe('шт')
  })

  it('should validate weight input as positive number', async () => {
    wrapper.vm.selectedRecipeId = 1

    // Share button should not show when weight is negative or zero
    wrapper.vm.weight = -5
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="share-button"]').exists()).toBe(false)

    wrapper.vm.weight = 0
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="share-button"]').exists()).toBe(false)

    // Share button should show when weight is positive
    wrapper.vm.weight = 2
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="share-button"]').exists()).toBe(true)
  })
})

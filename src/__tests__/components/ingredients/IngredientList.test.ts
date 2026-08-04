import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import IngredientList from '@/components/ingredients/IngredientList.vue'
import { useIngredientsStore } from '@/stores/ingredients'
import { createTestI18n } from '../../helpers/i18n'

describe('IngredientList', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useIngredientsStore()

    wrapper = mount(IngredientList, {
      global: {
        plugins: [Quasar, createTestI18n()]
      }
    })
  })

  it('should display empty state when no ingredients', () => {
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Добавьте первый ингредиент')
  })

  it('should display ingredients list', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('[data-test="ingredient-item"]')
    expect(items).toHaveLength(2)
  })

  it('should filter ingredients when searching', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('мука')
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('[data-test="ingredient-item"]')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('Мука пшеничная')
  })

  it('should display no results message when search has no matches', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('несуществующий')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="no-results"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ничего не найдено по запросу')
  })

  it('should emit edit event when edit button clicked', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    await wrapper.vm.$nextTick()

    await wrapper.find('[data-test="edit-button"]').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toBe(1)
  })

  it('should confirm before deleting ingredient', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('[data-test="delete-button"]')
    await deleteButton.trigger('click')

    // Проверяем что показался диалог подтверждения
    expect(wrapper.vm.showDeleteDialog).toBe(true)
  })

  it('should display count of found ingredients when searching', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Мука ржаная', purchasePrice: 100, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.05 }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('мука')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="results-count"]').text()).toContain('2')
  })
})

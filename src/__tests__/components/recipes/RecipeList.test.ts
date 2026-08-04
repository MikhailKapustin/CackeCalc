// src/__tests__/components/recipes/RecipeList.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import RecipeList from '@/components/recipes/RecipeList.vue'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'
import { createTestI18n } from '../../helpers/i18n'

describe('RecipeList', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useRecipesStore()

    wrapper = mount(RecipeList, {
      global: {
        plugins: [Quasar, createTestI18n()]
      }
    })
  })

  it('should display empty state when no recipes', () => {
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Создайте первый рецепт')
  })

  it('should display recipes list', async () => {
    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [],
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 500,
        profitAmount: 2000,
        profitPercent: 400
      },
      {
        id: 2,
        name: 'Торт Медовик',
        items: [],
        sellingPrice: 2000,
        sellingUnit: 'kg',
        totalCost: 400,
        profitAmount: 1600,
        profitPercent: 400
      }
    ]

    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('[data-test="recipe-item"]')
    expect(items).toHaveLength(2)
  })

  it('should filter recipes when searching', async () => {
    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [],
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 500
      },
      {
        id: 2,
        name: 'Пирог яблочный',
        items: [],
        sellingPrice: 1500,
        sellingUnit: 'kg',
        totalCost: 300
      }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('торт')
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('[data-test="recipe-item"]')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('Торт Наполеон')
  })

  it('should display no results message when search has no matches', async () => {
    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [],
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 500
      }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('несуществующий')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="no-results"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ничего не найдено по запросу')
  })

  it('should emit edit event when edit button clicked', async () => {
    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [],
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 500
      }
    ]

    await wrapper.vm.$nextTick()

    await wrapper.find('[data-test="edit-button"]').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toBe(1)
  })

  it('should confirm before deleting recipe', async () => {
    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [],
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 500
      }
    ]

    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('[data-test="delete-button"]')
    await deleteButton.trigger('click')

    // Проверяем что показался диалог подтверждения
    expect(wrapper.vm.showDeleteDialog).toBe(true)
  })

  it('should display count of found recipes when searching', async () => {
    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [],
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 500
      },
      {
        id: 2,
        name: 'Торт Медовик',
        items: [],
        sellingPrice: 2000,
        sellingUnit: 'kg',
        totalCost: 400
      }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('торт')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="results-count"]').text()).toContain('2')
  })

  it('should display recipe cost and profit', async () => {
    // Add ingredient to ingredients store
    const ingredientsStore = useIngredientsStore()
    ingredientsStore.ingredients = [
      {
        id: 1,
        name: 'Мука',
        purchasePrice: 120,
        purchaseAmount: 2,
        purchaseUnit: 'kg',
        type: 'weight',
        pricePerBaseUnit: 0.06
      }
    ]

    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        items: [{ ingredientId: 1, amount: 500 }], // 500g flour = 30₽
        sellingPrice: 2500,
        sellingUnit: 'kg',
        totalCost: 30,
        profitAmount: 2470,
        profitPercent: 8233
      }
    ]

    await wrapper.vm.$nextTick()

    const recipeItem = wrapper.find('[data-test="recipe-item"]')
    const text = recipeItem.text()

    // Check that price info is displayed
    expect(text).toContain('Себестоимость')
    expect(text).toContain('30') // cost 30₽
    expect(text).toContain('Цена продажи')
    expect(text).toContain('Прибыль')
    // Note: formatted prices use non-breaking spaces (U+00A0), not regular spaces
    expect(text).toMatch(/2.?500/) // selling price with any space character
  })
})

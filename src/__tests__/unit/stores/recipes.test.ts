// src/__tests__/unit/stores/recipes.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'

describe('Recipes Store', () => {
  let recipesStore: any
  let ingredientsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    recipesStore = useRecipesStore()
    ingredientsStore = useIngredientsStore()

    // Подготовка тестовых ингредиентов
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 },
      { id: 3, name: 'Яйца', purchasePrice: 90, purchaseAmount: 1, purchaseUnit: 'tens', type: 'count', pricePerBaseUnit: 9 }
    ]
  })

  describe('State', () => {
    it('should initialize with empty recipes array', () => {
      expect(recipesStore.recipes).toEqual([])
    })

    it('should initialize with empty search query', () => {
      expect(recipesStore.searchQuery).toBe('')
    })
  })

  describe('Getters - Recipe Cost Calculation', () => {
    it('should calculate recipe cost correctly', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт Наполеон',
        items: [
          { ingredientId: 1, amount: 500 },  // 500г муки × 0.06₽ = 30₽
          { ingredientId: 2, amount: 300 },  // 300г сахара × 0.08₽ = 24₽
          { ingredientId: 3, amount: 5 }     // 5 яиц × 9₽ = 45₽
        ],
        sellingPrice: 2500,
        sellingUnit: 'kg'
      }]

      const cost = recipesStore.getRecipeCost(recipesStore.recipes[0])

      expect(cost).toBe(99) // 30 + 24 + 45 = 99₽
    })

    it('should handle recipe with missing ingredient gracefully', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 },
          { ingredientId: 999, amount: 100 }  // Несуществующий ингредиент
        ],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      }]

      const cost = recipesStore.getRecipeCost(recipesStore.recipes[0])

      expect(cost).toBe(30) // Только мука
    })

    it('should recalculate cost when ingredient price changes', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 1000 }  // 1кг муки
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }]

      const costBefore = recipesStore.getRecipeCost(recipesStore.recipes[0])
      expect(costBefore).toBe(60) // 1000г × 0.06₽

      // Изменяем цену муки
      ingredientsStore.ingredients[0].purchasePrice = 150
      ingredientsStore.ingredients[0].pricePerBaseUnit = 0.075

      const costAfter = recipesStore.getRecipeCost(recipesStore.recipes[0])
      expect(costAfter).toBe(75) // 1000г × 0.075₽
    })
  })

  describe('Getters - Profit Calculation', () => {
    it('should calculate profit amount correctly', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 }  // Себестоимость: 30₽
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }]

      const profit = recipesStore.getRecipeProfit(recipesStore.recipes[0])

      expect(profit).toBe(1970) // 2000 - 30 = 1970₽
    })

    it('should calculate profit percent correctly', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 }  // Себестоимость: 30₽
        ],
        sellingPrice: 90,
        sellingUnit: 'kg'
      }]

      const profitPercent = recipesStore.getRecipeProfitPercent(recipesStore.recipes[0])

      expect(profitPercent).toBe(200) // ((90 - 30) / 30) * 100 = 200%
    })

    it('should return 0 profit percent when cost is 0', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      }]

      const profitPercent = recipesStore.getRecipeProfitPercent(recipesStore.recipes[0])

      expect(profitPercent).toBe(0)
    })

    it('should handle negative profit (selling below cost)', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 1000 }  // Себестоимость: 60₽
        ],
        sellingPrice: 50,
        sellingUnit: 'kg'
      }]

      const profit = recipesStore.getRecipeProfit(recipesStore.recipes[0])
      const profitPercent = recipesStore.getRecipeProfitPercent(recipesStore.recipes[0])

      expect(profit).toBe(-10)
      expect(profitPercent).toBeLessThan(0)
    })
  })

  describe('Actions', () => {
    it('should add new recipe', async () => {
      await recipesStore.addRecipe({
        name: 'Торт Наполеон',
        description: 'Классический рецепт',
        items: [
          { ingredientId: 1, amount: 500 }
        ],
        sellingPrice: 2500,
        sellingUnit: 'kg'
      })

      expect(recipesStore.recipes).toHaveLength(1)
      expect(recipesStore.recipes[0].name).toBe('Торт Наполеон')
    })

    it('should update recipe items', async () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 }
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }]

      await recipesStore.updateRecipeItems(1, [
        { ingredientId: 1, amount: 600 },
        { ingredientId: 2, amount: 200 }
      ])

      expect(recipesStore.recipes[0].items).toHaveLength(2)
      expect(recipesStore.recipes[0].items[0].amount).toBe(600)
    })

    it('should delete recipe', async () => {
      recipesStore.recipes = [
        { id: 1, name: 'Торт 1', items: [], sellingPrice: 1000, sellingUnit: 'kg' },
        { id: 2, name: 'Торт 2', items: [], sellingPrice: 1500, sellingUnit: 'kg' }
      ]

      await recipesStore.deleteRecipe(1)

      expect(recipesStore.recipes).toHaveLength(1)
      expect(recipesStore.recipes[0].id).toBe(2)
    })
  })

  describe('Search', () => {
    beforeEach(() => {
      recipesStore.recipes = [
        { id: 1, name: 'Торт Наполеон', items: [], sellingPrice: 2500, sellingUnit: 'kg' },
        { id: 2, name: 'Торт Медовик', items: [], sellingPrice: 2000, sellingUnit: 'kg' },
        { id: 3, name: 'Пирог яблочный', items: [], sellingPrice: 1500, sellingUnit: 'kg' }
      ]
    })

    it('should filter recipes by name', () => {
      recipesStore.searchQuery = 'торт'

      expect(recipesStore.filteredRecipes).toHaveLength(2)
    })

    it('should be case-insensitive', () => {
      recipesStore.searchQuery = 'НАПОЛЕОН'

      expect(recipesStore.filteredRecipes).toHaveLength(1)
      expect(recipesStore.filteredRecipes[0].name).toBe('Торт Наполеон')
    })

    it('should return all recipes when search is empty', () => {
      recipesStore.searchQuery = ''

      expect(recipesStore.filteredRecipes).toHaveLength(3)
    })
  })
})

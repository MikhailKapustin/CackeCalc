// src/__tests__/integration/reactive-recalculation.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'

describe('Reactive Recipe Recalculation', () => {
  let recipesStore: any
  let ingredientsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    recipesStore = useRecipesStore()
    ingredientsStore = useIngredientsStore()
  })

  it('should automatically recalculate all affected recipes when ingredient price changes', async () => {
    // 1. Добавляем ингредиенты
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    // 2. Создаем рецепты, использующие этот ингредиент
    recipesStore.recipes = [
      {
        id: 1,
        name: 'Торт 1',
        items: [{ ingredientId: 1, amount: 1000 }],  // 1кг муки
        sellingPrice: 2000,
        sellingUnit: 'kg'
      },
      {
        id: 2,
        name: 'Торт 2',
        items: [{ ingredientId: 1, amount: 500 }],   // 500г муки
        sellingPrice: 1500,
        sellingUnit: 'kg'
      }
    ]

    // 3. Проверяем начальные значения
    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(60)  // 1000г × 0.06₽
    expect(recipesStore.getRecipeCost(recipesStore.recipes[1])).toBe(30)  // 500г × 0.06₽

    // 4. Изменяем цену ингредиента
    await ingredientsStore.updateIngredient(1, {
      purchasePrice: 180,  // Было 120₽, стало 180₽
      purchaseAmount: 2,
      purchaseUnit: 'kg'
    })

    // 5. Проверяем что все рецепты автоматически пересчитались
    expect(ingredientsStore.ingredients[0].pricePerBaseUnit).toBe(0.09)  // 180 / 2000 = 0.09₽/г
    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(90)  // 1000г × 0.09₽
    expect(recipesStore.getRecipeCost(recipesStore.recipes[1])).toBe(45)  // 500г × 0.09₽

    // 6. Проверяем что маржа тоже пересчиталась
    expect(recipesStore.getRecipeProfit(recipesStore.recipes[0])).toBe(1910)  // 2000 - 90
    expect(recipesStore.getRecipeProfit(recipesStore.recipes[1])).toBe(1455)  // 1500 - 45
  })

  it('should handle multiple ingredients in recipe', async () => {
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    recipesStore.recipes = [{
      id: 1,
      name: 'Торт',
      items: [
        { ingredientId: 1, amount: 500 },  // 30₽
        { ingredientId: 2, amount: 300 }   // 24₽
      ],
      sellingPrice: 2000,
      sellingUnit: 'kg'
    }]

    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(54)

    // Меняем цену только сахара
    await ingredientsStore.updateIngredient(2, {
      purchasePrice: 100,
      purchaseAmount: 1,
      purchaseUnit: 'kg'
    })

    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(60) // 30 (мука) + 30 (сахар новая цена)
  })

  it('should handle deletion of ingredient used in recipes', async () => {
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    recipesStore.recipes = [{
      id: 1,
      name: 'Торт',
      items: [
        { ingredientId: 1, amount: 500 },
        { ingredientId: 2, amount: 300 }
      ],
      sellingPrice: 2000,
      sellingUnit: 'kg'
    }]

    // Удаляем сахар
    await ingredientsStore.deleteIngredient(2)

    // Рецепт должен пересчитаться без сахара
    const cost = recipesStore.getRecipeCost(recipesStore.recipes[0])
    expect(cost).toBe(30) // Только мука
  })
})

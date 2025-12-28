// src/__tests__/unit/stores/ingredients.limits.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIngredientsStore } from '@/stores/ingredients'
import { useSettingsStore } from '@/stores/settings'

describe('Free Version Limits - Ingredients', () => {
  let ingredientsStore: ReturnType<typeof useIngredientsStore>
  let settingsStore: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    ingredientsStore = useIngredientsStore()
    settingsStore = useSettingsStore()
  })

  describe('Free Version (15 ingredients limit)', () => {
    beforeEach(() => {
      settingsStore.isPro = false
    })

    it('should allow adding up to 15 ingredients in free version', async () => {
      for (let i = 1; i <= 15; i++) {
        const result = await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })

        expect(result.success).toBe(true)
        expect(ingredientsStore.ingredients).toHaveLength(i)
      }
    })

    it('should block adding 16th ingredient in free version', async () => {
      // Добавляем 15 ингредиентов
      for (let i = 1; i <= 15; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      // Попытка добавить 16-й
      const result = await ingredientsStore.addIngredient({
        name: 'Ингредиент 16',
        purchasePrice: 100,
        purchaseAmount: 1,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('free_limit_reached')
      expect(ingredientsStore.ingredients).toHaveLength(15)
    })

    it('should show paywall when limit reached', async () => {
      for (let i = 1; i <= 15; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      const result = await ingredientsStore.addIngredient({
        name: 'Ингредиент 16',
        purchasePrice: 100,
        purchaseAmount: 1,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(result.showPaywall).toBe(true)
    })

    it('should return appropriate error message for free limit', async () => {
      for (let i = 1; i <= 15; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      const result = await ingredientsStore.addIngredient({
        name: 'Ингредиент 16',
        purchasePrice: 100,
        purchaseAmount: 1,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(result.message).toContain('15 ингредиентов')
      expect(result.message).toContain('Pro')
    })

    it('should allow editing existing ingredients without hitting limit', async () => {
      for (let i = 1; i <= 15; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      const ingredientId = ingredientsStore.ingredients[0].id

      const result = await ingredientsStore.updateIngredient(ingredientId, {
        name: 'Обновленный ингредиент',
        purchasePrice: 150
      })

      expect(result.success).toBe(true)
      expect(ingredientsStore.ingredients).toHaveLength(15)
    })

    it('should allow deleting ingredients to free up slots', async () => {
      for (let i = 1; i <= 15; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      const ingredientId = ingredientsStore.ingredients[0].id
      await ingredientsStore.deleteIngredient(ingredientId)

      expect(ingredientsStore.ingredients).toHaveLength(14)

      // Теперь можно добавить новый ингредиент
      const result = await ingredientsStore.addIngredient({
        name: 'Новый ингредиент',
        purchasePrice: 100,
        purchaseAmount: 1,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(result.success).toBe(true)
      expect(ingredientsStore.ingredients).toHaveLength(15)
    })
  })

  describe('Pro Version (unlimited ingredients)', () => {
    beforeEach(() => {
      settingsStore.isPro = true
    })

    it('should allow unlimited ingredients in Pro version', async () => {
      for (let i = 1; i <= 20; i++) {
        const result = await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })

        expect(result.success).toBe(true)
      }

      expect(ingredientsStore.ingredients).toHaveLength(20)
    })

    it('should allow adding more than 15 ingredients in Pro version', async () => {
      for (let i = 1; i <= 17; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      expect(ingredientsStore.ingredients).toHaveLength(17)
    })

    it('should not show paywall in Pro version', async () => {
      for (let i = 1; i <= 16; i++) {
        const result = await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })

        expect(result.showPaywall).toBe(false)
      }
    })
  })

  describe('Limit Checking', () => {
    it('should report correct limit for free users', () => {
      settingsStore.isPro = false

      expect(ingredientsStore.maxIngredients).toBe(15)
    })

    it('should report unlimited limit for Pro users', () => {
      settingsStore.isPro = true

      expect(ingredientsStore.maxIngredients).toBe(Infinity)
    })

    it('should correctly check if at limit (Free)', async () => {
      settingsStore.isPro = false

      for (let i = 1; i <= 14; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      expect(ingredientsStore.isAtLimit).toBe(false)

      await ingredientsStore.addIngredient({
        name: 'Ингредиент 15',
        purchasePrice: 100,
        purchaseAmount: 1,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(ingredientsStore.isAtLimit).toBe(true)
    })

    it('should never be at limit for Pro users', async () => {
      settingsStore.isPro = true

      for (let i = 1; i <= 100; i++) {
        await ingredientsStore.addIngredient({
          name: `Ингредиент ${i}`,
          purchasePrice: 100,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight'
        })
      }

      expect(ingredientsStore.isAtLimit).toBe(false)
    })
  })
})

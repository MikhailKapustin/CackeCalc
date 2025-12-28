// src/__tests__/unit/stores/recipes.limits.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'

describe('Free Version Limits - Recipes', () => {
  let recipesStore: ReturnType<typeof useRecipesStore>
  let settingsStore: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    recipesStore = useRecipesStore()
    settingsStore = useSettingsStore()
  })

  describe('Free Version (5 recipes limit)', () => {
    beforeEach(() => {
      settingsStore.isPro = false
    })

    it('should allow adding up to 5 recipes in free version', async () => {
      for (let i = 1; i <= 5; i++) {
        const result = await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: `Рецепт ${i}`,
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })

        expect(result.success).toBe(true)
        expect(recipesStore.recipes).toHaveLength(i)
      }
    })

    it('should block adding 6th recipe in free version', async () => {
      // Добавляем 5 рецептов
      for (let i = 1; i <= 5; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      // Попытка добавить 6-й
      const result = await recipesStore.addRecipe({
        name: 'Торт 6',
        description: '',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('free_limit_reached')
      expect(recipesStore.recipes).toHaveLength(5)
    })

    it('should show paywall when limit reached', async () => {
      for (let i = 1; i <= 5; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      const result = await recipesStore.addRecipe({
        name: 'Торт 6',
        description: '',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(result.showPaywall).toBe(true)
    })

    it('should return appropriate error message for free limit', async () => {
      for (let i = 1; i <= 5; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      const result = await recipesStore.addRecipe({
        name: 'Торт 6',
        description: '',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(result.message).toContain('5 рецептов')
      expect(result.message).toContain('Pro')
    })

    it('should allow editing existing recipes without hitting limit', async () => {
      for (let i = 1; i <= 5; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      const recipeId = recipesStore.recipes[0].id

      const result = await recipesStore.updateRecipe(recipeId, {
        name: 'Обновленный торт',
        sellingPrice: 1500
      })

      expect(result.success).toBe(true)
      expect(recipesStore.recipes).toHaveLength(5)
    })

    it('should allow deleting recipes to free up slots', async () => {
      for (let i = 1; i <= 5; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      const recipeId = recipesStore.recipes[0].id
      await recipesStore.deleteRecipe(recipeId)

      expect(recipesStore.recipes).toHaveLength(4)

      // Теперь можно добавить новый рецепт
      const result = await recipesStore.addRecipe({
        name: 'Новый торт',
        description: '',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(result.success).toBe(true)
      expect(recipesStore.recipes).toHaveLength(5)
    })
  })

  describe('Pro Version (unlimited recipes)', () => {
    beforeEach(() => {
      settingsStore.isPro = true
    })

    it('should allow unlimited recipes in Pro version', async () => {
      for (let i = 1; i <= 10; i++) {
        const result = await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })

        expect(result.success).toBe(true)
      }

      expect(recipesStore.recipes).toHaveLength(10)
    })

    it('should allow adding more than 5 recipes in Pro version', async () => {
      for (let i = 1; i <= 7; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      expect(recipesStore.recipes).toHaveLength(7)
    })

    it('should not show paywall in Pro version', async () => {
      for (let i = 1; i <= 6; i++) {
        const result = await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })

        expect(result.showPaywall).toBe(false)
      }
    })
  })

  describe('Limit Checking', () => {
    it('should report correct limit for free users', () => {
      settingsStore.isPro = false

      expect(recipesStore.maxRecipes).toBe(5)
    })

    it('should report unlimited limit for Pro users', () => {
      settingsStore.isPro = true

      expect(recipesStore.maxRecipes).toBe(Infinity)
    })

    it('should correctly check if at limit (Free)', async () => {
      settingsStore.isPro = false

      for (let i = 1; i <= 4; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      expect(recipesStore.isAtLimit).toBe(false)

      await recipesStore.addRecipe({
        name: 'Торт 5',
        description: '',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(recipesStore.isAtLimit).toBe(true)
    })

    it('should never be at limit for Pro users', async () => {
      settingsStore.isPro = true

      for (let i = 1; i <= 100; i++) {
        await recipesStore.addRecipe({
          name: `Торт ${i}`,
          description: '',
          items: [],
          sellingPrice: 1000,
          sellingUnit: 'kg'
        })
      }

      expect(recipesStore.isAtLimit).toBe(false)
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIngredientsStore } from '@/stores/ingredients'

describe('Ingredients Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('State', () => {
    it('should initialize with empty ingredients array', () => {
      const store = useIngredientsStore()
      expect(store.ingredients).toEqual([])
    })

    it('should initialize with empty search query', () => {
      const store = useIngredientsStore()
      expect(store.searchQuery).toBe('')
    })
  })

  describe('Getters', () => {
    it('should filter ingredients by search query', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 },
        { id: 3, name: 'Яйца', purchasePrice: 90, purchaseAmount: 1, purchaseUnit: 'tens', type: 'count', pricePerBaseUnit: 9 }
      ]

      store.searchQuery = 'мука'

      expect(store.filteredIngredients).toHaveLength(1)
      expect(store.filteredIngredients[0].name).toBe('Мука пшеничная')
    })

    it('should return all ingredients when search query is empty', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
      ]

      store.searchQuery = ''

      expect(store.filteredIngredients).toHaveLength(2)
    })

    it('should be case-insensitive when filtering', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
      ]

      store.searchQuery = 'МУКА'

      expect(store.filteredIngredients).toHaveLength(1)
    })

    it('should get ingredient by id', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
      ]

      const ingredient = store.getById(2)

      expect(ingredient).toBeDefined()
      expect(ingredient?.name).toBe('Сахар')
    })

    it('should return undefined for non-existent id', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
      ]

      const ingredient = store.getById(999)

      expect(ingredient).toBeUndefined()
    })
  })

  describe('Actions', () => {
    it('should add new ingredient', async () => {
      const store = useIngredientsStore()

      await store.addIngredient({
        name: 'Мука',
        purchasePrice: 120,
        purchaseAmount: 2,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(store.ingredients).toHaveLength(1)
      expect(store.ingredients[0].name).toBe('Мука')
      expect(store.ingredients[0].pricePerBaseUnit).toBe(0.06)
    })

    it('should calculate pricePerBaseUnit when adding ingredient', async () => {
      const store = useIngredientsStore()

      await store.addIngredient({
        name: 'Яйца',
        purchasePrice: 90,
        purchaseAmount: 1,
        purchaseUnit: 'tens',
        type: 'count'
      })

      expect(store.ingredients[0].pricePerBaseUnit).toBe(9)
    })

    it('should update ingredient', async () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
      ]

      await store.updateIngredient(1, {
        purchasePrice: 150,
        purchaseAmount: 2,
        purchaseUnit: 'kg'
      })

      expect(store.ingredients[0].purchasePrice).toBe(150)
      expect(store.ingredients[0].pricePerBaseUnit).toBe(0.075)
    })

    it('should delete ingredient', async () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
      ]

      await store.deleteIngredient(1)

      expect(store.ingredients).toHaveLength(1)
      expect(store.ingredients[0].id).toBe(2)
    })

    it('should load ingredients from database', async () => {
      const store = useIngredientsStore()

      // Добавим ингредиент через базу данных напрямую для теста
      await store.addIngredient({
        name: 'Тестовый ингредиент для загрузки',
        purchasePrice: 120,
        purchaseAmount: 2,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      // Очистим стейт
      store.ingredients = []

      // Загрузим из БД
      await store.loadIngredients()

      // Проверяем что загрузились данные (может быть больше 1 из-за других тестов)
      expect(store.ingredients.length).toBeGreaterThan(0)
      // Проверяем что наш ингредиент есть в списке
      const testIngredient = store.ingredients.find(i => i.name === 'Тестовый ингредиент для загрузки')
      expect(testIngredient).toBeDefined()
      expect(testIngredient?.purchasePrice).toBe(120)
    })
  })
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ingredient, IngredientInput, IngredientUpdate } from '@/types/ingredient'
import { useSettingsStore } from './settings'
import { getDatabase } from '@/database/db'
import { calculateBasePrice } from '@/utils/units'

// Free version limits
const FREE_INGREDIENTS_LIMIT = 15

// Result type for operations that can hit limits
export interface IngredientOperationResult {
  success: boolean
  error?: string
  showPaywall?: boolean
  message?: string
  ingredient?: Ingredient
}

export const useIngredientsStore = defineStore('ingredients', () => {
  // State
  const ingredients = ref<Ingredient[]>([])
  const searchQuery = ref('')

  // Getters
  const filteredIngredients = computed(() => {
    if (!searchQuery.value) {
      return ingredients.value
    }

    const query = searchQuery.value.toLowerCase()
    return ingredients.value.filter(ingredient =>
      ingredient.name.toLowerCase().includes(query)
    )
  })

  const getById = computed(() => {
    return (id: number) => {
      return ingredients.value.find(ingredient => ingredient.id === id)
    }
  })

  // Free version limits
  const maxIngredients = computed(() => {
    const settingsStore = useSettingsStore()
    return settingsStore.isPro ? Infinity : FREE_INGREDIENTS_LIMIT
  })

  const isAtLimit = computed(() => {
    return ingredients.value.length >= maxIngredients.value
  })

  // Actions
  async function loadIngredients() {
    try {
      const db = await getDatabase()
      const result = await db.query('SELECT * FROM ingredients ORDER BY name')

      ingredients.value = result.values?.map((row: any) => ({
        id: row.id,
        name: row.name,
        purchasePrice: row.purchase_price,
        purchaseAmount: row.purchase_amount,
        purchaseUnit: row.purchase_unit,
        type: row.type,
        pricePerBaseUnit: row.price_per_base_unit,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || []
    } catch (error) {
      console.error('Error loading ingredients:', error)
      throw error
    }
  }

  async function addIngredient(input: IngredientInput): Promise<IngredientOperationResult> {
    try {
      // Check free version limit
      if (isAtLimit.value) {
        return {
          success: false,
          error: 'free_limit_reached',
          showPaywall: true,
          message: `В бесплатной версии доступно максимум ${FREE_INGREDIENTS_LIMIT} ингредиентов. Приобретите Pro версию для неограниченного количества ингредиентов.`
        }
      }

      const db = await getDatabase()

      // Calculate price per base unit
      const pricePerBaseUnit = calculateBasePrice(
        input.purchasePrice,
        input.purchaseAmount,
        input.purchaseUnit
      )

      // Insert into database
      const result = await db.run(
        `INSERT INTO ingredients (name, purchase_price, purchase_amount, purchase_unit, type, price_per_base_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.purchasePrice,
          input.purchaseAmount,
          input.purchaseUnit,
          input.type,
          pricePerBaseUnit
        ]
      )

      // Add to local state
      const newIngredient: Ingredient = {
        id: result.changes?.lastId || Date.now(),
        name: input.name,
        purchasePrice: input.purchasePrice,
        purchaseAmount: input.purchaseAmount,
        purchaseUnit: input.purchaseUnit,
        type: input.type,
        pricePerBaseUnit
      }

      ingredients.value.push(newIngredient)

      return {
        success: true,
        ingredient: newIngredient,
        showPaywall: false
      }
    } catch (error) {
      console.error('Error adding ingredient:', error)
      throw error
    }
  }

  async function updateIngredient(id: number, update: IngredientUpdate): Promise<IngredientOperationResult> {
    try {
      const db = await getDatabase()
      const ingredient = ingredients.value.find(i => i.id === id)

      if (!ingredient) {
        throw new Error(`Ingredient with id ${id} not found`)
      }

      // Merge updates with existing values
      const updatedData = {
        name: update.name ?? ingredient.name,
        purchasePrice: update.purchasePrice ?? ingredient.purchasePrice,
        purchaseAmount: update.purchaseAmount ?? ingredient.purchaseAmount,
        purchaseUnit: update.purchaseUnit ?? ingredient.purchaseUnit,
        type: update.type ?? ingredient.type
      }

      // Recalculate price per base unit
      const pricePerBaseUnit = calculateBasePrice(
        updatedData.purchasePrice,
        updatedData.purchaseAmount,
        updatedData.purchaseUnit
      )

      // Update in database
      await db.run(
        `UPDATE ingredients
         SET name = ?, purchase_price = ?, purchase_amount = ?, purchase_unit = ?,
             type = ?, price_per_base_unit = ?, updated_at = strftime('%s', 'now')
         WHERE id = ?`,
        [
          updatedData.name,
          updatedData.purchasePrice,
          updatedData.purchaseAmount,
          updatedData.purchaseUnit,
          updatedData.type,
          pricePerBaseUnit,
          id
        ]
      )

      // Update local state
      const index = ingredients.value.findIndex(i => i.id === id)
      if (index !== -1) {
        ingredients.value[index] = {
          ...ingredient,
          ...updatedData,
          pricePerBaseUnit
        }
      }

      // Trigger recipe recalculation
      const { useRecipesStore } = await import('./recipes')
      await useRecipesStore().recalculateRecipesUsingIngredient(id)

      return {
        success: true,
        ingredient: ingredients.value[index],
        showPaywall: false
      }
    } catch (error) {
      console.error('Error updating ingredient:', error)
      throw error
    }
  }

  async function deleteIngredient(id: number) {
    try {
      const db = await getDatabase()

      // Delete from database
      await db.run('DELETE FROM ingredients WHERE id = ?', [id])

      // Remove from local state
      const index = ingredients.value.findIndex(i => i.id === id)
      if (index !== -1) {
        ingredients.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      throw error
    }
  }

  return {
    // State
    ingredients,
    searchQuery,

    // Getters
    filteredIngredients,
    getById,
    maxIngredients,
    isAtLimit,

    // Actions
    loadIngredients,
    addIngredient,
    updateIngredient,
    deleteIngredient
  }
})

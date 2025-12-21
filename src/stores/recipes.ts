import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Recipe, RecipeInput, RecipeUpdate } from '@/types/recipe'
import { useIngredientsStore } from './ingredients'
import { getDatabase } from '@/database/db'

export const useRecipesStore = defineStore('recipes', () => {
  // State
  const recipes = ref<Recipe[]>([])
  const searchQuery = ref('')

  // Getters
  const filteredRecipes = computed(() => {
    if (!searchQuery.value) {
      return recipes.value
    }

    const query = searchQuery.value.toLowerCase()
    return recipes.value.filter(recipe =>
      recipe.name.toLowerCase().includes(query)
    )
  })

  const getById = computed(() => {
    return (id: number) => {
      return recipes.value.find(recipe => recipe.id === id)
    }
  })

  // Calculate recipe cost by summing ingredient costs
  const getRecipeCost = computed(() => {
    return (recipe: Recipe) => {
      const ingredientsStore = useIngredientsStore()

      return recipe.items.reduce((sum, item) => {
        const ingredient = ingredientsStore.getById(item.ingredientId)
        if (!ingredient) return sum

        return sum + (ingredient.pricePerBaseUnit * item.amount)
      }, 0)
    }
  })

  // Calculate profit amount
  const getRecipeProfit = computed(() => {
    return (recipe: Recipe) => {
      const cost = getRecipeCost.value(recipe)
      return recipe.sellingPrice - cost
    }
  })

  // Calculate profit percent
  const getRecipeProfitPercent = computed(() => {
    return (recipe: Recipe) => {
      const cost = getRecipeCost.value(recipe)
      if (cost === 0) return 0

      const profit = recipe.sellingPrice - cost
      return (profit / cost) * 100
    }
  })

  // Actions
  async function loadRecipes() {
    try {
      const db = await getDatabase()

      // Load recipes
      const recipesResult = await db.query('SELECT * FROM recipes ORDER BY name')

      // Load recipe items
      const itemsResult = await db.query('SELECT * FROM recipe_items')

      recipes.value = recipesResult.values?.map((row: any) => {
        // Find items for this recipe
        const items = itemsResult.values?.filter((item: any) => item.recipe_id === row.id)
          .map((item: any) => ({
            ingredientId: item.ingredient_id,
            amount: item.amount
          })) || []

        return {
          id: row.id,
          name: row.name,
          description: row.description,
          items,
          sellingPrice: row.selling_price,
          sellingUnit: row.selling_unit,
          totalCost: row.total_cost,
          profitAmount: row.profit_amount,
          profitPercent: row.profit_percent,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      }) || []
    } catch (error) {
      console.error('Error loading recipes:', error)
      throw error
    }
  }

  async function addRecipe(input: RecipeInput) {
    try {
      const db = await getDatabase()

      // Calculate initial cost
      const cost = input.items.reduce((sum, item) => {
        const ingredientsStore = useIngredientsStore()
        const ingredient = ingredientsStore.getById(item.ingredientId)
        if (!ingredient) return sum
        return sum + (ingredient.pricePerBaseUnit * item.amount)
      }, 0)

      const profitAmount = input.sellingPrice - cost
      const profitPercent = cost === 0 ? 0 : (profitAmount / cost) * 100

      // Insert recipe
      const result = await db.run(
        `INSERT INTO recipes (name, description, selling_price, selling_unit, total_cost, profit_amount, profit_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name,
          input.description || null,
          input.sellingPrice,
          input.sellingUnit,
          cost,
          profitAmount,
          profitPercent
        ]
      )

      const recipeId = result.changes?.lastId || Date.now()

      // Insert recipe items
      for (const item of input.items) {
        await db.run(
          `INSERT INTO recipe_items (recipe_id, ingredient_id, amount)
           VALUES (?, ?, ?)`,
          [recipeId, item.ingredientId, item.amount]
        )
      }

      // Add to local state
      const newRecipe: Recipe = {
        id: recipeId,
        name: input.name,
        description: input.description,
        items: input.items,
        sellingPrice: input.sellingPrice,
        sellingUnit: input.sellingUnit,
        totalCost: cost,
        profitAmount,
        profitPercent
      }

      recipes.value.push(newRecipe)

      return newRecipe
    } catch (error) {
      console.error('Error adding recipe:', error)
      throw error
    }
  }

  async function updateRecipe(id: number, update: RecipeUpdate) {
    try {
      const db = await getDatabase()
      const recipe = recipes.value.find(r => r.id === id)

      if (!recipe) {
        throw new Error(`Recipe with id ${id} not found`)
      }

      // Merge updates with existing values
      const updatedData = {
        name: update.name ?? recipe.name,
        description: update.description ?? recipe.description,
        items: update.items ?? recipe.items,
        sellingPrice: update.sellingPrice ?? recipe.sellingPrice,
        sellingUnit: update.sellingUnit ?? recipe.sellingUnit
      }

      // Recalculate cost
      const cost = updatedData.items.reduce((sum, item) => {
        const ingredientsStore = useIngredientsStore()
        const ingredient = ingredientsStore.getById(item.ingredientId)
        if (!ingredient) return sum
        return sum + (ingredient.pricePerBaseUnit * item.amount)
      }, 0)

      const profitAmount = updatedData.sellingPrice - cost
      const profitPercent = cost === 0 ? 0 : (profitAmount / cost) * 100

      // Update recipe
      await db.run(
        `UPDATE recipes
         SET name = ?, description = ?, selling_price = ?, selling_unit = ?,
             total_cost = ?, profit_amount = ?, profit_percent = ?,
             updated_at = strftime('%s', 'now')
         WHERE id = ?`,
        [
          updatedData.name,
          updatedData.description || null,
          updatedData.sellingPrice,
          updatedData.sellingUnit,
          cost,
          profitAmount,
          profitPercent,
          id
        ]
      )

      // Delete old recipe items
      await db.run('DELETE FROM recipe_items WHERE recipe_id = ?', [id])

      // Insert new recipe items
      for (const item of updatedData.items) {
        await db.run(
          `INSERT INTO recipe_items (recipe_id, ingredient_id, amount)
           VALUES (?, ?, ?)`,
          [id, item.ingredientId, item.amount]
        )
      }

      // Update local state
      const index = recipes.value.findIndex(r => r.id === id)
      if (index !== -1) {
        recipes.value[index] = {
          ...recipe,
          ...updatedData,
          totalCost: cost,
          profitAmount,
          profitPercent
        }
      }
    } catch (error) {
      console.error('Error updating recipe:', error)
      throw error
    }
  }

  async function updateRecipeItems(id: number, items: RecipeInput['items']) {
    await updateRecipe(id, { items })
  }

  async function deleteRecipe(id: number) {
    try {
      const db = await getDatabase()

      // Delete recipe items (cascade should handle this, but being explicit)
      await db.run('DELETE FROM recipe_items WHERE recipe_id = ?', [id])

      // Delete recipe
      await db.run('DELETE FROM recipes WHERE id = ?', [id])

      // Remove from local state
      const index = recipes.value.findIndex(r => r.id === id)
      if (index !== -1) {
        recipes.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
      throw error
    }
  }

  // Recalculate all recipes using a specific ingredient (called when ingredient price changes)
  async function recalculateRecipesUsingIngredient(ingredientId: number) {
    try {
      const db = await getDatabase()

      // Find all recipes that use this ingredient
      const affectedRecipes = recipes.value.filter(recipe =>
        recipe.items.some(item => item.ingredientId === ingredientId)
      )

      for (const recipe of affectedRecipes) {
        // Recalculate cost
        const cost = getRecipeCost.value(recipe)
        const profitAmount = recipe.sellingPrice - cost
        const profitPercent = cost === 0 ? 0 : (profitAmount / cost) * 100

        // Update in database
        await db.run(
          `UPDATE recipes
           SET total_cost = ?, profit_amount = ?, profit_percent = ?,
               updated_at = strftime('%s', 'now')
           WHERE id = ?`,
          [cost, profitAmount, profitPercent, recipe.id]
        )

        // Update local state
        const index = recipes.value.findIndex(r => r.id === recipe.id)
        if (index !== -1) {
          recipes.value[index] = {
            ...recipe,
            totalCost: cost,
            profitAmount,
            profitPercent
          }
        }
      }
    } catch (error) {
      console.error('Error recalculating recipes:', error)
      throw error
    }
  }

  return {
    // State
    recipes,
    searchQuery,

    // Getters
    filteredRecipes,
    getById,
    getRecipeCost,
    getRecipeProfit,
    getRecipeProfitPercent,

    // Actions
    loadRecipes,
    addRecipe,
    updateRecipe,
    updateRecipeItems,
    deleteRecipe,
    recalculateRecipesUsingIngredient
  }
})

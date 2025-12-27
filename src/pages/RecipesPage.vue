<template>
  <QPage padding>
    <div class="q-pa-md">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5">Рецепты</div>
        <QBtn
          color="primary"
          icon="add"
          label="Добавить рецепт"
          @click="showAddDialog = true"
        />
      </div>

      <!-- Recipes List -->
      <RecipeList
        @edit="handleEdit"
        @delete="handleDelete"
        @calculate="handleCalculate"
      />

      <!-- Add/Edit Dialog -->
      <QDialog v-model="showAddDialog" maximized>
        <QCard>
          <QToolbar class="bg-primary text-white">
            <QToolbarTitle>
              {{ editingRecipe ? 'Редактировать рецепт' : 'Добавить рецепт' }}
            </QToolbarTitle>
            <QBtn flat round dense icon="close" v-close-popup />
          </QToolbar>

          <QCardSection>
            <RecipeForm
              :recipe="editingRecipe"
              :mode="editingRecipe ? 'edit' : 'create'"
              @save="handleSave"
              @cancel="handleCancel"
            />
          </QCardSection>
        </QCard>
      </QDialog>

      <!-- Order Calculator Dialog -->
      <QDialog v-model="showCalculatorDialog">
        <QCard style="min-width: 400px; max-width: 600px;">
          <QCardSection>
            <div class="text-h6">Калькулятор заказа</div>
          </QCardSection>

          <QCardSection class="q-pt-none">
            <OrderCalculator
              v-if="selectedRecipe"
              :recipe="selectedRecipe"
              @close="handleCalculatorClose"
              @share="handleShareReceipt"
            />
          </QCardSection>
        </QCard>
      </QDialog>
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'
import RecipeList from '@/components/recipes/RecipeList.vue'
import RecipeForm from '@/components/recipes/RecipeForm.vue'
import OrderCalculator from '@/components/calculator/OrderCalculator.vue'
import type { Recipe, RecipeInput } from '@/types/recipe'

const $q = useQuasar()
const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()

const showAddDialog = ref(false)
const editingRecipe = ref<Recipe | undefined>(undefined)

const showCalculatorDialog = ref(false)
const selectedRecipe = ref<Recipe | undefined>(undefined)

// Load data on mount
onMounted(async () => {
  try {
    // Load ingredients first (needed for cost calculations)
    await ingredientsStore.loadIngredients()
    // Then load recipes
    await recipesStore.loadRecipes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка загрузки данных'
    })
  }
})

function handleEdit(id: number) {
  const recipe = recipesStore.getById(id)
  if (recipe) {
    editingRecipe.value = recipe
    showAddDialog.value = true
  }
}

async function handleDelete(id: number) {
  // Deletion is handled in RecipeList component
  $q.notify({
    type: 'positive',
    message: 'Рецепт удален'
  })
}

async function handleSave(recipeData: RecipeInput) {
  try {
    if (editingRecipe.value) {
      // Update existing recipe
      await recipesStore.updateRecipe(editingRecipe.value.id, recipeData)
      $q.notify({
        type: 'positive',
        message: 'Рецепт обновлен'
      })
    } else {
      // Create new recipe
      await recipesStore.addRecipe(recipeData)
      $q.notify({
        type: 'positive',
        message: 'Рецепт создан'
      })
    }

    // Close dialog and reset
    showAddDialog.value = false
    editingRecipe.value = undefined
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка сохранения рецепта'
    })
  }
}

function handleCancel() {
  showAddDialog.value = false
  editingRecipe.value = undefined
}

function handleCalculate(id: number) {
  const recipe = recipesStore.getById(id)
  if (recipe) {
    selectedRecipe.value = recipe
    showCalculatorDialog.value = true
  }
}

function handleCalculatorClose() {
  showCalculatorDialog.value = false
  selectedRecipe.value = undefined
}

async function handleShareReceipt(receiptText: string) {
  try {
    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        text: receiptText
      })
      $q.notify({
        type: 'positive',
        message: 'Расчет отправлен',
        icon: 'share'
      })
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(receiptText)
      $q.notify({
        type: 'positive',
        message: 'Расчет скопирован в буфер обмена',
        icon: 'content_copy'
      })
    }
  } catch (error) {
    // If sharing was cancelled or failed
    if (error instanceof Error && error.name !== 'AbortError') {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при отправке расчета'
      })
    }
  }
}
</script>

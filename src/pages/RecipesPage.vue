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
      />

      <!-- Add/Edit Dialog -->
      <QDialog v-model="showAddDialog">
        <QCard style="min-width: 600px; max-width: 800px;">
          <QCardSection>
            <div class="text-h6">
              {{ editingRecipe ? 'Редактировать рецепт' : 'Добавить рецепт' }}
            </div>
          </QCardSection>

          <QCardSection class="q-pt-none">
            <RecipeForm
              :recipe="editingRecipe"
              :mode="editingRecipe ? 'edit' : 'create'"
              @save="handleSave"
              @cancel="handleCancel"
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
import type { Recipe, RecipeInput } from '@/types/recipe'

const $q = useQuasar()
const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()

const showAddDialog = ref(false)
const editingRecipe = ref<Recipe | undefined>(undefined)

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
</script>

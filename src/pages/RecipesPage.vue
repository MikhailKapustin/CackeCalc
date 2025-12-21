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

      <!-- Add/Edit Dialog (placeholder for now) -->
      <QDialog v-model="showAddDialog">
        <QCard style="min-width: 350px">
          <QCardSection>
            <div class="text-h6">
              {{ editingRecipe ? 'Редактировать рецепт' : 'Добавить рецепт' }}
            </div>
          </QCardSection>

          <QCardSection class="q-pt-none">
            <div class="text-grey-7">
              Конструктор рецептов будет реализован в следующей фазе.<br>
              Пока можно только просматривать список рецептов.
            </div>
          </QCardSection>

          <QCardActions align="right">
            <QBtn flat label="Закрыть" color="primary" v-close-popup />
          </QCardActions>
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
import type { Recipe } from '@/types/recipe'

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
</script>

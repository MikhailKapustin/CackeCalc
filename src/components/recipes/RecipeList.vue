<template>
  <div>
    <!-- Search bar -->
    <QInput
      v-model="store.searchQuery"
      data-test="search-input"
      placeholder="Поиск рецептов..."
      outlined
      dense
      clearable
      class="q-mb-md"
    >
      <template #prepend>
        <QIcon name="search" />
      </template>
    </QInput>

    <!-- Results count when searching -->
    <div
      v-if="store.searchQuery && store.filteredRecipes.length > 0"
      class="text-caption text-grey-7 q-mb-sm"
      data-test="results-count"
    >
      {{ store.filteredRecipes.length }} рецепта найдено
    </div>

    <!-- Empty state -->
    <div
      v-if="store.recipes.length === 0"
      data-test="empty-state"
      class="text-center q-pa-lg text-grey-6"
    >
      <QIcon name="cake" size="64px" class="q-mb-md" />
      <div class="text-h6">Создайте первый рецепт</div>
      <div class="text-caption">Добавьте рецепты ваших кондитерских изделий</div>
    </div>

    <!-- No results state -->
    <div
      v-else-if="store.searchQuery && store.filteredRecipes.length === 0"
      data-test="no-results"
      class="text-center q-pa-lg text-grey-6"
    >
      <QIcon name="search_off" size="48px" class="q-mb-md" />
      <div class="text-subtitle1">Ничего не найдено по запросу '{{ store.searchQuery }}'</div>
    </div>

    <!-- Recipes list -->
    <QList v-else bordered separator>
      <QItem
        v-for="recipe in store.filteredRecipes"
        :key="recipe.id"
        data-test="recipe-item"
      >
        <QItemSection>
          <QItemLabel>
            <span v-html="highlightSearchTerm(recipe.name)" />
          </QItemLabel>
          <QItemLabel caption>
            <div class="q-mt-xs">
              <div>Себестоимость: {{ formatPrice(store.getRecipeCost(recipe)) }}</div>
              <div>Цена продажи: {{ formatPrice(recipe.sellingPrice) }} / {{ getUnitLabel(recipe.sellingUnit) }}</div>
              <div :class="getProfitColor(recipe)">
                Прибыль: {{ formatPrice(store.getRecipeProfit(recipe)) }}
                ({{ Math.round(store.getRecipeProfitPercent(recipe)) }}%)
              </div>
            </div>
          </QItemLabel>
        </QItemSection>

        <QItemSection side>
          <div class="row q-gutter-xs">
            <QBtn
              flat
              round
              dense
              icon="edit"
              color="primary"
              data-test="edit-button"
              @click="$emit('edit', recipe.id)"
            >
              <QTooltip>Редактировать</QTooltip>
            </QBtn>
            <QBtn
              flat
              round
              dense
              icon="delete"
              color="negative"
              data-test="delete-button"
              @click="confirmDelete(recipe)"
            >
              <QTooltip>Удалить</QTooltip>
            </QBtn>
          </div>
        </QItemSection>
      </QItem>
    </QList>

    <!-- Delete confirmation dialog -->
    <QDialog v-model="showDeleteDialog">
      <QCard>
        <QCardSection>
          <div class="text-h6">Удалить рецепт?</div>
        </QCardSection>

        <QCardSection class="q-pt-none">
          Вы действительно хотите удалить "{{ recipeToDelete?.name }}"?
          Это действие нельзя отменить.
        </QCardSection>

        <QCardActions align="right">
          <QBtn flat label="Отмена" color="primary" v-close-popup />
          <QBtn
            flat
            label="Удалить"
            color="negative"
            @click="handleDelete"
            v-close-popup
          />
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import type { Recipe, SellingUnit } from '@/types/recipe'

interface Emits {
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()

const store = useRecipesStore()

// Delete confirmation
const showDeleteDialog = ref(false)
const recipeToDelete = ref<Recipe | null>(null)

function confirmDelete(recipe: Recipe) {
  recipeToDelete.value = recipe
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (recipeToDelete.value) {
    await store.deleteRecipe(recipeToDelete.value.id)
    emit('delete', recipeToDelete.value.id)
    recipeToDelete.value = null
  }
}

// Formatting helpers
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(price)
}

function getUnitLabel(unit: SellingUnit): string {
  return unit === 'kg' ? 'кг' : 'шт'
}

function getProfitColor(recipe: Recipe): string {
  const profitPercent = store.getRecipeProfitPercent(recipe)

  if (profitPercent > 50) return 'text-green-7'
  if (profitPercent > 20) return 'text-orange-7'
  return 'text-red-7'
}

// Highlight search term in name
function highlightSearchTerm(name: string): string {
  if (!store.searchQuery) return name

  const regex = new RegExp(`(${store.searchQuery})`, 'gi')
  return name.replace(regex, '<mark>$1</mark>')
}
</script>

<style scoped>
mark {
  background-color: #ffeb3b;
  padding: 0 2px;
}
</style>

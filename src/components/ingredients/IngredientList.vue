<template>
  <div>
    <!-- Search bar -->
    <QInput
      v-model="store.searchQuery"
      data-test="search-input"
      placeholder="Поиск ингредиентов..."
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
      v-if="store.searchQuery && store.filteredIngredients.length > 0"
      class="text-caption text-grey-7 q-mb-sm"
      data-test="results-count"
    >
      {{ store.filteredIngredients.length }} ингредиента найдено
    </div>

    <!-- Empty state -->
    <div
      v-if="store.ingredients.length === 0"
      data-test="empty-state"
      class="text-center q-pa-lg text-grey-6"
    >
      <QIcon name="inbox" size="64px" class="q-mb-md" />
      <div class="text-h6">Добавьте первый ингредиент</div>
      <div class="text-caption">Начните с добавления ингредиентов для ваших рецептов</div>
    </div>

    <!-- No results state -->
    <div
      v-else-if="store.searchQuery && store.filteredIngredients.length === 0"
      data-test="no-results"
      class="text-center q-pa-lg text-grey-6"
    >
      <QIcon name="search_off" size="48px" class="q-mb-md" />
      <div class="text-subtitle1">Ничего не найдено по запросу '{{ store.searchQuery }}'</div>
    </div>

    <!-- Ingredients list -->
    <QList v-else bordered separator>
      <QItem
        v-for="ingredient in store.filteredIngredients"
        :key="ingredient.id"
        data-test="ingredient-item"
      >
        <QItemSection>
          <QItemLabel>
            <span v-html="highlightSearchTerm(ingredient.name)" />
          </QItemLabel>
          <QItemLabel caption>
            {{ formatPrice(ingredient.purchasePrice) }} за {{ ingredient.purchaseAmount }} {{ getUnitLabel(ingredient.purchaseUnit) }}
            • {{ formatPrice(ingredient.pricePerBaseUnit) }}/{{ getBaseUnitLabel(ingredient.type) }}
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
              @click="$emit('edit', ingredient.id)"
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
              @click="confirmDelete(ingredient)"
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
          <div class="text-h6">Удалить ингредиент?</div>
        </QCardSection>

        <QCardSection class="q-pt-none">
          Вы действительно хотите удалить "{{ ingredientToDelete?.name }}"?
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
import { useIngredientsStore } from '@/stores/ingredients'
import type { Ingredient, PurchaseUnit, MeasurementType } from '@/types/ingredient'

interface Emits {
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}

const emit = defineEmits<Emits>()

const store = useIngredientsStore()

// Delete confirmation
const showDeleteDialog = ref(false)
const ingredientToDelete = ref<Ingredient | null>(null)

function confirmDelete(ingredient: Ingredient) {
  ingredientToDelete.value = ingredient
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (ingredientToDelete.value) {
    await store.deleteIngredient(ingredientToDelete.value.id)
    emit('delete', ingredientToDelete.value.id)
    ingredientToDelete.value = null
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

function getUnitLabel(unit: PurchaseUnit): string {
  const labels: Record<PurchaseUnit, string> = {
    kg: 'кг',
    g: 'г',
    l: 'л',
    ml: 'мл',
    pcs: 'шт',
    tens: 'дес'
  }
  return labels[unit] || unit
}

function getBaseUnitLabel(type: MeasurementType): string {
  if (type === 'weight') return 'г'
  if (type === 'volume') return 'мл'
  return 'шт'
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

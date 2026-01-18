<template>
  <div>
    <!-- Search bar -->
    <QInput
      v-model="store.searchQuery"
      data-test="search-input"
      :placeholder="$t('ingredients.search')"
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
      {{ $t('ingredients.resultsCount', { count: store.filteredIngredients.length }) }}
    </div>

    <!-- Empty state -->
    <div
      v-if="store.ingredients.length === 0"
      data-test="empty-state"
      class="text-center q-pa-lg text-grey-6"
    >
      <QIcon name="inbox" size="64px" class="q-mb-md" />
      <div class="text-h6">{{ $t('ingredients.empty') }}</div>
    </div>

    <!-- No results state -->
    <div
      v-else-if="store.searchQuery && store.filteredIngredients.length === 0"
      data-test="no-results"
      class="text-center q-pa-lg text-grey-6"
    >
      <QIcon name="search_off" size="48px" class="q-mb-md" />
      <div class="text-subtitle1">{{ $t('ingredients.noResults', { query: store.searchQuery }) }}</div>
    </div>

    <!-- Ingredients list -->
    <QList v-else bordered separator>
      <QItem
        v-for="ingredient in store.filteredIngredients"
        :key="ingredient.id"
        :class="{ 'highlighted-ingredient': ingredient.id === props.highlightedId }"
        data-test="ingredient-item"
      >
        <QItemSection>
          <QItemLabel>
            <span v-html="highlightSearchTerm(ingredient.name)" />
          </QItemLabel>
          <QItemLabel caption>
            {{ formatPrice(ingredient.purchasePrice) }} {{ settingsStore.currency }} за {{ ingredient.purchaseAmount }} {{ getUnitLabel(ingredient.purchaseUnit) }}
            • {{ formatPrice(ingredient.pricePerBaseUnit) }} {{ settingsStore.currency }}/{{ getBaseUnitLabel(ingredient.type) }}
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
              <QTooltip>{{ $t('common.edit') }}</QTooltip>
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
              <QTooltip>{{ $t('common.delete') }}</QTooltip>
            </QBtn>
          </div>
        </QItemSection>
      </QItem>
    </QList>

    <!-- Delete confirmation dialog -->
    <QDialog v-model="showDeleteDialog">
      <QCard>
        <QCardSection>
          <div class="text-h6">{{ $t('ingredients.delete') }}</div>
        </QCardSection>

        <QCardSection class="q-pt-none">
          {{ $t('ingredients.deleteConfirm') }}
        </QCardSection>

        <QCardActions align="right">
          <QBtn flat :label="$t('common.cancel')" color="primary" v-close-popup />
          <QBtn
            flat
            :label="$t('common.delete')"
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
import { useI18n } from 'vue-i18n'
import { useIngredientsStore } from '@/stores/ingredients'
import { useSettingsStore } from '@/stores/settings'
import type { Ingredient, PurchaseUnit, MeasurementType } from '@/types/ingredient'

const { t } = useI18n()

interface Props {
  highlightedId?: number | null
}

interface Emits {
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useIngredientsStore()
const settingsStore = useSettingsStore()

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
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
  return formatted.replace(/\u00A0/g, ' ')
}

function getUnitLabel(unit: PurchaseUnit): string {
  const labels: Record<PurchaseUnit, string> = {
    kg: t('units.kg'),
    g: t('units.g'),
    l: t('units.l'),
    ml: t('units.ml'),
    pcs: t('units.pcs'),
    tens: t('units.tens')
  }
  return labels[unit] || unit
}

function getBaseUnitLabel(type: MeasurementType): string {
  if (type === 'weight') return t('units.g')
  if (type === 'volume') return t('units.ml')
  return t('units.pcs')
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

.highlighted-ingredient {
  background-color: #e3f2fd;
  animation: highlight-fade 2s ease-in-out;
}

@keyframes highlight-fade {
  0% {
    background-color: #2196f3;
  }
  50% {
    background-color: #64b5f6;
  }
  100% {
    background-color: #e3f2fd;
  }
}
</style>

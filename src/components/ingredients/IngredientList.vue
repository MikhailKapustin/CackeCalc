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
        <QIcon name="search" size="20px" />
      </template>
    </QInput>

    <!-- Results count when searching -->
    <div
      v-if="store.searchQuery && store.filteredIngredients.length > 0"
      class="ct-label q-mb-sm"
      data-test="results-count"
    >
      {{ $t('ingredients.resultsCount', { count: store.filteredIngredients.length }) }}
    </div>

    <!-- Empty state -->
    <div
      v-if="store.ingredients.length === 0"
      data-test="empty-state"
      class="ct-empty"
    >
      <div class="ct-empty__title">{{ $t('ingredients.empty') }}</div>
      <div class="ct-empty__hint">{{ $t('ingredients.emptyHint') }}</div>
    </div>

    <!-- No results state -->
    <div
      v-else-if="store.searchQuery && store.filteredIngredients.length === 0"
      data-test="no-results"
      class="ct-empty"
    >
      <div class="ct-empty__title">{{ $t('ingredients.noResults', { query: store.searchQuery }) }}</div>
    </div>

    <!-- Ingredients list: what was bought on the left, the unit price that
         actually feeds every recipe on the right -->
    <div v-else class="ct-card">
      <div
        v-for="(ingredient, index) in store.filteredIngredients"
        :key="ingredient.id"
        class="ct-item"
        :class="{
          'ct-item--divided': index > 0,
          'ct-item--highlighted': ingredient.id === props.highlightedId
        }"
        data-test="ingredient-item"
      >
        <div class="ct-item__main">
          <div class="ct-item__name">
            <span v-html="highlightSearchTerm(ingredient.name)" />
          </div>
          <div class="ct-item__purchase">
            <span class="ct-num">{{ formatPrice(ingredient.purchasePrice) }}</span>
            {{ settingsStore.currency }}
            {{ $t('ingredients.perAmount', {
              amount: formatPrice(ingredient.purchaseAmount),
              unit: getUnitLabel(ingredient.purchaseUnit)
            }) }}
          </div>
        </div>

        <div class="ct-item__rate">
          <div class="ct-item__rate-value ct-num">{{ formatPrice(ingredient.pricePerBaseUnit) }}</div>
          <div class="ct-item__rate-unit">
            {{ settingsStore.currency }}/{{ getBaseUnitLabel(ingredient.type) }}
          </div>
        </div>

        <div class="ct-item__actions">
          <QBtn
            flat
            round
            dense
            size="sm"
            icon="edit"
            data-test="edit-button"
            @click="$emit('edit', ingredient.id)"
          >
            <QTooltip>{{ $t('common.edit') }}</QTooltip>
          </QBtn>
          <QBtn
            flat
            round
            dense
            size="sm"
            icon="delete"
            color="negative"
            data-test="delete-button"
            @click="confirmDelete(ingredient)"
          >
            <QTooltip>{{ $t('common.delete') }}</QTooltip>
          </QBtn>
        </div>
      </div>
    </div>

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

const { t, locale } = useI18n()

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
  const formatted = new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
  return formatted.replace(/[\u00a0\u202f]/g, ' ')
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

// Ingredient names are user input and also arrive from imported files, so they
// are escaped before the <mark> wrapper goes through v-html
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Highlight search term in name
function highlightSearchTerm(name: string): string {
  const safeName = escapeHtml(name)
  if (!store.searchQuery) return safeName

  const regex = new RegExp(`(${escapeRegExp(escapeHtml(store.searchQuery))})`, 'gi')
  return safeName.replace(regex, '<mark>$1</mark>')
}
</script>

<style scoped>
.ct-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
}

.ct-item--divided {
  border-top: 1px solid var(--ct-line);
}

.ct-item__main {
  flex: 1;
  min-width: 0;
}

.ct-item__name {
  font-family: var(--ct-font-display);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ct-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ct-item__purchase {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--ct-ink-soft);
}

/* The unit price is what every recipe multiplies, so it reads as the value */
.ct-item__rate {
  text-align: right;
  flex: none;
}

.ct-item__rate-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--ct-ink);
  line-height: 1.2;
}

.ct-item__rate-unit {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ct-ink-faint);
}

.ct-item__actions {
  display: flex;
  gap: 2px;
  flex: none;
  color: var(--ct-ink-faint);
}

.ct-item--highlighted {
  animation: ct-highlight 2.2s ease-out;
}

@keyframes ct-highlight {
  0% { background-color: var(--ct-caramel-soft); }
  100% { background-color: transparent; }
}

:deep(mark) {
  background-color: var(--ct-caramel-soft);
  color: var(--ct-ink);
  padding: 0 2px;
  border-radius: 2px;
}
</style>

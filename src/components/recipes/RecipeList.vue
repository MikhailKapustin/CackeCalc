<template>
  <div>
    <!-- Search bar -->
    <QInput
      v-model="store.searchQuery"
      data-test="search-input"
      :placeholder="$t('recipes.search')"
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
      v-if="store.searchQuery && store.filteredRecipes.length > 0"
      class="ct-label q-mb-sm"
      data-test="results-count"
    >
      {{ $t('recipes.resultsCount', { count: store.filteredRecipes.length }) }}
    </div>

    <!-- Empty state -->
    <div
      v-if="store.recipes.length === 0"
      data-test="empty-state"
      class="ct-empty"
    >
      <div class="ct-empty__title">{{ $t('recipes.empty') }}</div>
      <div class="ct-empty__hint">{{ $t('recipes.emptyHint') }}</div>
    </div>

    <!-- No results state -->
    <div
      v-else-if="store.searchQuery && store.filteredRecipes.length === 0"
      data-test="no-results"
      class="ct-empty"
    >
      <div class="ct-empty__title">{{ $t('recipes.noResults', { query: store.searchQuery }) }}</div>
    </div>

    <!-- Recipes: each one is a small spec sheet — what it costs, what it sells
         for, what is left, and which ingredients eat the margin -->
    <template v-else>
      <div
        v-for="recipe in store.filteredRecipes"
        :key="recipe.id"
        class="ct-card"
        data-test="recipe-item"
      >
        <div class="ct-card__head">
          <div class="ct-card__name">
            <span v-html="highlightSearchTerm(recipe.name)" />
          </div>

          <div class="ct-recipe__actions">
            <QBtn
              flat
              round
              dense
              size="sm"
              icon="calculate"
              data-test="calculate-button"
              @click="$emit('calculate', recipe.id)"
            >
              <QTooltip>{{ $t('recipes.calculateOrder') }}</QTooltip>
            </QBtn>
            <QBtn
              flat
              round
              dense
              size="sm"
              icon="edit"
              data-test="edit-button"
              @click="$emit('edit', recipe.id)"
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
              @click="confirmDelete(recipe)"
            >
              <QTooltip>{{ $t('common.delete') }}</QTooltip>
            </QBtn>
          </div>
        </div>

        <div class="ct-card__body">
          <CostRibbon :recipe="recipe" class="q-mb-sm" />

          <div class="ct-row">
            <span class="ct-row__key">{{ $t('recipes.cost') }}</span>
            <span class="ct-row__val">
              {{ formatPrice(store.getRecipeCost(recipe)) }} {{ settingsStore.currency }}
            </span>
          </div>

          <div class="ct-row">
            <span class="ct-row__key">{{ $t('recipes.sellingPrice') }}</span>
            <span class="ct-row__val">
              {{ formatPrice(recipe.sellingPrice) }} {{ settingsStore.currency }}
              <span class="ct-faint">/ {{ getUnitLabel(recipe.sellingUnit) }}</span>
            </span>
          </div>

          <div class="ct-row">
            <span class="ct-row__key">{{ $t('recipes.profit') }}</span>
            <span class="ct-row__val" :class="profitClass(recipe)">
              {{ formatSigned(store.getRecipeProfit(recipe)) }} {{ settingsStore.currency }}
              <span class="ct-stamp" :class="stampClass(recipe)">
                {{ Math.round(store.getRecipeProfitPercent(recipe)) }}%
              </span>
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete confirmation dialog -->
    <QDialog v-model="showDeleteDialog">
      <QCard>
        <QCardSection>
          <div class="text-h6">{{ $t('recipes.delete') }}</div>
        </QCardSection>

        <QCardSection class="q-pt-none">
          {{ $t('recipes.deleteConfirm') }}
          <div v-if="recipeToDelete" class="ct-card__name q-mt-sm">{{ recipeToDelete.name }}</div>
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
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'
import CostRibbon from '@/components/common/CostRibbon.vue'
import type { Recipe, SellingUnit } from '@/types/recipe'

const { t, locale } = useI18n()

interface Emits {
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
  (e: 'calculate', id: number): void
}

const emit = defineEmits<Emits>()

const store = useRecipesStore()
const settingsStore = useSettingsStore()

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
  const formatted = new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
  return formatted.replace(/[\u00a0\u202f]/g, ' ')
}

// Profit carries a sign: "+7 180" reads as earnings, "7 180" reads as a total
function formatSigned(value: number): string {
  const formatted = formatPrice(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}`
  return formatted
}

function getUnitLabel(unit: SellingUnit): string {
  return unit === 'kg' ? t('units.kg') : t('units.pcs')
}

function profitClass(recipe: Recipe): string {
  return store.getRecipeProfit(recipe) < 0 ? 'ct-loss' : 'ct-profit'
}

// The stamp only turns red on an actual loss: a thin margin is a business
// decision, not an error, and colouring it as one trains people to ignore colour
function stampClass(recipe: Recipe): string {
  return store.getRecipeProfit(recipe) < 0 ? 'ct-stamp--loss' : 'ct-stamp--profit'
}

// Recipe names are user input and also arrive from imported files, so they are
// escaped before the <mark> wrapper goes through v-html
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
.ct-recipe__actions {
  display: flex;
  gap: 2px;
  flex: none;
  color: var(--ct-ink-faint);
}

.ct-row__val .ct-stamp {
  margin-left: 6px;
}

:deep(mark) {
  background-color: var(--ct-caramel-soft);
  color: var(--ct-ink);
  padding: 0 2px;
  border-radius: 2px;
}
</style>

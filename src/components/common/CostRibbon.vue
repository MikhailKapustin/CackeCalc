<template>
  <div v-if="segments.length" class="ct-ribbon-block">
    <div
      class="ct-ribbon"
      :class="{ 'ct-ribbon--tall': tall }"
      role="img"
      :aria-label="ariaLabel"
      data-test="cost-ribbon"
    >
      <div
        v-for="segment in segments"
        :key="segment.name"
        class="ct-ribbon__seg"
        :style="{ width: segment.percent + '%', background: segment.color }"
      />
    </div>

    <div v-if="legend" class="ct-ribbon-legend">
      <div
        v-for="segment in segments"
        :key="segment.name"
        class="ct-ribbon-legend__item"
      >
        <span class="ct-ribbon-legend__dot" :style="{ background: segment.color }" />
        <span class="ct-ribbon-legend__name">{{ segment.name }}</span>
        <span class="ct-ribbon-legend__share">{{ Math.round(segment.percent) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Cost ribbon — where the price actually goes.
 *
 * A recipe's cost is a stack of ingredients, so it is drawn as one: the widest
 * band is the ingredient eating the margin. Screens of numbers do not show that
 * at a glance; this does, and it is the reason to open a recipe at all.
 *
 * The largest ingredients are named, the tail is collapsed into "other" — five
 * bands is the point where the ribbon stops being readable.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIngredientsStore } from '@/stores/ingredients'
import type { Recipe } from '@/types/recipe'

const props = withDefaults(
  defineProps<{
    recipe: Recipe
    tall?: boolean
    legend?: boolean
    limit?: number
  }>(),
  { tall: false, legend: false, limit: 4 }
)

const { t } = useI18n()
const ingredientsStore = useIngredientsStore()

const SEGMENT_COLORS = [
  'var(--ct-ribbon-1)',
  'var(--ct-ribbon-2)',
  'var(--ct-ribbon-3)',
  'var(--ct-ribbon-4)'
]

const segments = computed(() => {
  // Items can be missing on a recipe that came from an older export or a partial
  // fetch; an empty ribbon is fine, a crash on the recipe screen is not
  const parts = (props.recipe.items ?? [])
    .map(item => {
      const ingredient = ingredientsStore.getById(item.ingredientId)
      if (!ingredient) return null
      return {
        name: ingredient.name,
        cost: ingredient.pricePerBaseUnit * item.amount
      }
    })
    .filter((part): part is { name: string; cost: number } => part !== null && part.cost > 0)
    .sort((a, b) => b.cost - a.cost)

  const total = parts.reduce((sum, part) => sum + part.cost, 0)
  if (total <= 0) return []

  const named = parts.slice(0, props.limit)
  const restCost = parts.slice(props.limit).reduce((sum, part) => sum + part.cost, 0)

  const result = named.map((part, index) => ({
    name: part.name,
    percent: (part.cost / total) * 100,
    color: SEGMENT_COLORS[index] ?? 'var(--ct-ribbon-rest)'
  }))

  if (restCost > 0) {
    result.push({
      name: t('recipes.costBreakdown.other'),
      percent: (restCost / total) * 100,
      color: 'var(--ct-ribbon-rest)'
    })
  }

  return result
})

// Screen readers get the same information the bands carry
const ariaLabel = computed(() =>
  segments.value.map(s => `${s.name} ${Math.round(s.percent)}%`).join(', ')
)
</script>

<style scoped>
.ct-ribbon-legend__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}
</style>

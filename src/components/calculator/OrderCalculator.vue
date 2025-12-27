<template>
  <div class="q-gutter-md">
      <!-- Recipe selector -->
      <QSelect
        v-model="selectedRecipeId"
        :options="recipeOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Выберите рецепт"
        filled
        data-test="recipe-select"
      />

      <!-- Weight/Quantity input -->
      <QInput
        v-model.number="weight"
        type="number"
        :label="weightLabel"
        filled
        data-test="weight-input"
        :rules="[
          val => val !== null && val !== '' || 'Введите количество',
          val => val > 0 || 'Количество должно быть положительным числом'
        ]"
        lazy-rules
      >
        <template v-slot:append>
          <span data-test="unit-label" class="text-caption">{{ unitLabel }}</span>
        </template>
      </QInput>

      <!-- Error message -->
      <div v-if="hasError" data-test="error-message" class="text-negative text-caption">
        Количество должно быть положительным числом
      </div>

      <!-- Total price display -->
      <div v-if="selectedRecipe && weight > 0" class="q-mt-md">
        <div class="text-h5" data-test="total-price">
          💰 ИТОГО: {{ formattedTotal }} ₽
        </div>

        <!-- Profit for confectioner (internal view only) -->
        <div data-test="profit" class="text-caption text-grey-7 q-mt-sm">
          Ваша прибыль: {{ formattedProfit }} ₽
        </div>
      </div>

      <!-- Action buttons -->
      <div class="row q-gutter-sm q-mt-md">
        <QBtn
          v-if="selectedRecipe && weight > 0 && !hasError"
          label="Отправить расчет клиенту"
          color="primary"
          icon="share"
          data-test="share-button"
          @click="handleShare"
          class="col"
        />
        <QBtn
          flat
          label="Закрыть"
          @click="emit('close')"
        />
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { calculateOrderTotal, generateReceiptText } from '@/utils/receiptGenerator'
import type { Recipe } from '@/types/recipe'

interface Props {
  recipe?: Recipe
}

const props = defineProps<Props>()

const emit = defineEmits<{
  share: [receiptText: string]
  close: []
}>()

const recipesStore = useRecipesStore()

const selectedRecipeId = ref<number | null>(props.recipe?.id || null)
const weight = ref<number>(0)

// Watch for recipe prop changes and update selection
watch(() => props.recipe, (newRecipe) => {
  if (newRecipe) {
    selectedRecipeId.value = newRecipe.id
  }
}, { immediate: true })

// Computed properties
const recipeOptions = computed(() => recipesStore.recipes)

const selectedRecipe = computed(() => {
  if (!selectedRecipeId.value) return null
  return recipesStore.recipes.find(r => r.id === selectedRecipeId.value)
})

const unitLabel = computed(() => {
  if (!selectedRecipe.value) return ''
  return selectedRecipe.value.sellingUnit === 'kg' ? 'кг' : 'шт'
})

const weightLabel = computed(() => {
  if (!selectedRecipe.value) return 'Количество'
  return selectedRecipe.value.sellingUnit === 'kg' ? 'Вес (кг)' : 'Количество (шт)'
})

const totalPrice = computed(() => {
  if (!selectedRecipe.value || weight.value <= 0) return 0
  return calculateOrderTotal(selectedRecipe.value, weight.value)
})

const profit = computed(() => {
  if (!selectedRecipe.value || weight.value <= 0) return 0
  const profitPerUnit = selectedRecipe.value.sellingPrice - (selectedRecipe.value.totalCost || 0)
  return profitPerUnit * weight.value
})

const formattedTotal = computed(() => formatNumber(totalPrice.value))
const formattedProfit = computed(() => formatNumber(profit.value))

const hasError = computed(() => {
  return weight.value !== null && weight.value !== 0 && weight.value < 0
})

// Methods
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function handleShare() {
  if (!selectedRecipe.value || weight.value <= 0) return

  const receiptData = {
    recipeName: selectedRecipe.value.name,
    weight: weight.value,
    pricePerUnit: selectedRecipe.value.sellingPrice,
    unit: unitLabel.value,
    total: totalPrice.value,
    currency: '₽'
  }

  const receiptText = generateReceiptText(receiptData)
  emit('share', receiptText)
}
</script>

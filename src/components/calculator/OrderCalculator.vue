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
        @focus="onWeightFocus"
      >
        <template v-slot:append>
          <span data-test="unit-label" class="text-caption">{{ unitLabel }}</span>
        </template>
      </QInput>

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

      <!-- Receipt Preview -->
      <div v-if="selectedRecipe && weight > 0 && receiptImageUrl" class="q-mt-md q-pa-md bg-grey-2 rounded-borders">
        <div class="text-subtitle2 q-mb-sm text-grey-8">Предпросмотр чека для клиента:</div>
        <img
          :src="receiptImageUrl"
          alt="Чек заказа"
          class="receipt-image"
          style="width: 100%; max-width: 600px; display: block; margin: 0 auto; border-radius: 4px;"
        />
      </div>

      <!-- Action buttons -->
      <div class="row q-gutter-sm q-mt-md">
        <QBtn
          v-if="selectedRecipe && weight > 0"
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
import { calculateOrderTotal } from '@/utils/receiptGenerator'
import { generateReceiptImage, generateReceiptImageDataURL } from '@/utils/receiptImageGenerator'
import type { Recipe } from '@/types/recipe'

interface Props {
  recipe?: Recipe
}

const props = defineProps<Props>()

const emit = defineEmits<{
  share: [receiptBlob: Blob]
  close: []
}>()

const recipesStore = useRecipesStore()

const selectedRecipeId = ref<number | null>(props.recipe?.id || null)
const weight = ref<number>(0)

// Track if weight field was focused to clear default values
const weightFocused = ref(false)

// Receipt image preview
const receiptImageUrl = ref<string>('')

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

// Receipt data computed
const receiptData = computed(() => {
  if (!selectedRecipe.value || weight.value <= 0) return null

  return {
    recipeName: selectedRecipe.value.name,
    weight: weight.value,
    pricePerUnit: selectedRecipe.value.sellingPrice,
    unit: unitLabel.value,
    total: totalPrice.value,
    currency: '₽'
  }
})

// Watch for changes and regenerate receipt image
watch(receiptData, async (data) => {
  if (data) {
    try {
      receiptImageUrl.value = await generateReceiptImageDataURL(data)
    } catch (error) {
      console.error('Failed to generate receipt image:', error)
      receiptImageUrl.value = ''
    }
  } else {
    receiptImageUrl.value = ''
  }
}, { immediate: true })

// Handle focus on weight field - clear if default value
function onWeightFocus() {
  if (!weightFocused.value && weight.value === 0) {
    weight.value = null as any
  }
  weightFocused.value = true
}

// Methods
function formatNumber(num: number): string {
  // Round to 2 decimal places and format with spaces
  const rounded = num.toFixed(2)
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

async function handleShare() {
  if (!receiptData.value) return

  try {
    const receiptBlob = await generateReceiptImage(receiptData.value)
    emit('share', receiptBlob)
  } catch (error) {
    console.error('Failed to generate receipt image for sharing:', error)
  }
}
</script>

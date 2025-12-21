<template>
  <QForm @submit="onSubmit">
    <div class="q-gutter-md">
      <!-- Название -->
      <QInput
        v-model="formData.name"
        data-test="ingredient-name"
        label="Название"
        :rules="[
          val => !!val || 'Название обязательно'
        ]"
        outlined
        dense
      />

      <!-- Цена покупки -->
      <QInput
        v-model.number="formData.purchasePrice"
        data-test="purchase-price"
        label="Цена покупки"
        type="number"
        :rules="[
          val => val > 0 || 'Цена должна быть положительным числом'
        ]"
        outlined
        dense
        suffix="₽"
        @focus="onPriceFocus"
      />

      <!-- Количество -->
      <QInput
        v-model.number="formData.purchaseAmount"
        data-test="purchase-amount"
        label="Количество в упаковке"
        type="number"
        :rules="[
          val => val > 0 || 'Количество должно быть больше нуля'
        ]"
        outlined
        dense
        @focus="onAmountFocus"
      />

      <!-- Единица измерения -->
      <QSelect
        v-model="formData.purchaseUnit"
        data-test="purchase-unit"
        label="Единица измерения"
        :options="unitOptions"
        emit-value
        map-options
        outlined
        dense
        @update:model-value="onUnitChange"
      />

      <!-- Тип измерения (скрытое поле, определяется автоматически) -->
      <input type="hidden" :value="formData.type" />

      <!-- Цена за базовую единицу (только отображение) -->
      <div v-if="pricePerUnit !== null" class="text-caption text-grey-7" data-test="price-per-unit">
        Цена за базовую единицу: {{ pricePerUnit.toFixed(2) }} ₽/{{ baseUnitLabel }}
      </div>

      <!-- Валидация ошибок -->
      <div v-if="errorMessage" class="text-negative text-caption">
        {{ errorMessage }}
      </div>

      <!-- Кнопки -->
      <div class="row q-gutter-sm">
        <QBtn
          type="submit"
          color="primary"
          :label="mode === 'edit' ? 'Сохранить' : 'Добавить'"
          data-test="save-button"
        />
        <QBtn
          v-if="onCancel"
          flat
          label="Отмена"
          @click="onCancel"
        />
      </div>
    </div>
  </QForm>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Ingredient, IngredientInput, PurchaseUnit, MeasurementType } from '@/types/ingredient'
import { calculateBasePrice } from '@/utils/units'
import { useIngredientsStore } from '@/stores/ingredients'

interface Props {
  ingredient?: Ingredient
  mode?: 'create' | 'edit'
}

interface Emits {
  (e: 'save', data: IngredientInput): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<Emits>()

// Unit options grouped by type
const unitOptions = [
  { label: 'Грамм (г)', value: 'g' as PurchaseUnit },
  { label: 'Килограмм (кг)', value: 'kg' as PurchaseUnit },
  { label: 'Миллилитр (мл)', value: 'ml' as PurchaseUnit },
  { label: 'Литр (л)', value: 'l' as PurchaseUnit },
  { label: 'Штука (шт)', value: 'pcs' as PurchaseUnit },
  { label: 'Десяток (10 шт)', value: 'tens' as PurchaseUnit }
]

// Form data
const formData = ref({
  name: props.ingredient?.name || '',
  purchasePrice: props.ingredient?.purchasePrice || 0,
  purchaseAmount: props.ingredient?.purchaseAmount || 0,
  purchaseUnit: props.ingredient?.purchaseUnit || 'kg' as PurchaseUnit,
  type: props.ingredient?.type || 'weight' as MeasurementType
})

const errorMessage = ref('')

// Track if fields were focused to clear default values
const priceFocused = ref(false)
const amountFocused = ref(false)

// Determine measurement type from unit
function getMeasurementType(unit: PurchaseUnit): MeasurementType {
  if (unit === 'kg' || unit === 'g') return 'weight'
  if (unit === 'l' || unit === 'ml') return 'volume'
  return 'count'
}

// Handle unit change
function onUnitChange(unit: PurchaseUnit) {
  formData.value.type = getMeasurementType(unit)
}

// Handle focus on price field - clear if default value
function onPriceFocus() {
  if (!priceFocused.value && formData.value.purchasePrice === 0) {
    formData.value.purchasePrice = null as any
  }
  priceFocused.value = true
}

// Handle focus on amount field - clear if default value
function onAmountFocus() {
  if (!amountFocused.value && formData.value.purchaseAmount === 0) {
    formData.value.purchaseAmount = null as any
  }
  amountFocused.value = true
}

// Check if ingredient name is unique
function isNameUnique(name: string): boolean {
  // Get all ingredients from store
  const ingredientsStore = useIngredientsStore()
  const normalizedName = name.trim().toLowerCase()

  // Check if name already exists (excluding current ingredient if editing)
  return !ingredientsStore.ingredients.some(ing => {
    if (props.ingredient && ing.id === props.ingredient.id) {
      return false // Skip current ingredient when editing
    }
    return ing.name.trim().toLowerCase() === normalizedName
  })
}

// Calculate price per base unit
const pricePerUnit = computed(() => {
  try {
    if (formData.value.purchasePrice > 0 && formData.value.purchaseAmount > 0) {
      return calculateBasePrice(
        formData.value.purchasePrice,
        formData.value.purchaseAmount,
        formData.value.purchaseUnit
      )
    }
  } catch (error) {
    // Invalid calculation
  }
  return null
})

// Base unit label for display
const baseUnitLabel = computed(() => {
  if (formData.value.type === 'weight') return 'г'
  if (formData.value.type === 'volume') return 'мл'
  return 'шт'
})

// Submit handler
function onSubmit() {
  errorMessage.value = ''

  try {
    // Trim name
    const trimmedName = formData.value.name.trim()

    // Validate
    if (!trimmedName) {
      errorMessage.value = 'Название обязательно'
      return
    }

    // Check name uniqueness
    if (!isNameUnique(trimmedName)) {
      errorMessage.value = 'Ингредиент с таким названием уже существует'
      return
    }

    if (!formData.value.purchasePrice || formData.value.purchasePrice <= 0) {
      errorMessage.value = 'Цена должна быть положительным числом'
      return
    }

    if (!formData.value.purchaseAmount || formData.value.purchaseAmount <= 0) {
      errorMessage.value = 'Количество должно быть больше нуля'
      return
    }

    // Emit save event with trimmed name
    emit('save', {
      name: trimmedName,
      purchasePrice: formData.value.purchasePrice,
      purchaseAmount: formData.value.purchaseAmount,
      purchaseUnit: formData.value.purchaseUnit,
      type: formData.value.type
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Произошла ошибка'
  }
}

function onCancel() {
  emit('cancel')
}

// Initialize type on mount
onUnitChange(formData.value.purchaseUnit)
</script>

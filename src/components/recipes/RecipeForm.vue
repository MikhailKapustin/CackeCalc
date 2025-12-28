<template>
  <form @submit.prevent="onSubmit">
    <div class="q-gutter-md">
      <!-- Название -->
      <QInput
        v-model="formData.name"
        data-test="recipe-name"
        label="Название рецепта"
        outlined
        :rules="[
          val => !!val || 'Название обязательно'
        ]"
        lazy-rules
      />

      <!-- Описание -->
      <QInput
        v-model="formData.description"
        data-test="recipe-description"
        label="Описание (опционально)"
        outlined
        type="textarea"
        rows="3"
      />

      <!-- Цена продажи -->
      <QInput
        v-model.number="formData.sellingPrice"
        data-test="selling-price"
        label="Цена продажи"
        type="number"
        outlined
        suffix="₽"
        :rules="[
          val => val > 0 || 'Цена должна быть положительным числом'
        ]"
        lazy-rules
        @focus="onSellingPriceFocus"
      />

      <!-- Единица продажи -->
      <QSelect
        v-model="formData.sellingUnit"
        data-test="selling-unit"
        label="Единица продажи"
        outlined
        :options="[
          { label: 'Килограмм (кг)', value: 'kg' },
          { label: 'Штука (шт)', value: 'pcs' }
        ]"
        emit-value
        map-options
      />

      <!-- Секция ингредиентов -->
      <div data-test="ingredients-section" class="q-mt-lg">
        <div class="text-h6 q-mb-md">Ингредиенты</div>

        <!-- Список добавленных ингредиентов -->
        <QList v-if="formData.items.length > 0" bordered separator class="q-mb-md">
          <QItem
            v-for="(item, index) in formData.items"
            :key="item.ingredientId"
            data-test="recipe-item"
          >
            <QItemSection>
              <QItemLabel>{{ getIngredientName(item.ingredientId) }}</QItemLabel>
              <QItemLabel caption>
                {{ item.amount }} {{ getIngredientUnitLabel(item.ingredientId) }}
              </QItemLabel>
            </QItemSection>

            <QItemSection side>
              <div class="row items-center q-gutter-xs">
                <QInput
                  v-model.number="item.amount"
                  data-test="edit-item-amount"
                  type="number"
                  outlined
                  style="width: 120px"
                  min="0"
                  step="0.01"
                />
                <QBtn
                  flat
                  round
                  icon="delete"
                  color="negative"
                  data-test="remove-item-button"
                  @click="removeIngredient(index)"
                >
                  <QTooltip>Удалить</QTooltip>
                </QBtn>
              </div>
            </QItemSection>
          </QItem>
        </QList>

        <!-- Форма добавления ингредиента -->
        <div v-if="showIngredientSelector" class="q-gutter-md q-mb-md q-pa-md bg-grey-2 rounded-borders">
          <QSelect
            v-model="selectedIngredientId"
            data-test="ingredient-selector"
            label="Выберите ингредиент"
            outlined
            :options="availableIngredients"
            option-value="id"
            option-label="name"
            emit-value
            map-options
          >
            <template v-slot:option="scope">
              <QItem v-bind="scope.itemProps" data-test="ingredient-option">
                <QItemSection>
                  <QItemLabel>{{ scope.opt.name }}</QItemLabel>
                </QItemSection>
              </QItem>
            </template>
          </QSelect>

          <QInput
            v-model.number="ingredientAmount"
            data-test="ingredient-amount"
            :label="`Количество${selectedIngredientUnitLabel ? ' (' + selectedIngredientUnitLabel + ')' : ''}`"
            type="number"
            outlined
            min="0"
            step="0.01"
            :suffix="selectedIngredientUnitLabel"
            :rules="[
              val => val !== null && val !== '' || 'Введите количество',
              val => val > 0 || 'Количество должно быть больше нуля'
            ]"
            lazy-rules
            :disable="!selectedIngredientId"
            @focus="onIngredientAmountFocus"
          >
            <template v-if="selectedIngredientId" v-slot:hint>
              Укажите количество в базовых единицах ({{ selectedIngredientUnitLabel }})
            </template>
          </QInput>

          <div class="row q-gutter-sm">
            <QBtn
              color="primary"
              label="Добавить"
              data-test="confirm-add-ingredient"
              @click="confirmAddIngredient"
            />
            <QBtn
              flat
              label="Отмена"
              @click="cancelAddIngredient"
            />
          </div>
        </div>

        <!-- Кнопка добавления ингредиента -->
        <QBtn
          v-if="!showIngredientSelector"
          outline
          color="primary"
          icon="add"
          label="Добавить ингредиент"
          data-test="add-ingredient-button"
          @click="showIngredientSelector = true"
        />
      </div>

      <!-- Расчеты -->
      <div v-if="formData.items.length > 0" class="q-pa-md bg-blue-grey-1 rounded-borders q-mt-md">
        <!-- Себестоимость -->
        <div class="row justify-between q-mb-xs">
          <span class="text-weight-medium">Себестоимость:</span>
          <span data-test="total-cost">{{ formatPrice(totalCost) }}</span>
        </div>

        <!-- Прибыль -->
        <div v-if="formData.sellingPrice > 0" class="row justify-between q-mb-xs">
          <span class="text-weight-medium">Прибыль:</span>
          <span data-test="profit-amount" :class="profitColorClass">
            {{ formatPrice(profitAmount) }}
          </span>
        </div>

        <!-- Процент прибыли -->
        <div v-if="formData.sellingPrice > 0" class="row justify-between">
          <span class="text-weight-medium">Маржа:</span>
          <span data-test="profit-percent" :class="profitColorClass">
            {{ Math.round(profitPercent) }}%
          </span>
        </div>

        <!-- Индикатор прибыли -->
        <div
          v-if="formData.sellingPrice > 0"
          data-test="profit-indicator"
          :class="profitIndicatorClass"
          class="q-mt-sm text-caption"
        >
          {{ profitStatusText }}
        </div>

        <!-- Предупреждение об убытке -->
        <div
          v-if="profitAmount < 0"
          data-test="warning"
          class="text-negative text-caption q-mt-sm"
        >
          ⚠️ Цена ниже себестоимости! Вы продаете в убыток.
        </div>
      </div>

      <!-- Сообщения об ошибках -->
      <div v-if="errorMessage" class="text-negative q-pa-sm bg-red-1 rounded-borders">
        {{ errorMessage }}
      </div>

      <!-- Кнопки -->
      <div class="q-mt-lg">
        <QBtn
          type="submit"
          color="primary"
          size="lg"
          :label="submitButtonLabel"
          data-test="save-button"
          class="full-width"
        />
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import type { Recipe, RecipeInput, RecipeItem, SellingUnit } from '@/types/recipe'

interface Props {
  recipe?: Recipe
  mode?: 'create' | 'edit'
}

interface Emits {
  (e: 'save', data: RecipeInput): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<Emits>()

const ingredientsStore = useIngredientsStore()
const recipesStore = useRecipesStore()

// Form data
const formData = ref<{
  name: string
  description: string
  sellingPrice: number
  sellingUnit: SellingUnit
  items: RecipeItem[]
}>({
  name: props.recipe?.name || '',
  description: props.recipe?.description || '',
  sellingPrice: props.recipe?.sellingPrice || 0,
  sellingUnit: props.recipe?.sellingUnit || 'kg',
  items: props.recipe?.items ? [...props.recipe.items] : []
})

const errorMessage = ref('')

// Ingredient selection
const showIngredientSelector = ref(false)
const selectedIngredientId = ref<number | null>(null)
const ingredientAmount = ref(0)
const ingredientAmountFocused = ref(false)

// Track if selling price was focused to clear default values
const sellingPriceFocused = ref(false)

// Available ingredients (exclude already added)
const availableIngredients = computed(() => {
  const addedIds = formData.value.items.map(item => item.ingredientId)
  return ingredientsStore.ingredients
    .filter(ing => !addedIds.includes(ing.id))
})

// Get unit label for selected ingredient in ingredient selector
const selectedIngredientUnitLabel = computed(() => {
  if (selectedIngredientId.value === null) return ''

  const ingredient = ingredientsStore.getById(selectedIngredientId.value)
  if (!ingredient) return ''

  if (ingredient.type === 'weight') return 'г'
  if (ingredient.type === 'volume') return 'мл'
  return 'шт'
})

// Helper to get ingredient name
function getIngredientName(ingredientId: number): string {
  const ingredient = ingredientsStore.getById(ingredientId)
  return ingredient?.name || 'Неизвестный ингредиент'
}

// Helper to get ingredient unit label
function getIngredientUnitLabel(ingredientId: number): string {
  const ingredient = ingredientsStore.getById(ingredientId)
  if (!ingredient) return ''

  if (ingredient.type === 'weight') return 'г'
  if (ingredient.type === 'volume') return 'мл'
  return 'шт'
}

// Handle focus on selling price field - clear if default value
function onSellingPriceFocus() {
  if (!sellingPriceFocused.value && formData.value.sellingPrice === 0) {
    formData.value.sellingPrice = null as any
  }
  sellingPriceFocused.value = true
}

// Handle focus on ingredient amount field - clear if default value
function onIngredientAmountFocus() {
  if (!ingredientAmountFocused.value && ingredientAmount.value === 0) {
    ingredientAmount.value = null as any
  }
  ingredientAmountFocused.value = true
}

// Add ingredient to recipe
function confirmAddIngredient() {
  if (selectedIngredientId.value === null) {
    return
  }

  if (ingredientAmount.value <= 0) {
    return
  }

  formData.value.items.push({
    ingredientId: selectedIngredientId.value,
    amount: ingredientAmount.value
  })

  // Reset
  selectedIngredientId.value = null
  ingredientAmount.value = 0
  ingredientAmountFocused.value = false
  showIngredientSelector.value = false
}

function cancelAddIngredient() {
  selectedIngredientId.value = null
  ingredientAmount.value = 0
  ingredientAmountFocused.value = false
  showIngredientSelector.value = false
}

// Remove ingredient from recipe
function removeIngredient(index: number) {
  formData.value.items.splice(index, 1)
}

// Calculate total cost
const totalCost = computed(() => {
  return formData.value.items.reduce((sum, item) => {
    const ingredient = ingredientsStore.getById(item.ingredientId)
    if (!ingredient) return sum
    return sum + (ingredient.pricePerBaseUnit * item.amount)
  }, 0)
})

// Calculate profit
const profitAmount = computed(() => {
  return formData.value.sellingPrice - totalCost.value
})

const profitPercent = computed(() => {
  if (totalCost.value === 0) return 0
  return (profitAmount.value / totalCost.value) * 100
})

// Profit color based on percentage
const profitColorClass = computed(() => {
  if (profitPercent.value > 50) return 'text-positive'
  if (profitPercent.value > 20) return 'text-orange'
  if (profitPercent.value < 0) return 'text-negative'
  return 'text-grey-8'
})

const profitIndicatorClass = computed(() => {
  return profitColorClass.value
})

const profitStatusText = computed(() => {
  if (profitPercent.value > 50) return '✓ Отличная маржа'
  if (profitPercent.value > 20) return '○ Нормальная маржа'
  if (profitPercent.value > 0) return '△ Низкая маржа'
  return '✗ Убыточная цена'
})

// Submit button label
const submitButtonLabel = computed(() => {
  return props.mode === 'edit' ? 'Сохранить' : 'Создать рецепт'
})

// Format price
function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
  // Replace non-breaking spaces with regular spaces for testing
  return formatted.replace(/\u00A0/g, ' ')
}

// Submit handler
function onSubmit() {
  errorMessage.value = ''

  try {
    // Validate selling price first (if it's explicitly negative)
    if (formData.value.sellingPrice < 0) {
      errorMessage.value = 'Цена должна быть положительным числом'
      return
    }

    // Validate name
    const trimmedName = formData.value.name.trim()
    if (!trimmedName) {
      errorMessage.value = 'Название обязательно'
      return
    }

    // Validate selling price (required and positive)
    if (!formData.value.sellingPrice || formData.value.sellingPrice <= 0) {
      errorMessage.value = 'Цена должна быть положительным числом'
      return
    }

    // Validate at least one ingredient
    if (formData.value.items.length === 0) {
      errorMessage.value = 'Добавьте хотя бы один ингредиент'
      return
    }

    // Emit save event
    emit('save', {
      name: trimmedName,
      description: formData.value.description.trim() || undefined,
      sellingPrice: formData.value.sellingPrice,
      sellingUnit: formData.value.sellingUnit,
      items: formData.value.items
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Произошла ошибка'
  }
}

function onCancel() {
  emit('cancel')
}
</script>

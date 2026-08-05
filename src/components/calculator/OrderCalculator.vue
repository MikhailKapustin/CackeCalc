<template>
  <div>
      <!-- Recipe selector -->
      <QSelect
        v-model="selectedRecipeId"
        :options="recipeOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        :label="$t('calculator.selectRecipe')"
        outlined
        class="q-mb-sm"
        data-test="recipe-select"
      />

      <!-- Weight/Quantity input -->
      <QInput
        v-model.number="weight"
        type="number"
        :label="weightLabel"
        outlined
        class="ct-field-num"
        data-test="weight-input"
        :rules="[
          val => val !== null && val !== '' || $t('calculator.enterAmount'),
          val => val > 0 || $t('calculator.amountPositive')
        ]"
        lazy-rules
        @focus="onWeightFocus"
      >
        <template v-slot:append>
          <span data-test="unit-label" class="ct-num-unit">{{ unitLabel }}</span>
        </template>
      </QInput>

      <!-- What the client pays: the one number this screen exists for -->
      <div v-if="selectedRecipe && weight > 0" class="ct-card ct-card--pad q-mb-md">
        <div class="ct-label">{{ $t('calculator.total') }}</div>
        <div class="ct-num-hero q-mt-xs" data-test="total-price">
          {{ formattedTotal }} <span class="ct-num-unit">{{ settingsStore.currency }}</span>
        </div>

        <!-- Profit for confectioner (internal view only) -->
        <div class="ct-row q-mt-sm" data-test="profit">
          <span class="ct-row__key">{{ $t('calculator.profit') }}</span>
          <span class="ct-row__val ct-profit">
            {{ formattedProfit }} {{ settingsStore.currency }}
          </span>
        </div>
      </div>

      <!-- Where the cost goes: the ribbon at full height, with names -->
      <div v-if="selectedRecipe" class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('recipes.costBreakdown.title') }}</div>
        <div class="ct-card ct-card--pad">
          <CostRibbon :recipe="selectedRecipe" tall legend />
        </div>
      </div>

      <!-- Receipt Preview -->
      <div v-if="selectedRecipe && weight > 0 && receiptImageUrl" class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('calculator.receiptPreview') }}</div>
        <div class="ct-card ct-card--pad">
          <img
            :src="receiptImageUrl"
            :alt="$t('calculator.receiptPreview')"
            class="receipt-image"
            style="width: 100%; max-width: 600px; display: block; margin: 0 auto; border-radius: 4px;"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="ct-actions q-mt-md">
        <QBtn
          v-if="selectedRecipe && weight > 0"
          :label="$t('calculator.share')"
          color="primary"
          unelevated
          icon="share"
          data-test="share-button"
          @click="handleShare"
          class="col"
        />
        <QBtn
          flat
          :label="$t('common.close')"
          @click="emit('close')"
          class="col"
        />
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'
import { calculateOrderTotal } from '@/utils/receiptGenerator'
import { generateReceiptImage, generateReceiptImageDataURL } from '@/utils/receiptImageGenerator'
import CostRibbon from '@/components/common/CostRibbon.vue'
import type { Recipe } from '@/types/recipe'

interface Props {
  recipe?: Recipe
}

const props = defineProps<Props>()

const emit = defineEmits<{
  share: [receiptBlob: Blob]
  close: []
}>()

const $q = useQuasar()
const recipesStore = useRecipesStore()
const settingsStore = useSettingsStore()
const receiptSettingsStore = useReceiptSettingsStore()

const selectedRecipeId = ref<number | null>(props.recipe?.id || null)
const weight = ref<number>(0)

// Track if weight field was focused to clear default values
const weightFocused = ref(false)

// Receipt image preview
const receiptImageUrl = ref<string>('')

// Load receipt settings on mount
onMounted(async () => {
  await receiptSettingsStore.loadSettings()
})

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
    currency: settingsStore.currency
  }
})

// Receipt customization (Pro feature)
const receiptCustomization = computed(() => ({
  settings: receiptSettingsStore.settings,
  showWatermark: receiptSettingsStore.shouldShowWatermark,
  watermarkText: receiptSettingsStore.watermarkText
}))

// Watch for changes and regenerate receipt image
watch(receiptData, async (data) => {
  if (data) {
    try {
      receiptImageUrl.value = await generateReceiptImageDataURL(data, receiptCustomization.value)
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
    await shareReceipt()
  } catch (error) {
    console.error('Failed to share receipt:', error)
  }
}

async function shareReceipt() {
  if (!receiptData.value) return

  try {
    const receiptBlob = await generateReceiptImage(receiptData.value, receiptCustomization.value)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `receipt-${receiptData.value.recipeName}-${timestamp}.png`

    // Convert blob to base64 for Capacitor Share
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(receiptBlob)
    })

    const base64Data = await base64Promise

    // Try to use Capacitor Share API (works on mobile and web)
    try {
      // For Capacitor, we need to save the file first, then share it
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      })

      await Share.share({
        title: receiptData.value.recipeName,
        text: `Чек заказа: ${receiptData.value.recipeName}`,
        url: savedFile.uri,
        dialogTitle: 'Отправить чек клиенту'
      })

      $q.notify({
        type: 'positive',
        message: 'Чек успешно отправлен',
        icon: 'share'
      })

      // Auto-close calculator after successful share
      emit('close')

      // Clean up the temporary file after a delay
      setTimeout(async () => {
        try {
          await Filesystem.deleteFile({
            path: filename,
            directory: Directory.Cache
          })
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 5000)

    } catch (shareError: any) {
      // If Capacitor Share fails, try Web Share API
      if ('share' in navigator && navigator.canShare) {
        const file = new File([receiptBlob], filename, { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: receiptData.value.recipeName,
            text: `Чек заказа: ${receiptData.value.recipeName}`
          })

          $q.notify({
            type: 'positive',
            message: 'Чек успешно отправлен',
            icon: 'share'
          })

          emit('close')
        } else {
          throw new Error('Cannot share files')
        }
      } else {
        // Last fallback: emit to parent component
        emit('share', receiptBlob)
        $q.notify({
          type: 'info',
          message: 'Используйте кнопку в системном диалоге для отправки',
          icon: 'info'
        })
      }
    }
  } catch (error: any) {
    // Don't show error if user cancelled the share dialog
    if (error?.name !== 'AbortError') {
      console.error('Failed to share receipt:', error)
      $q.notify({
        type: 'negative',
        message: 'Не удалось отправить чек',
        icon: 'error'
      })
    }
  }
}
</script>

<template>
  <QPage padding>
    <div class="q-pa-md">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5">{{ $t('recipes.title') }}</div>
        <QBtn
          color="primary"
          icon="add"
          :label="$t('recipes.add')"
          @click="showAddDialog = true"
        />
      </div>

      <!-- Recipes List -->
      <RecipeList
        @edit="handleEdit"
        @delete="handleDelete"
        @calculate="handleCalculate"
      />

      <!-- Add/Edit Dialog -->
      <QDialog v-model="showAddDialog" maximized>
        <QCard>
          <QToolbar class="bg-primary text-white">
            <QToolbarTitle>
              {{ editingRecipe ? $t('recipes.edit') : $t('recipes.add') }}
            </QToolbarTitle>
            <QBtn flat round dense icon="close" v-close-popup />
          </QToolbar>

          <QCardSection>
            <RecipeForm
              :recipe="editingRecipe"
              :mode="editingRecipe ? 'edit' : 'create'"
              @save="handleSave"
              @cancel="handleCancel"
            />
          </QCardSection>
        </QCard>
      </QDialog>

      <!-- Order Calculator Dialog -->
      <QDialog v-model="showCalculatorDialog">
        <QCard style="min-width: 400px; max-width: 600px;">
          <QCardSection>
            <div class="text-h6">{{ $t('calculator.title') }}</div>
          </QCardSection>

          <QCardSection class="q-pt-none">
            <OrderCalculator
              v-if="selectedRecipe"
              :recipe="selectedRecipe"
              @close="handleCalculatorClose"
              @share="handleShareReceipt"
            />
          </QCardSection>
        </QCard>
      </QDialog>
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'
import { useAdsStore } from '@/stores/ads'
import RecipeList from '@/components/recipes/RecipeList.vue'
import RecipeForm from '@/components/recipes/RecipeForm.vue'
import OrderCalculator from '@/components/calculator/OrderCalculator.vue'
import type { Recipe, RecipeInput } from '@/types/recipe'

const $q = useQuasar()
const { t } = useI18n()
const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()
const adsStore = useAdsStore()

const showAddDialog = ref(false)
const editingRecipe = ref<Recipe | undefined>(undefined)

const showCalculatorDialog = ref(false)
const selectedRecipe = ref<Recipe | undefined>(undefined)

// Load data on mount
onMounted(async () => {
  try {
    // Load ingredients first (needed for cost calculations)
    await ingredientsStore.loadIngredients()
    // Then load recipes
    await recipesStore.loadRecipes()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('common.error')
    })
  }
})

function handleEdit(id: number) {
  const recipe = recipesStore.getById(id)
  if (recipe) {
    editingRecipe.value = recipe
    showAddDialog.value = true
  }
}

async function handleDelete(id: number) {
  // Deletion is handled in RecipeList component
  $q.notify({
    type: 'positive',
    message: t('common.success')
  })
}

async function handleSave(recipeData: RecipeInput) {
  try {
    if (editingRecipe.value) {
      // Update existing recipe
      await recipesStore.updateRecipe(editingRecipe.value.id, recipeData)
      $q.notify({
        type: 'positive',
        message: t('common.success')
      })
    } else {
      // Create new recipe
      await recipesStore.addRecipe(recipeData)
      $q.notify({
        type: 'positive',
        message: t('common.success')
      })
    }

    // Close dialog and reset
    showAddDialog.value = false
    editingRecipe.value = undefined

    // Show interstitial ad for Free users after saving recipe
    await adsStore.showInterstitial('recipe_saved')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('common.error')
    })
  }
}

function handleCancel() {
  showAddDialog.value = false
  editingRecipe.value = undefined
}

function handleCalculate(id: number) {
  const recipe = recipesStore.getById(id)
  if (recipe) {
    selectedRecipe.value = recipe
    showCalculatorDialog.value = true
  }
}

function handleCalculatorClose() {
  showCalculatorDialog.value = false
  selectedRecipe.value = undefined
}

async function handleShareReceipt(receiptBlob: Blob) {
  const platform = Capacitor.getPlatform()
  console.log('Platform:', platform)
  console.log('Attempting to share receipt image')

  try {
    // On native platforms, save to file system and share
    if (platform === 'android' || platform === 'ios') {
      // Convert blob to base64
      const base64Data = await blobToBase64(receiptBlob)

      // Remove data URL prefix to get pure base64
      const base64String = base64Data.split(',')[1]

      // Save to cache directory
      const fileName = `receipt-${Date.now()}.png`

      console.log('Writing file to cache:', fileName)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64String,
        directory: Directory.Cache
      })

      console.log('File written:', result.uri)

      // Share the file using Capacitor Share
      await Share.share({
        title: 'Чек заказа',
        text: 'Расчет стоимости заказа',
        url: result.uri,
        dialogTitle: 'Отправить чек клиенту'
      })

      console.log('Share successful')

      // Close calculator dialog immediately after share
      showCalculatorDialog.value = false
      selectedRecipe.value = undefined

      // Clean up temp file after a delay
      setTimeout(async () => {
        try {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Cache
          })
          console.log('Temp file deleted')
        } catch (e) {
          console.log('Could not delete temp file:', e)
        }
      }, 5000)

      $q.notify({
        type: 'positive',
        message: 'Чек отправлен',
        icon: 'share'
      })
    } else {
      // Web platform - use download
      console.log('Web platform, using download')
      downloadImage(receiptBlob)
    }
  } catch (error) {
    console.error('Share error:', error)

    // If sharing was cancelled by user, don't show error
    if (error instanceof Error && (
      error.message.includes('cancelled') ||
      error.message.includes('Share canceled')
    )) {
      console.log('Share cancelled by user')
      return
    }

    // Fallback to download
    console.log('Falling back to download')
    downloadImage(receiptBlob)
  }
}

// Helper function to convert Blob to base64 data URL
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function downloadImage(blob: Blob) {
  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'receipt.png'
  link.click()
  URL.revokeObjectURL(url)

  $q.notify({
    type: 'positive',
    message: 'Чек сохранен в загрузки',
    icon: 'download'
  })
}
</script>

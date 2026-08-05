<template>
  <QPage padding :style="{ paddingBottom: adsStore.bannerHeight }">
    <div class="q-pa-md">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5">{{ $t('ingredients.title') }}</div>
        <QBtn
          color="primary"
          icon="add"
          :label="$t('ingredients.add')"
          @click="showAddDialog = true"
        />
      </div>

      <!-- Ingredients List -->
      <IngredientList
        :highlighted-id="highlightedIngredientId"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- Add/Edit Dialog -->
      <QDialog v-model="showAddDialog" @hide="resetForm">
        <QCard style="min-width: 350px">
          <QCardSection>
            <div class="text-h6">
              {{ editingIngredient ? $t('ingredients.edit') : $t('ingredients.add') }}
            </div>
          </QCardSection>

          <QCardSection class="q-pt-none">
            <IngredientForm
              :ingredient="editingIngredient"
              :mode="editingIngredient ? 'edit' : 'create'"
              @save="handleSave"
              @cancel="showAddDialog = false"
            />
          </QCardSection>
        </QCard>
      </QDialog>
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useIngredientsStore } from '@/stores/ingredients'
import { useAdsStore } from '@/stores/ads'
import IngredientList from '@/components/ingredients/IngredientList.vue'
import IngredientForm from '@/components/ingredients/IngredientForm.vue'
import type { Ingredient, IngredientInput } from '@/types/ingredient'

const $q = useQuasar()
const { t } = useI18n()
const store = useIngredientsStore()
const adsStore = useAdsStore()

const showAddDialog = ref(false)
const editingIngredient = ref<Ingredient | undefined>(undefined)
const highlightedIngredientId = ref<number | null>(null)

// Retry timer for the first load, cleared on unmount so it cannot fire into a dead component
let loadRetryTimer: ReturnType<typeof setTimeout> | null = null

// Load ingredients on mount
onMounted(async () => {
  try {
    await store.loadIngredients()
  } catch (error) {
    // SQLite plugin can take up to ~5s to initialize on Android — retry once silently
    console.warn('Failed to load ingredients on mount, retrying in 5s:', error)
    loadRetryTimer = setTimeout(async () => {
      loadRetryTimer = null
      try {
        await store.loadIngredients()
      } catch (retryError) {
        // Say it out loud: an empty list after a failed load looks exactly like an
        // empty database, so staying silent reads as "my ingredients disappeared".
        console.error('Failed to load ingredients after retry:', retryError)
        $q.notify({
          type: 'negative',
          message: t('common.error')
        })
      }
    }, 5000)
  }

  // Show banner ad for Free users
  try {
    await adsStore.showBanner()
  } catch (adError) {
    console.warn('Failed to show banner ad:', adError)
  }
})

onUnmounted(() => {
  if (loadRetryTimer) {
    clearTimeout(loadRetryTimer)
    loadRetryTimer = null
  }
})

async function handleSave(data: IngredientInput) {
  try {
    let ingredientId: number

    if (editingIngredient.value) {
      // Update existing ingredient
      await store.updateIngredient(editingIngredient.value.id, data)
      ingredientId = editingIngredient.value.id
      $q.notify({
        type: 'positive',
        message: t('common.success')
      })
    } else {
      // Add new ingredient
      const newIngredient = await store.addIngredient(data)
      ingredientId = newIngredient.id
      $q.notify({
        type: 'positive',
        message: t('common.success')
      })
    }

    showAddDialog.value = false
    resetForm()

    // Highlight the ingredient and clear after 3 seconds
    highlightedIngredientId.value = ingredientId
    setTimeout(() => {
      highlightedIngredientId.value = null
    }, 3000)
  } catch (error) {
    console.error('Error in handleSave:', error)
    $q.notify({
      type: 'negative',
      message: t('common.error')
    })
  }
}

function handleEdit(id: number) {
  const ingredient = store.getById(id)
  if (ingredient) {
    editingIngredient.value = ingredient
    showAddDialog.value = true
  }
}

async function handleDelete(id: number) {
  // Deletion is handled in IngredientList component
  $q.notify({
    type: 'positive',
    message: t('common.success')
  })
}

function resetForm() {
  editingIngredient.value = undefined
}
</script>

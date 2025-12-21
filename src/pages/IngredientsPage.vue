<template>
  <QPage padding>
    <div class="q-pa-md">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5">Склад ингредиентов</div>
        <QBtn
          color="primary"
          icon="add"
          label="Добавить"
          @click="showAddDialog = true"
        />
      </div>

      <!-- Ingredients List -->
      <IngredientList
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- Add/Edit Dialog -->
      <QDialog v-model="showAddDialog" @hide="resetForm">
        <QCard style="min-width: 350px">
          <QCardSection>
            <div class="text-h6">
              {{ editingIngredient ? 'Редактировать ингредиент' : 'Добавить ингредиент' }}
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
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useIngredientsStore } from '@/stores/ingredients'
import IngredientList from '@/components/ingredients/IngredientList.vue'
import IngredientForm from '@/components/ingredients/IngredientForm.vue'
import type { Ingredient, IngredientInput } from '@/types/ingredient'

const $q = useQuasar()
const store = useIngredientsStore()

const showAddDialog = ref(false)
const editingIngredient = ref<Ingredient | undefined>(undefined)

// Load ingredients on mount
onMounted(async () => {
  try {
    await store.loadIngredients()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка загрузки ингредиентов'
    })
  }
})

async function handleSave(data: IngredientInput) {
  try {
    if (editingIngredient.value) {
      // Update existing ingredient
      await store.updateIngredient(editingIngredient.value.id, data)
      $q.notify({
        type: 'positive',
        message: 'Ингредиент обновлен'
      })
    } else {
      // Add new ingredient
      await store.addIngredient(data)
      $q.notify({
        type: 'positive',
        message: 'Ингредиент добавлен'
      })
    }

    showAddDialog.value = false
    resetForm()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка сохранения ингредиента'
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
    message: 'Ингредиент удален'
  })
}

function resetForm() {
  editingIngredient.value = undefined
}
</script>

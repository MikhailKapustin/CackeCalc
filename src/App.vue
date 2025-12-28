<template>
  <div id="q-app">
    <QLayout view="lHh Lpr lFf">
      <QHeader elevated>
        <QToolbar>
          <QToolbarTitle>
            CakeCost
          </QToolbarTitle>
        </QToolbar>

        <!-- Navigation Tabs -->
        <QTabs v-model="currentTab" align="center" class="text-white">
          <QTab name="ingredients" icon="kitchen" :label="$t('ingredients.title')" />
          <QTab name="recipes" icon="cake" :label="$t('recipes.title')" />
          <QTab name="settings" icon="settings" :label="$t('settings.title')" />
        </QTabs>
      </QHeader>

      <QPageContainer>
        <!-- Tab Panels -->
        <QTabPanels v-model="currentTab" animated>
          <QTabPanel name="ingredients">
            <IngredientsPage />
          </QTabPanel>

          <QTabPanel name="recipes">
            <RecipesPage />
          </QTabPanel>

          <QTabPanel name="settings">
            <SettingsPage />
          </QTabPanel>
        </QTabPanels>
      </QPageContainer>
    </QLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IngredientsPage from '@/pages/IngredientsPage.vue'
import RecipesPage from '@/pages/RecipesPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const currentTab = ref('ingredients')
</script>

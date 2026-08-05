<template>
  <div id="q-app">
    <QLayout view="lHh Lpr lFf">
      <QHeader class="ct-header">
        <QToolbar class="ct-toolbar">
          <QToolbarTitle class="ct-wordmark">CakeCost</QToolbarTitle>

          <!-- Settings are not daily work, so they live here instead of taking
               a third of the navigation -->
          <QBtn
            flat
            round
            dense
            icon="settings"
            :aria-label="$t('settings.title')"
            data-test="settings-button"
            @click="showSettings = true"
          >
            <QTooltip>{{ $t('settings.title') }}</QTooltip>
          </QBtn>
        </QToolbar>

        <!-- Navigation stays in the header: the AdMob banner is pinned to the
             bottom of the screen and would sit on top of a bottom tab bar -->
        <QTabs
          v-model="currentTab"
          class="ct-nav"
          align="justify"
          no-caps
          indicator-color="transparent"
        >
          <QTab name="ingredients" icon="kitchen" :label="$t('ingredients.title')" />
          <QTab name="recipes" icon="cake" :label="$t('recipes.title')" />
        </QTabs>
      </QHeader>

      <QPageContainer>
        <!-- Tab Panels -->
        <QTabPanels v-model="currentTab" animated class="ct-panels">
          <QTabPanel name="ingredients">
            <IngredientsPage />
          </QTabPanel>

          <QTabPanel name="recipes">
            <RecipesPage />
          </QTabPanel>
        </QTabPanels>
      </QPageContainer>

      <!-- Settings open over the app and close back to where you were -->
      <QDialog v-model="showSettings" maximized transition-show="slide-up" transition-hide="slide-down">
        <QCard class="ct-settings-card">
          <QToolbar class="ct-header">
            <QToolbarTitle class="ct-dialog-title">{{ $t('settings.title') }}</QToolbarTitle>
            <QBtn flat round dense icon="close" :aria-label="$t('common.close')" v-close-popup />
          </QToolbar>

          <div class="ct-settings-card__body">
            <SettingsPage />
          </div>
        </QCard>
      </QDialog>

      <!-- Ad Banner for Free users -->
      <AdBanner />
    </QLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IngredientsPage from '@/pages/IngredientsPage.vue'
import RecipesPage from '@/pages/RecipesPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import AdBanner from '@/components/common/AdBanner.vue'

const currentTab = ref('ingredients')
const showSettings = ref(false)
</script>

<style scoped>
.ct-settings-card {
  background: var(--ct-bg);
}

.ct-settings-card__body {
  overflow-y: auto;
}
</style>

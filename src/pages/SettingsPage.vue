<template>
  <QPage class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ $t('settings.title') }}</div>

    <QList bordered separator class="rounded-borders">
      <!-- Language Selection -->
      <QItem>
        <QItemSection>
          <QItemLabel class="text-weight-medium">
            {{ $t('settings.language') }}
          </QItemLabel>
          <div class="q-mt-sm">
            <LanguageSwitcher />
          </div>
        </QItemSection>
      </QItem>

      <!-- Currency Selection -->
      <QItem>
        <QItemSection>
          <QItemLabel class="text-weight-medium">
            {{ $t('settings.currency') }}
          </QItemLabel>
          <div class="q-mt-sm">
            <QSelect
              v-model="settingsStore.currency"
              :options="currencyOptions"
              outlined
              emit-value
              map-options
              @update:model-value="changeCurrency"
            >
              <template #prepend>
                <QIcon name="attach_money" />
              </template>
            </QSelect>
          </div>
        </QItemSection>
      </QItem>

      <!-- Theme Selection -->
      <QItem>
        <QItemSection>
          <QItemLabel class="text-weight-medium">
            {{ $t('settings.theme') }}
          </QItemLabel>
          <div class="q-mt-sm">
            <QBtnToggle
              v-model="settingsStore.theme"
              spread
              no-caps
              toggle-color="primary"
              :options="themeOptions"
              @update:model-value="changeTheme"
            />
          </div>
        </QItemSection>
      </QItem>

      <!-- About Section -->
      <QItem>
        <QItemSection>
          <QItemLabel class="text-weight-medium">
            {{ $t('settings.about') }}
          </QItemLabel>
          <QItemLabel caption>
            {{ $t('settings.version') }}: 1.0.0
          </QItemLabel>
        </QItemSection>
      </QItem>
    </QList>
  </QPage>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore, type Currency, type ThemeMode } from '@/stores/settings'
import LanguageSwitcher from '@/components/settings/LanguageSwitcher.vue'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const currencyOptions = computed(() => [
  { label: `₽ - ${t('currencies.ruble')}`, value: '₽' },
  { label: `$ - ${t('currencies.dollar')}`, value: '$' },
  { label: `€ - ${t('currencies.euro')}`, value: '€' },
  { label: `£ - ${t('currencies.pound')}`, value: '£' },
  { label: `₸ - ${t('currencies.tenge')}`, value: '₸' },
  { label: `₴ - ${t('currencies.hryvnia')}`, value: '₴' }
])

const themeOptions = computed(() => [
  { label: t('settings.themeLight'), value: 'light' },
  { label: t('settings.themeDark'), value: 'dark' },
  { label: t('settings.themeAuto'), value: 'auto' }
])

const changeCurrency = async (newCurrency: Currency) => {
  await settingsStore.saveCurrency(newCurrency)
}

const changeTheme = async (newTheme: ThemeMode) => {
  await settingsStore.saveTheme(newTheme)
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>

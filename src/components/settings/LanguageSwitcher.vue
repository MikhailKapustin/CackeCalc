<template>
  <div class="language-switcher">
    <QSelect
      v-model="settingsStore.language"
      :options="languageOptions"
      :label="$t('settings.language')"
      outlined
      emit-value
      map-options
      @update:model-value="changeLanguage"
    >
      <template #prepend>
        <QIcon name="language" />
      </template>
    </QSelect>
  </div>
</template>

<script setup lang="ts">
import { setI18nLanguage, type SupportedLocale } from '@/boot/i18n'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Русский', value: 'ru' },
  { label: 'Español', value: 'es' },
  { label: 'Қазақша', value: 'kk' },
  { label: 'Deutsch', value: 'de' }
]

const changeLanguage = async (newLocale: SupportedLocale) => {
  // Update i18n locale
  setI18nLanguage(newLocale)

  // Save to database via settings store
  await settingsStore.saveLanguage(newLocale)
}
</script>

<style scoped>
.language-switcher {
  width: 100%;
  max-width: 300px;
}
</style>

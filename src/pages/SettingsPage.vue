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

      <!-- Data Management Section -->
      <QItem>
        <QItemSection>
          <QItemLabel class="text-weight-medium">
            {{ $t('settings.dataManagement') }}
          </QItemLabel>
          <div class="q-mt-sm q-gutter-sm">
            <QBtn
              color="primary"
              outline
              no-caps
              icon="upload"
              :label="$t('settings.exportData')"
              @click="handleExport"
              :loading="exportLoading"
            />
            <QBtn
              color="primary"
              outline
              no-caps
              icon="download"
              :label="$t('settings.importData')"
              @click="handleImport"
              :loading="importLoading"
            />
          </div>
          <QItemLabel caption class="q-mt-sm">
            {{ $t('settings.dataManagementHint') }}
          </QItemLabel>
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

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      style="display: none"
      @change="onFileSelected"
    />

    <!-- Receipt Customization Section (Pro Feature) -->
    <div class="q-mt-lg">
      <ReceiptCustomization />
    </div>
  </QPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSettingsStore, type Currency, type ThemeMode } from '@/stores/settings'
import { applyTheme } from '@/utils/theme'
import { exportData, generateExportFilename } from '@/utils/exportData'
import { importData } from '@/utils/importData'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import LanguageSwitcher from '@/components/settings/LanguageSwitcher.vue'
import ReceiptCustomization from '@/components/settings/ReceiptCustomization.vue'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const $q = useQuasar()

// Export/Import state
const exportLoading = ref(false)
const importLoading = ref(false)
const fileInput = ref<HTMLInputElement>()

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
  // Save to database
  await settingsStore.saveTheme(newTheme)
  // Apply theme immediately (the watcher in boot/theme.ts will also apply it)
  applyTheme(newTheme)
}

// Export data handler
const handleExport = async () => {
  try {
    exportLoading.value = true

    // Export data to JSON
    const data = await exportData()
    const jsonString = JSON.stringify(data, null, 2)

    // Generate filename
    const filename = generateExportFilename()

    // Write to temporary file
    const result = await Filesystem.writeFile({
      path: filename,
      data: jsonString,
      directory: Directory.Cache
    })

    // Share the file
    await Share.share({
      title: t('settings.exportData'),
      text: t('settings.exportDataMessage'),
      url: result.uri,
      dialogTitle: t('settings.shareBackup')
    })

    $q.notify({
      type: 'positive',
      message: t('settings.exportSuccess'),
      position: 'top'
    })
  } catch (error) {
    console.error('Export failed:', error)
    $q.notify({
      type: 'negative',
      message: t('settings.exportError'),
      position: 'top'
    })
  } finally {
    exportLoading.value = false
  }
}

// Import data handler
const handleImport = () => {
  // Trigger file input click
  fileInput.value?.click()
}

// Handle file selection
const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    importLoading.value = true

    // Read file content
    const fileContent = await file.text()
    const data = JSON.parse(fileContent)

    // Import data
    const result = await importData(data)

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: t('settings.importSuccess'),
        position: 'top'
      })

      // Reload page to reflect imported data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      if (result.showPaywall) {
        // Show paywall dialog
        $q.dialog({
          title: t('settings.upgradeRequired'),
          message: result.error || t('settings.importLimitExceeded'),
          ok: {
            label: t('settings.upgradeToPro'),
            color: 'primary'
          },
          cancel: {
            label: t('common.cancel'),
            flat: true
          }
        })
      } else {
        $q.notify({
          type: 'negative',
          message: result.error || t('settings.importError'),
          position: 'top'
        })
      }
    }
  } catch (error) {
    console.error('Import failed:', error)
    $q.notify({
      type: 'negative',
      message: t('settings.importInvalidFile'),
      position: 'top'
    })
  } finally {
    importLoading.value = false
    // Reset file input
    if (target) {
      target.value = ''
    }
  }
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>

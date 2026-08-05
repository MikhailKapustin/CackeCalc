<template>
  <!-- Rendered inside the settings dialog, not as a routed page: a QPage here
       would be a QPage without its QPageContainer -->
  <div class="ct-settings">
    <div class="ct-page">
      <!-- Language -->
      <section class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('settings.language') }}</div>
        <div class="ct-card ct-card--pad">
          <LanguageSwitcher />
        </div>
      </section>

      <!-- Currency -->
      <section class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('settings.currency') }}</div>
        <div class="ct-card ct-card--pad">
          <QSelect
            v-model="settingsStore.currency"
            :options="currencyOptions"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="changeCurrency"
          />
        </div>
      </section>

      <!-- Theme -->
      <section class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('settings.theme') }}</div>
        <div class="ct-card ct-card--pad">
          <QBtnToggle
            v-model="settingsStore.theme"
            spread
            unelevated
            no-caps
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="themeOptions"
            @update:model-value="changeTheme"
          />
        </div>
      </section>

      <!-- Data Management -->
      <section class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('settings.dataManagement') }}</div>
        <div class="ct-card ct-card--pad">
          <div class="ct-actions">
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
          <p class="ct-section__hint">{{ $t('settings.dataManagementHint') }}</p>
        </div>
      </section>

      <!-- Purchases: Google Play requires a way to restore a one-time purchase,
           and without it a reinstall silently loses paid Pro -->
      <section class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('settings.purchases') }}</div>
        <div class="ct-card ct-card--pad">
          <div class="ct-row q-mb-sm">
            <span class="ct-row__key">{{ $t('settings.proStatus') }}</span>
            <span class="ct-stamp" :class="{ 'ct-stamp--profit': settingsStore.isPro }">
              {{ settingsStore.isPro ? $t('settings.proActive') : $t('settings.proFree') }}
            </span>
          </div>

          <QBtn
            color="primary"
            outline
            no-caps
            icon="restore"
            :label="$t('settings.restorePurchases')"
            :loading="restoreLoading"
            data-test="restore-purchases"
            @click="handleRestorePurchases"
          />
          <p class="ct-section__hint">{{ $t('settings.restorePurchasesHint') }}</p>
        </div>
      </section>

      <!-- About -->
      <section class="ct-section">
        <div class="ct-label ct-section__label">{{ $t('settings.about') }}</div>
        <div class="ct-card ct-card--pad">
          <div class="ct-row">
            <span class="ct-row__key">{{ $t('settings.version') }}</span>
            <span class="ct-row__val">{{ appVersion }}</span>
          </div>
        </div>
      </section>

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      style="display: none"
      @change="onFileSelected"
    />

      <!-- Receipt Customization Section (Pro Feature) -->
      <ReceiptCustomization />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { Capacitor } from '@capacitor/core'
import { useSettingsStore, type Currency, type ThemeMode } from '@/stores/settings'
import { useAdsStore } from '@/stores/ads'
import { applyTheme } from '@/utils/theme'
import { exportData, generateExportFilename } from '@/utils/exportData'
import { importData } from '@/utils/importData'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import LanguageSwitcher from '@/components/settings/LanguageSwitcher.vue'
import ReceiptCustomization from '@/components/settings/ReceiptCustomization.vue'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const adsStore = useAdsStore()
const $q = useQuasar()

// Export/Import state
const exportLoading = ref(false)
const importLoading = ref(false)
const fileInput = ref<HTMLInputElement>()

// Restoring a purchase
const restoreLoading = ref(false)

/**
 * Bring back a Pro purchase made earlier — after a reinstall, a new phone, or
 * simply cleared data. Google Play requires this to be reachable from the UI for
 * a non-consumable product, and without it paid users have no way back.
 */
async function handleRestorePurchases() {
  restoreLoading.value = true
  try {
    const { restorePurchases } = await import('@/utils/purchases')
    const restored = await restorePurchases()

    if (restored) {
      settingsStore.isPro = true
      await adsStore.handleProUpgrade()
      $q.notify({
        type: 'positive',
        message: t('settings.restoreSuccess'),
        icon: 'check_circle'
      })
      return
    }

    // Nothing to restore is a normal answer, not a failure
    $q.notify({
      type: 'info',
      message: t('settings.restoreNothing'),
      icon: 'info'
    })
  } catch (error) {
    console.error('Failed to restore purchases:', error)
    $q.notify({
      type: 'negative',
      message: t('settings.restoreError'),
      icon: 'error'
    })
  } finally {
    restoreLoading.value = false
  }
}

// Version comes from the installed package, never from a literal in the markup:
// the hardcoded "1.0.0" had been wrong for sixteen releases. The build-time value
// is the fallback, so a missing native plugin shows a version rather than a dash.
const appVersion = ref(__APP_VERSION__ || '—')

onMounted(async () => {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    appVersion.value = `${info.version} (${info.build})`
  } catch (error) {
    console.warn('Could not read app version from the native layer:', error)
  }
})

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

    // Show interstitial ad for Free users
    await adsStore.showInterstitial('export_attempt')

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

    // Show interstitial ad for Free users
    await adsStore.showInterstitial('import_attempt')

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

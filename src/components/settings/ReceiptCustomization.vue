<template>
  <div class="receipt-customization">
    <!-- Pro Feature Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h6">{{ $t('settings.receiptCustomization.title') }}</div>
        <div class="text-caption text-grey-7">{{ $t('settings.receiptCustomization.description') }}</div>
      </div>
      <div class="col-auto">
        <QBadge v-if="!settingsStore.isPro" color="orange" label="PRO" class="q-px-sm q-py-xs" />
        <QBadge v-else color="green" label="✓ PRO" class="q-px-sm q-py-xs" />
      </div>
    </div>

    <!-- Upgrade to Pro Banner (if not Pro) -->
    <div v-if="!settingsStore.isPro" class="pro-banner q-pa-md q-mb-md rounded-borders">
      <div class="text-body1 q-mb-sm">
        <QIcon name="workspace_premium" size="24px" color="orange" class="q-mr-sm" />
        {{ $t('settings.receiptCustomization.upgradeToPro') }}
      </div>
      <div class="text-caption q-mb-md">
        {{ $t('settings.receiptCustomization.proFeatures') }}
      </div>
      <QBtn
        color="primary"
        :label="$t('settings.receiptCustomization.upgradeButton')"
        icon="arrow_forward"
        @click="handleUpgrade"
        unelevated
      />
    </div>

    <!-- Customization Options (Pro only) -->
    <div v-if="settingsStore.isPro" class="customization-options">
      <!-- Logo Upload Section -->
      <QCard flat bordered class="q-mb-md">
        <QCardSection>
          <div class="text-subtitle1 q-mb-md">
            <QIcon name="image" class="q-mr-sm" />
            {{ $t('settings.receiptCustomization.logo') }}
          </div>

          <!-- Logo Preview -->
          <div v-if="receiptStore.settings.logoPath" class="logo-preview q-mb-md">
            <img
              :src="logoPreviewUrl"
              alt="Logo preview"
              class="preview-image"
            />
            <QBtn
              flat
              dense
              round
              color="negative"
              icon="delete"
              class="remove-btn"
              @click="handleRemoveLogo"
            />
          </div>

          <!-- Logo Upload Button -->
          <QBtn
            v-if="!receiptStore.settings.logoPath"
            color="primary"
            icon="upload"
            :label="$t('settings.receiptCustomization.uploadLogo')"
            @click="triggerFileInput"
            unelevated
            class="q-mb-md"
          />

          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style="display: none"
            @change="handleFileUpload"
          />

          <!-- Logo Position -->
          <div v-if="receiptStore.settings.logoPath" class="q-mt-md">
            <div class="text-caption q-mb-sm">{{ $t('settings.receiptCustomization.logoPosition') }}</div>
            <QBtnToggle
              v-model="logoPosition"
              spread
              no-caps
              toggle-color="primary"
              :options="logoPositionOptions"
              @update:model-value="handleLogoPositionChange"
            />
          </div>

          <!-- Logo Opacity -->
          <div v-if="receiptStore.settings.logoPath" class="q-mt-md">
            <div class="text-caption q-mb-sm">
              {{ $t('settings.receiptCustomization.logoOpacity') }}: {{ receiptStore.settings.logoOpacity }}%
            </div>
            <QSlider
              v-model="logoOpacity"
              :min="0"
              :max="100"
              :step="5"
              label
              @change="handleLogoOpacityChange"
              color="primary"
            />
          </div>
        </QCardSection>
      </QCard>

      <!-- Colors Section -->
      <QCard flat bordered class="q-mb-md">
        <QCardSection>
          <div class="text-subtitle1 q-mb-md">
            <QIcon name="palette" class="q-mr-sm" />
            {{ $t('settings.receiptCustomization.colors') }}
          </div>

          <!-- Background Color -->
          <div class="q-mb-md">
            <div class="text-caption q-mb-sm">{{ $t('settings.receiptCustomization.backgroundColor') }}</div>
            <div class="row items-center q-gutter-sm">
              <QInput
                v-model="backgroundColor"
                :rules="[validateHexColor]"
                outlined
                dense
                class="col"
                @blur="handleBackgroundColorChange"
              >
                <template #prepend>
                  <div
                    class="color-preview"
                    :style="{ backgroundColor: backgroundColor }"
                  />
                </template>
              </QInput>
              <input
                type="color"
                v-model="backgroundColor"
                @change="handleBackgroundColorChange"
                class="color-picker"
              />
            </div>
          </div>

          <!-- Background Opacity -->
          <div class="q-mb-md">
            <div class="text-caption q-mb-sm">
              {{ $t('settings.receiptCustomization.backgroundOpacity') }}: {{ receiptStore.settings.backgroundOpacity }}%
            </div>
            <QSlider
              v-model="backgroundOpacity"
              :min="0"
              :max="100"
              :step="5"
              label
              @change="handleBackgroundOpacityChange"
              color="primary"
            />
          </div>

          <!-- Text Color -->
          <div>
            <div class="text-caption q-mb-sm">{{ $t('settings.receiptCustomization.textColor') }}</div>
            <div class="row items-center q-gutter-sm">
              <QInput
                v-model="textColor"
                :rules="[validateHexColor]"
                outlined
                dense
                class="col"
                @blur="handleTextColorChange"
              >
                <template #prepend>
                  <div
                    class="color-preview"
                    :style="{ backgroundColor: textColor }"
                  />
                </template>
              </QInput>
              <input
                type="color"
                v-model="textColor"
                @change="handleTextColorChange"
                class="color-picker"
              />
            </div>
          </div>
        </QCardSection>
      </QCard>

      <!-- Business Information Section -->
      <QCard flat bordered class="q-mb-md">
        <QCardSection>
          <div class="text-subtitle1 q-mb-md">
            <QIcon name="business" class="q-mr-sm" />
            {{ $t('settings.receiptCustomization.businessInfo') }}
          </div>

          <!-- Business Name -->
          <QInput
            v-model="businessName"
            :label="$t('settings.receiptCustomization.businessName')"
            outlined
            class="q-mb-md"
            @blur="handleBusinessInfoChange"
          >
            <template #prepend>
              <QIcon name="store" />
            </template>
          </QInput>

          <!-- Contact Phone -->
          <QInput
            v-model="contactPhone"
            :label="$t('settings.receiptCustomization.contactPhone')"
            outlined
            class="q-mb-md"
            @blur="handleBusinessInfoChange"
          >
            <template #prepend>
              <QIcon name="phone" />
            </template>
          </QInput>

          <!-- Instagram -->
          <QInput
            v-model="instagram"
            :label="$t('settings.receiptCustomization.instagram')"
            outlined
            class="q-mb-md"
            prefix="@"
            @blur="handleBusinessInfoChange"
          >
            <template #prepend>
              <QIcon name="camera_alt" />
            </template>
          </QInput>

          <!-- Website -->
          <QInput
            v-model="website"
            :label="$t('settings.receiptCustomization.website')"
            outlined
            type="url"
            @blur="handleBusinessInfoChange"
          >
            <template #prepend>
              <QIcon name="language" />
            </template>
          </QInput>
        </QCardSection>
      </QCard>

      <!-- Reset Button -->
      <QBtn
        flat
        color="negative"
        :label="$t('settings.receiptCustomization.resetToDefaults')"
        icon="restore"
        @click="handleReset"
        class="full-width"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useSettingsStore } from '@/stores/settings'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'
import type { LogoPosition } from '@/types/receiptSettings'

const $q = useQuasar()
const { t } = useI18n()
const settingsStore = useSettingsStore()
const receiptStore = useReceiptSettingsStore()

// Local state for form inputs
const fileInput = ref<HTMLInputElement | null>(null)
const logoPreviewUrl = ref<string>('')
const logoPosition = ref<LogoPosition>(receiptStore.settings.logoPosition)
const logoOpacity = ref<number>(receiptStore.settings.logoOpacity)
const backgroundColor = ref<string>(receiptStore.settings.backgroundColor)
const backgroundOpacity = ref<number>(receiptStore.settings.backgroundOpacity)
const textColor = ref<string>(receiptStore.settings.textColor)
const businessName = ref<string>(receiptStore.settings.businessName || '')
const contactPhone = ref<string>(receiptStore.settings.contactPhone || '')
const instagram = ref<string>(receiptStore.settings.instagram || '')
const website = ref<string>(receiptStore.settings.website || '')

// Logo position options
const logoPositionOptions = computed(() => [
  { label: t('settings.receiptCustomization.logoPositionCenter'), value: 'center' },
  { label: t('settings.receiptCustomization.logoPositionWatermark'), value: 'watermark' }
])

// Validation
function validateHexColor(value: string): boolean | string {
  const hexRegex = /^#[0-9A-F]{6}$/i
  return hexRegex.test(value) || t('settings.receiptCustomization.invalidColorFormat')
}

// Load logo preview
async function loadLogoPreview() {
  if (!receiptStore.settings.logoPath) {
    logoPreviewUrl.value = ''
    return
  }

  try {
    const fileData = await Filesystem.readFile({
      path: receiptStore.settings.logoPath,
      directory: Directory.Data
    })
    logoPreviewUrl.value = fileData.data as string
  } catch (error) {
    console.error('Failed to load logo preview:', error)
    logoPreviewUrl.value = ''
  }
}

// Handlers
function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.invalidFileFormat'),
      icon: 'error'
    })
    return
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.fileTooLarge'),
      icon: 'error'
    })
    return
  }

  // Read file as base64
  const reader = new FileReader()
  reader.onload = async (e) => {
    const base64Data = e.target?.result as string

    // Generate filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `receipt-logo-${timestamp}.${extension}`

    // Upload logo
    const result = await receiptStore.uploadLogo(filename, base64Data)

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: t('settings.receiptCustomization.logoUploaded'),
        icon: 'check_circle'
      })
      await loadLogoPreview()
    } else {
      let errorMessage = t('settings.receiptCustomization.uploadFailed')
      if (result.error === 'pro_feature_required') {
        errorMessage = t('settings.receiptCustomization.proFeatureRequired')
      } else if (result.error === 'file_too_large') {
        errorMessage = t('settings.receiptCustomization.fileTooLarge')
      } else if (result.error === 'invalid_format') {
        errorMessage = t('settings.receiptCustomization.invalidFileFormat')
      }

      $q.notify({
        type: 'negative',
        message: errorMessage,
        icon: 'error'
      })
    }
  }

  reader.readAsDataURL(file)

  // Clear input value to allow re-uploading same file
  target.value = ''
}

async function handleRemoveLogo() {
  $q.dialog({
    title: t('settings.receiptCustomization.removeLogo'),
    message: t('settings.receiptCustomization.removeLogoConfirm'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await receiptStore.removeLogo()
    logoPreviewUrl.value = ''
    $q.notify({
      type: 'positive',
      message: t('settings.receiptCustomization.logoRemoved'),
      icon: 'check_circle'
    })
  })
}

async function handleLogoPositionChange(position: LogoPosition) {
  const result = await receiptStore.updateLogoPosition(position)
  if (!result.success) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.updateFailed'),
      icon: 'error'
    })
  }
}

async function handleLogoOpacityChange(opacity: number) {
  const result = await receiptStore.updateLogoOpacity(opacity)
  if (!result.success) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.updateFailed'),
      icon: 'error'
    })
  }
}

async function handleBackgroundColorChange() {
  if (!validateHexColor(backgroundColor.value)) return

  const result = await receiptStore.updateBackgroundColor(backgroundColor.value)
  if (!result.success) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.updateFailed'),
      icon: 'error'
    })
    // Revert to previous value
    backgroundColor.value = receiptStore.settings.backgroundColor
  }
}

async function handleBackgroundOpacityChange(opacity: number) {
  const result = await receiptStore.updateBackgroundOpacity(opacity)
  if (!result.success) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.updateFailed'),
      icon: 'error'
    })
  }
}

async function handleTextColorChange() {
  if (!validateHexColor(textColor.value)) return

  const result = await receiptStore.updateTextColor(textColor.value)
  if (!result.success) {
    $q.notify({
      type: 'negative',
      message: t('settings.receiptCustomization.updateFailed'),
      icon: 'error'
    })
    // Revert to previous value
    textColor.value = receiptStore.settings.textColor
  }
}

async function handleBusinessInfoChange() {
  const result = await receiptStore.updateBusinessInfo({
    name: businessName.value || undefined,
    phone: contactPhone.value || undefined,
    instagram: instagram.value || undefined,
    website: website.value || undefined
  })

  if (!result.success) {
    if (result.error === 'pro_feature_required') {
      $q.notify({
        type: 'negative',
        message: t('settings.receiptCustomization.proFeatureRequired'),
        icon: 'error'
      })
    } else {
      $q.notify({
        type: 'negative',
        message: t('settings.receiptCustomization.updateFailed'),
        icon: 'error'
      })
    }
  }
}

async function handleReset() {
  $q.dialog({
    title: t('settings.receiptCustomization.resetToDefaults'),
    message: t('settings.receiptCustomization.resetConfirm'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await receiptStore.resetToDefaults()

    // Update local state
    logoPosition.value = receiptStore.settings.logoPosition
    logoOpacity.value = receiptStore.settings.logoOpacity
    backgroundColor.value = receiptStore.settings.backgroundColor
    backgroundOpacity.value = receiptStore.settings.backgroundOpacity
    textColor.value = receiptStore.settings.textColor
    businessName.value = receiptStore.settings.businessName || ''
    contactPhone.value = receiptStore.settings.contactPhone || ''
    instagram.value = receiptStore.settings.instagram || ''
    website.value = receiptStore.settings.website || ''
    logoPreviewUrl.value = ''

    $q.notify({
      type: 'positive',
      message: t('settings.receiptCustomization.resetSuccess'),
      icon: 'check_circle'
    })
  })
}

async function handleUpgrade() {
  try {
    // Import purchase utilities
    const { purchasePro } = await import('@/utils/purchases')

    // Show loading dialog
    const loadingDialog = $q.dialog({
      title: t('settings.receiptCustomization.processing'),
      message: t('settings.receiptCustomization.pleaseWait'),
      progress: true,
      persistent: true,
      ok: false
    })

    try {
      // Attempt purchase
      const outcome = await purchasePro()

      loadingDialog.hide()

      if (outcome === 'purchased') {
        // Update store
        settingsStore.isPro = true

        // Handle pro upgrade in ads store
        const { useAdsStore } = await import('@/stores/ads')
        const adsStore = useAdsStore()
        await adsStore.handleProUpgrade()

        // Show success message
        $q.notify({
          type: 'positive',
          message: t('settings.receiptCustomization.upgradeSuccess'),
          icon: 'check_circle',
          timeout: 3000
        })

        // Reload settings to enable Pro features
        await receiptStore.loadSettings()
      } else if (outcome === 'cancelled') {
        // Dismissed the store dialog — not a failure, so do not report one
        $q.notify({
          type: 'info',
          message: t('settings.receiptCustomization.upgradeCancelled'),
          icon: 'info'
        })
      } else if (outcome === 'pending') {
        // Deferred payment: the transaction is real but not settled, Pro follows later
        $q.notify({
          type: 'info',
          message: t('settings.receiptCustomization.upgradePending'),
          icon: 'schedule',
          timeout: 6000
        })
      } else if (outcome === 'unavailable') {
        $q.notify({
          type: 'negative',
          message: t('settings.receiptCustomization.webNotSupported'),
          icon: 'error'
        })
      } else {
        // 'unconfirmed' — store claims ownership while RevenueCat grants no entitlement
        $q.notify({
          type: 'negative',
          message: t('settings.receiptCustomization.upgradeError'),
          icon: 'error',
          timeout: 5000
        })
      }
    } catch (error: any) {
      loadingDialog.hide()

      console.error('Purchase error:', error)

      let errorMessage = t('settings.receiptCustomization.upgradeError')

      // Handle specific error cases
      if (error.message?.includes('must be configured') || error.message?.includes('not configured')) {
        errorMessage = t('settings.receiptCustomization.notConfigured')
      } else if (error.message?.includes('No packages available')) {
        errorMessage = t('settings.receiptCustomization.noPackagesAvailable')
      } else if (error.message?.includes('not available on web')) {
        errorMessage = t('settings.receiptCustomization.webNotSupported')
      }

      $q.notify({
        type: 'negative',
        message: errorMessage,
        icon: 'error',
        timeout: 5000
      })
    }
  } catch (error) {
    console.error('Failed to load purchase module:', error)
    $q.notify({
      type: 'negative',
      message: t('common.error'),
      icon: 'error'
    })
  }
}

// Watch for store changes and sync local state
watch(() => receiptStore.settings.logoPosition, (newValue) => {
  logoPosition.value = newValue
})

watch(() => receiptStore.settings.logoOpacity, (newValue) => {
  logoOpacity.value = newValue
})

watch(() => receiptStore.settings.backgroundColor, (newValue) => {
  backgroundColor.value = newValue
})

watch(() => receiptStore.settings.backgroundOpacity, (newValue) => {
  backgroundOpacity.value = newValue
})

watch(() => receiptStore.settings.textColor, (newValue) => {
  textColor.value = newValue
})

// Load settings on mount
onMounted(async () => {
  await receiptStore.loadSettings()
  await loadLogoPreview()
})
</script>

<style scoped>
.receipt-customization {
  width: 100%;
}

.pro-banner {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 2px dashed #ff9800;
  color: #333333;
}

.pro-banner .text-body1,
.pro-banner .text-caption {
  color: #333333 !important;
}

.logo-preview {
  position: relative;
  display: inline-block;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #f5f5f5;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.rounded-borders {
  border-radius: 8px;
}
</style>

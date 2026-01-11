// src/stores/receiptSettings.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useSettingsStore } from './settings'
import { useSecurityStore } from './security'
import type {
  ReceiptSettings,
  ReceiptSettingsResult,
  BusinessInfo,
  LogoPosition
} from '@/types/receiptSettings'
import { db } from '@/database/db'

const DEFAULT_SETTINGS: ReceiptSettings = {
  logoPath: null,
  logoOpacity: 100,
  logoPosition: 'center',
  backgroundColor: '#FFFFFF',
  backgroundOpacity: 100,
  textColor: '#000000',
  businessName: null,
  contactPhone: null,
  instagram: null,
  website: null
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes
const ALLOWED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg']

export const useReceiptSettingsStore = defineStore('receiptSettings', () => {
  // State
  const settings = ref<ReceiptSettings>({ ...DEFAULT_SETTINGS })
  const isLoaded = ref(false)

  // Getters
  const canCustomizeReceipt = computed(() => {
    const settingsStore = useSettingsStore()
    const securityStore = useSecurityStore()
    return settingsStore.isPro && !securityStore.isDeviceCompromised
  })

  const shouldShowWatermark = computed(() => {
    const settingsStore = useSettingsStore()
    const securityStore = useSecurityStore()
    return !settingsStore.isPro || securityStore.isDeviceCompromised
  })

  const watermarkText = computed(() => {
    return 'Посчитано в приложении CakeCost'
  })

  // Helper: Check Pro access
  function checkProAccess(): ReceiptSettingsResult {
    if (!canCustomizeReceipt.value) {
      return {
        success: false,
        error: 'pro_feature_required',
        showPaywall: true
      }
    }
    return { success: true }
  }

  // Helper: Validate HEX color
  function isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color)
  }

  // Helper: Validate opacity range
  function isValidOpacity(opacity: number): boolean {
    return opacity >= 0 && opacity <= 100
  }

  // Helper: Get base64 file size
  function getBase64Size(base64: string): number {
    const base64Data = base64.split(',')[1] || base64
    const padding = (base64Data.match(/=/g) || []).length
    return (base64Data.length * 3) / 4 - padding
  }

  // Helper: Get MIME type from base64
  function getMimeType(base64: string): string {
    const match = base64.match(/data:([^;]+);/)
    return match ? match[1] : ''
  }

  // Actions
  async function loadSettings(): Promise<void> {
    try {
      const result = await db.query(
        'SELECT * FROM settings WHERE id = 1'
      )

      if (result.values && result.values.length > 0) {
        const dbSettings = result.values[0]
        settings.value = {
          logoPath: dbSettings.receipt_logo_path || null,
          logoOpacity: dbSettings.receipt_logo_opacity || 100,
          logoPosition: dbSettings.receipt_logo_position || 'center',
          backgroundColor: dbSettings.receipt_bg_color || '#FFFFFF',
          backgroundOpacity: dbSettings.receipt_bg_opacity || 100,
          textColor: dbSettings.receipt_text_color || '#000000',
          businessName: dbSettings.receipt_business_name || null,
          contactPhone: dbSettings.receipt_phone || null,
          instagram: dbSettings.receipt_instagram || null,
          website: dbSettings.receipt_website || null
        }
      } else {
        // Use defaults
        settings.value = { ...DEFAULT_SETTINGS }
      }

      isLoaded.value = true
    } catch (error) {
      console.error('Failed to load receipt settings:', error)
      settings.value = { ...DEFAULT_SETTINGS }
      isLoaded.value = true
    }
  }

  async function saveSettings(): Promise<ReceiptSettingsResult> {
    try {
      await db.execute(
        `UPDATE settings SET
          receipt_logo_path = ?,
          receipt_logo_opacity = ?,
          receipt_logo_position = ?,
          receipt_bg_color = ?,
          receipt_bg_opacity = ?,
          receipt_text_color = ?,
          receipt_business_name = ?,
          receipt_phone = ?,
          receipt_instagram = ?,
          receipt_website = ?
        WHERE id = 1`,
        [
          settings.value.logoPath,
          settings.value.logoOpacity,
          settings.value.logoPosition,
          settings.value.backgroundColor,
          settings.value.backgroundOpacity,
          settings.value.textColor,
          settings.value.businessName,
          settings.value.contactPhone,
          settings.value.instagram,
          settings.value.website
        ]
      )

      return { success: true }
    } catch (error) {
      console.error('Failed to save receipt settings:', error)
      return {
        success: false,
        error: 'save_failed'
      }
    }
  }

  async function uploadLogo(path: string, base64Data: string): Promise<ReceiptSettingsResult> {
    const accessCheck = checkProAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    // Validate file format
    const mimeType = getMimeType(base64Data)
    if (!ALLOWED_FORMATS.includes(mimeType)) {
      return {
        success: false,
        error: 'invalid_format'
      }
    }

    // Validate file size
    const fileSize = getBase64Size(base64Data)
    if (fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'file_too_large'
      }
    }

    try {
      // Save file to filesystem
      await Filesystem.writeFile({
        path,
        data: base64Data,
        directory: Directory.Data
      })

      settings.value.logoPath = path
      await saveSettings()

      return { success: true }
    } catch (error) {
      console.error('Failed to upload logo:', error)
      return {
        success: false,
        error: 'upload_failed'
      }
    }
  }

  async function removeLogo(): Promise<void> {
    if (settings.value.logoPath) {
      try {
        await Filesystem.deleteFile({
          path: settings.value.logoPath,
          directory: Directory.Data
        })
      } catch (error) {
        console.warn('Failed to delete logo file:', error)
      }
    }

    settings.value.logoPath = null
    await saveSettings()
  }

  async function updateBackgroundColor(color: string): Promise<ReceiptSettingsResult> {
    const accessCheck = checkProAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    if (!isValidHexColor(color)) {
      return {
        success: false,
        error: 'invalid_color_format'
      }
    }

    settings.value.backgroundColor = color
    await saveSettings()

    return { success: true }
  }

  async function updateBackgroundOpacity(opacity: number): Promise<ReceiptSettingsResult> {
    if (!isValidOpacity(opacity)) {
      return {
        success: false,
        error: 'invalid_opacity'
      }
    }

    settings.value.backgroundOpacity = opacity
    await saveSettings()

    return { success: true }
  }

  async function updateLogoOpacity(opacity: number): Promise<ReceiptSettingsResult> {
    if (!isValidOpacity(opacity)) {
      return {
        success: false,
        error: 'invalid_opacity'
      }
    }

    settings.value.logoOpacity = opacity
    await saveSettings()

    return { success: true }
  }

  async function updateTextColor(color: string): Promise<ReceiptSettingsResult> {
    if (!isValidHexColor(color)) {
      return {
        success: false,
        error: 'invalid_color_format'
      }
    }

    settings.value.textColor = color
    await saveSettings()

    return { success: true }
  }

  async function updateLogoPosition(position: LogoPosition): Promise<ReceiptSettingsResult> {
    const validPositions: LogoPosition[] = ['center', 'watermark']
    if (!validPositions.includes(position)) {
      return {
        success: false,
        error: 'invalid_position'
      }
    }

    settings.value.logoPosition = position
    await saveSettings()

    return { success: true }
  }

  async function updateBusinessInfo(info: BusinessInfo): Promise<ReceiptSettingsResult> {
    const accessCheck = checkProAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    if (info.name !== undefined) {
      settings.value.businessName = info.name
    }
    if (info.phone !== undefined) {
      settings.value.contactPhone = info.phone
    }
    if (info.instagram !== undefined) {
      settings.value.instagram = info.instagram
    }
    if (info.website !== undefined) {
      settings.value.website = info.website
    }

    await saveSettings()

    return { success: true }
  }

  async function resetToDefaults(): Promise<void> {
    // Remove logo file if exists
    if (settings.value.logoPath) {
      await removeLogo()
    }

    settings.value = { ...DEFAULT_SETTINGS }
    await saveSettings()
  }

  return {
    // State
    settings,
    isLoaded,

    // Getters
    canCustomizeReceipt,
    shouldShowWatermark,
    watermarkText,

    // Actions
    loadSettings,
    saveSettings,
    uploadLogo,
    removeLogo,
    updateBackgroundColor,
    updateBackgroundOpacity,
    updateLogoOpacity,
    updateTextColor,
    updateLogoPosition,
    updateBusinessInfo,
    resetToDefaults
  }
})

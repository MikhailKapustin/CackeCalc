// src/__tests__/unit/stores/receiptSettings.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'
import { useSettingsStore } from '@/stores/settings'
import { useSecurityStore } from '@/stores/security'

// Mock Capacitor Filesystem
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn().mockResolvedValue({ uri: 'file://receipts/logo.png' }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue({ data: 'mock-base64-data' })
  },
  Directory: {
    Data: 'DATA'
  }
}))

// Mock database — the store reaches the connection through getDatabase()
vi.mock('@/database/db', () => {
  const connection = {
    query: vi.fn().mockResolvedValue({ values: [] }),
    execute: vi.fn().mockResolvedValue({ changes: { lastId: 1 } })
  }
  return {
    db: connection,
    getDatabase: vi.fn().mockResolvedValue(connection)
  }
})

describe('Receipt Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Access Control', () => {
    it('should block access to receipt settings for Free users', () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      expect(receiptStore.canCustomizeReceipt).toBe(false)
    })

    it('should allow access to receipt settings for Pro users', () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      expect(receiptStore.canCustomizeReceipt).toBe(true)
    })

    it('should block access when device is compromised even for Pro users', () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()
      const securityStore = useSecurityStore()

      settingsStore.isPro = true
      securityStore.isDeviceCompromised = true

      expect(receiptStore.canCustomizeReceipt).toBe(false)
    })
  })

  describe('Logo Upload', () => {
    it('should allow uploading logo for Pro users', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const result = await receiptStore.uploadLogo('receipts/logo.png', 'data:image/png;base64,abc123')

      expect(result.success).toBe(true)
      expect(receiptStore.settings.logoPath).toBe('receipts/logo.png')
    })

    it('should reject logo upload for Free users', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      const result = await receiptStore.uploadLogo('receipts/logo.png', 'data:image/png;base64,abc123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('pro_feature_required')
      expect(result.showPaywall).toBe(true)
    })

    it('should validate logo file size', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      // Mock large file (> 2MB) - base64 string longer than expected
      const largeBase64 = 'data:image/png;base64,' + 'a'.repeat(3000000)
      const result = await receiptStore.uploadLogo('large-logo.png', largeBase64)

      expect(result.success).toBe(false)
      expect(result.error).toBe('file_too_large')
    })

    it('should validate logo file format', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const result = await receiptStore.uploadLogo('logo.bmp', 'data:image/bmp;base64,abc123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_format')
    })

    it('should remove logo', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true
      receiptStore.settings.logoPath = 'receipts/logo.png'

      await receiptStore.removeLogo()

      expect(receiptStore.settings.logoPath).toBeNull()
    })
  })

  describe('Color Customization', () => {
    it('should update background color for Pro users', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const result = await receiptStore.updateBackgroundColor('#FFE5E5')

      expect(result.success).toBe(true)
      expect(receiptStore.settings.backgroundColor).toBe('#FFE5E5')
    })

    it('should reject color update for Free users', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      const result = await receiptStore.updateBackgroundColor('#FFE5E5')

      expect(result.success).toBe(false)
      expect(result.error).toBe('pro_feature_required')
    })

    it('should update background opacity', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateBackgroundOpacity(80)

      expect(receiptStore.settings.backgroundOpacity).toBe(80)
    })

    it('should update logo opacity', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateLogoOpacity(50)

      expect(receiptStore.settings.logoOpacity).toBe(50)
    })

    it('should validate opacity range (0-100)', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const result = await receiptStore.updateLogoOpacity(150)

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_opacity')
    })

    it('should update text color', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateTextColor('#000000')

      expect(receiptStore.settings.textColor).toBe('#000000')
    })

    it('should validate hex color format', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const result = await receiptStore.updateBackgroundColor('invalid-color')

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_color_format')
    })
  })

  describe('Business Contact Information', () => {
    it('should save business name', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateBusinessInfo({ name: 'Sweet Dreams Bakery' })

      expect(receiptStore.settings.businessName).toBe('Sweet Dreams Bakery')
    })

    it('should save contact phone', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateBusinessInfo({ phone: '+1234567890' })

      expect(receiptStore.settings.contactPhone).toBe('+1234567890')
    })

    it('should save Instagram handle', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateBusinessInfo({ instagram: '@sweetdreams' })

      expect(receiptStore.settings.instagram).toBe('@sweetdreams')
    })

    it('should save website URL', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateBusinessInfo({ website: 'https://sweetdreams.com' })

      expect(receiptStore.settings.website).toBe('https://sweetdreams.com')
    })

    it('should reject business info update for Free users', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      const result = await receiptStore.updateBusinessInfo({ name: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('pro_feature_required')
    })
  })

  describe('Logo Position', () => {
    it('should update logo position', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await receiptStore.updateLogoPosition('watermark')

      expect(receiptStore.settings.logoPosition).toBe('watermark')
    })

    it('should validate logo position values', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const result = await receiptStore.updateLogoPosition('invalid' as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_position')
    })
  })

  describe('Watermark', () => {
    it('should include watermark in Free version', () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      expect(receiptStore.shouldShowWatermark).toBe(true)
      expect(receiptStore.watermarkText).toContain('CakeCost')
    })

    it('should NOT include watermark in Pro version', () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      expect(receiptStore.shouldShowWatermark).toBe(false)
    })

    it('should show watermark when device is compromised even for Pro', () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()
      const securityStore = useSecurityStore()

      settingsStore.isPro = true
      securityStore.isDeviceCompromised = true

      expect(receiptStore.shouldShowWatermark).toBe(true)
    })
  })

  describe('Load Settings', () => {
    it('should load settings from database on initialization', async () => {
      const receiptStore = useReceiptSettingsStore()

      await receiptStore.loadSettings()

      expect(receiptStore.isLoaded).toBe(true)
    })

    it('should use default values if no settings found', async () => {
      const receiptStore = useReceiptSettingsStore()

      await receiptStore.loadSettings()

      expect(receiptStore.settings.backgroundColor).toBe('#FFFFFF')
      expect(receiptStore.settings.textColor).toBe('#000000')
      expect(receiptStore.settings.logoOpacity).toBe(100)
      expect(receiptStore.settings.backgroundOpacity).toBe(100)
    })
  })

  describe('Save Settings', () => {
    it('should save all settings to database', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      receiptStore.settings.backgroundColor = '#FFE5E5'
      receiptStore.settings.textColor = '#2C1810'
      receiptStore.settings.businessName = 'Test Bakery'

      const result = await receiptStore.saveSettings()

      expect(result.success).toBe(true)
    })
  })

  describe('Reset Settings', () => {
    it('should reset all settings to defaults', async () => {
      const receiptStore = useReceiptSettingsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      // Change some settings
      receiptStore.settings.backgroundColor = '#FFE5E5'
      receiptStore.settings.textColor = '#2C1810'
      receiptStore.settings.businessName = 'Test'

      // Reset
      await receiptStore.resetToDefaults()

      expect(receiptStore.settings.backgroundColor).toBe('#FFFFFF')
      expect(receiptStore.settings.textColor).toBe('#000000')
      expect(receiptStore.settings.businessName).toBeNull()
    })
  })
})

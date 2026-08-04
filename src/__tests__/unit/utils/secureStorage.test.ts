// src/__tests__/unit/utils/secureStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveProStatus, getProStatus, initializeProStatus } from '@/utils/secureStorage'
import { SecureStorage, __resetSecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'

const PRO_STATUS_KEY = 'cakecalc_pro_status'

// RevenueCat must NOT be touched during startup — see initializeProStatus below
const mockPurchases = {
  restorePurchases: vi.fn(),
  getCustomerInfo: vi.fn()
}

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: mockPurchases
}))

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn()
  }
}))

describe('Secure Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetSecureStorage()
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
  })

  describe('saveProStatus', () => {
    it('should save Pro status under the Pro status key', async () => {
      const status = {
        isPro: true,
        purchaseDate: '2025-01-15T10:00:00Z',
        productId: 'cakecalc_pro',
        lastVerified: '2025-01-15T10:00:00Z'
      }

      await saveProStatus(status)

      // Plugin API is positional: set(key, data)
      expect(SecureStorage.set).toHaveBeenCalledWith(PRO_STATUS_KEY, status)
    })

    it('should save minimal Pro status (only isPro)', async () => {
      await saveProStatus({ isPro: false })

      expect(SecureStorage.set).toHaveBeenCalledWith(PRO_STATUS_KEY, { isPro: false })
    })

    it('should handle errors when saving', async () => {
      vi.mocked(SecureStorage.set).mockRejectedValueOnce(new Error('Storage error'))

      await expect(saveProStatus({ isPro: true })).rejects.toThrow('Storage error')
    })
  })

  describe('getProStatus', () => {
    it('should read back a Pro status that was saved', async () => {
      // Round-trip through the plugin: this is what a real purchase does
      await saveProStatus({
        isPro: true,
        purchaseDate: '2025-01-15T10:00:00Z',
        productId: 'cakecalc_pro'
      })

      const isPro = await getProStatus()

      expect(SecureStorage.get).toHaveBeenCalledWith(PRO_STATUS_KEY)
      expect(isPro).toBe(true)
    })

    it('should return false when Pro status was never saved', async () => {
      const isPro = await getProStatus()

      expect(isPro).toBe(false)
    })

    it('should return false when saved status is not Pro', async () => {
      await saveProStatus({ isPro: false })

      expect(await getProStatus()).toBe(false)
    })

    it('should return false when the plugin fails', async () => {
      vi.mocked(SecureStorage.get).mockRejectedValueOnce(new Error('Keychain unavailable'))

      expect(await getProStatus()).toBe(false)
    })
  })

  describe('initializeProStatus', () => {
    it('should restore a previously purchased Pro status on startup', async () => {
      await saveProStatus({
        isPro: true,
        purchaseDate: '2025-01-15T10:00:00Z',
        productId: 'cakecalc_pro',
        lastVerified: '2025-01-15T10:00:00Z'
      })

      const result = await initializeProStatus()

      expect(result.isPro).toBe(true)
      expect(result.productId).toBe('cakecalc_pro')
    })

    it('should return free status on first run', async () => {
      const result = await initializeProStatus()

      expect(result.isPro).toBe(false)
    })

    it('should not call RevenueCat during startup', async () => {
      // Calling RevenueCat right after configure() races the Android BillingClient
      // ("Client is already in the process of connecting" → BILLING_UNAVAILABLE).
      // Verification happens later, in the background — see bootstrap() in main.ts.
      await initializeProStatus()

      expect(mockPurchases.restorePurchases).not.toHaveBeenCalled()
      expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled()
    })

    it('should fall back to free status when the plugin fails', async () => {
      vi.mocked(SecureStorage.get).mockRejectedValueOnce(new Error('Keychain unavailable'))

      const result = await initializeProStatus()

      expect(result.isPro).toBe(false)
    })

    it('should return default status on web platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      const result = await initializeProStatus()

      expect(result.isPro).toBe(false)
      expect(SecureStorage.get).not.toHaveBeenCalled()
    })
  })
})

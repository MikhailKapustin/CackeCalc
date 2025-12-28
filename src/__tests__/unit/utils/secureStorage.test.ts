// src/__tests__/unit/utils/secureStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveProStatus, getProStatus, initializeProStatus } from '@/utils/secureStorage'
import { SecureStoragePlugin } from '@aparajita/capacitor-secure-storage'
import { InAppPurchase } from 'capacitor-plugin-purchase'

// Моки автоматически применяются через vitest.config.ts aliases

describe('Secure Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations to default
    vi.mocked(SecureStoragePlugin.set).mockResolvedValue(undefined)
    vi.mocked(SecureStoragePlugin.get).mockResolvedValue({ value: '{}' })
    vi.mocked(InAppPurchase.restorePurchases).mockResolvedValue([])
  })

  describe('saveProStatus', () => {
    it('should save Pro status to secure storage', async () => {
      const status = {
        isPro: true,
        purchaseDate: '2025-01-15T10:00:00Z',
        productId: 'cakecost_pro',
        lastVerified: '2025-01-15T10:00:00Z'
      }

      await saveProStatus(status)

      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: 'cakecost_pro_status',
        value: JSON.stringify(status)
      })
    })

    it('should save minimal Pro status (only isPro)', async () => {
      const status = {
        isPro: false
      }

      await saveProStatus(status)

      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: 'cakecost_pro_status',
        value: JSON.stringify(status)
      })
    })

    it('should handle errors when saving', async () => {
      vi.mocked(SecureStoragePlugin.set).mockRejectedValue(new Error('Storage error'))

      const status = { isPro: true }

      await expect(saveProStatus(status)).rejects.toThrow('Storage error')
    })
  })

  describe('getProStatus', () => {
    it('should retrieve Pro status from secure storage', async () => {
      const mockStatus = {
        isPro: true,
        purchaseDate: '2025-01-15T10:00:00Z',
        productId: 'cakecost_pro'
      }

      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: JSON.stringify(mockStatus)
      })

      const isPro = await getProStatus()

      expect(SecureStoragePlugin.get).toHaveBeenCalledWith({
        key: 'cakecost_pro_status'
      })
      expect(isPro).toBe(true)
    })

    it('should return false when Pro status not found', async () => {
      vi.mocked(SecureStoragePlugin.get).mockRejectedValue(new Error('Key not found'))

      const isPro = await getProStatus()

      expect(isPro).toBe(false)
    })

    it('should return false when status is false', async () => {
      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: JSON.stringify({ isPro: false })
      })

      const isPro = await getProStatus()

      expect(isPro).toBe(false)
    })

    it('should handle corrupted data gracefully', async () => {
      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: 'invalid json'
      })

      const isPro = await getProStatus()

      expect(isPro).toBe(false)
    })
  })

  describe('initializeProStatus', () => {
    it('should verify Pro status with IAP on initialization', async () => {
      // Mock existing status
      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: JSON.stringify({ isPro: false })
      })

      // Mock successful purchase restoration
      vi.mocked(InAppPurchase.restorePurchases).mockResolvedValue([
        { productId: 'cakecost_pro' }
      ])

      const result = await initializeProStatus()

      expect(InAppPurchase.restorePurchases).toHaveBeenCalled()
      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: 'cakecost_pro_status',
        value: expect.stringContaining('"isPro":true')
      })
      expect(result.isPro).toBe(true)
    })

    it('should reset Pro status when purchase not found', async () => {
      // Mock existing Pro status
      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: JSON.stringify({ isPro: true })
      })

      // Mock no purchases
      vi.mocked(InAppPurchase.restorePurchases).mockResolvedValue([])

      const result = await initializeProStatus()

      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: 'cakecost_pro_status',
        value: expect.stringContaining('"isPro":false')
      })
      expect(result.isPro).toBe(false)
    })

    it('should initialize with default values on first run', async () => {
      // Mock key not found (first run)
      vi.mocked(SecureStoragePlugin.get).mockRejectedValue(new Error('Key not found'))
      vi.mocked(InAppPurchase.restorePurchases).mockResolvedValue([])

      const result = await initializeProStatus()

      expect(result.isPro).toBe(false)
      expect(SecureStoragePlugin.set).toHaveBeenCalled()
    })

    it('should preserve existing Pro status if purchase still valid', async () => {
      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: JSON.stringify({
          isPro: true,
          purchaseDate: '2025-01-15T10:00:00Z',
          productId: 'cakecost_pro'
        })
      })

      vi.mocked(InAppPurchase.restorePurchases).mockResolvedValue([
        { productId: 'cakecost_pro' }
      ])

      const result = await initializeProStatus()

      expect(result.isPro).toBe(true)
      // Should update lastVerified
      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
        key: 'cakecost_pro_status',
        value: expect.stringContaining('lastVerified')
      })
    })

    it('should handle IAP errors gracefully', async () => {
      vi.mocked(SecureStoragePlugin.get).mockResolvedValue({
        value: JSON.stringify({ isPro: false })
      })

      vi.mocked(InAppPurchase.restorePurchases).mockRejectedValue(new Error('IAP error'))

      const result = await initializeProStatus()

      // Should return current status without crashing
      expect(result.isPro).toBe(false)
    })
  })
})

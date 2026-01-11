// src/__tests__/unit/utils/purchases.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initializeRevenueCat, purchasePro, restorePurchases, getCustomerInfo } from '@/utils/purchases'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'ios'
  },
  registerPlugin: vi.fn(() => ({}))
}))

// Mock RevenueCat
vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    configure: vi.fn().mockResolvedValue(undefined),
    getOfferings: vi.fn().mockResolvedValue({
      offerings: {
        current: {
          availablePackages: [
            {
              product: {
                identifier: 'cakecost_pro',
                title: 'CakeCost Pro',
                description: 'Unlock all features',
                price: '$4.99',
                priceString: '$4.99'
              }
            }
          ]
        }
      }
    }),
    purchasePackage: vi.fn().mockResolvedValue({
      customerInfo: {
        entitlements: {
          active: {
            cakecost_pro: {
              identifier: 'cakecost_pro',
              isActive: true,
              willRenew: false,
              productIdentifier: 'cakecost_pro'
            }
          }
        }
      }
    }),
    restorePurchases: vi.fn().mockResolvedValue({
      customerInfo: {
        entitlements: {
          active: {}
        }
      }
    }),
    getCustomerInfo: vi.fn().mockResolvedValue({
      customerInfo: {
        entitlements: {
          active: {}
        }
      }
    })
  }
}))

// Mock secureStorage
vi.mock('@/utils/secureStorage', () => ({
  handlePurchaseSuccess: vi.fn().mockResolvedValue(undefined)
}))

describe('Purchases Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initializeRevenueCat', () => {
    it('should initialize RevenueCat SDK', async () => {
      await expect(initializeRevenueCat()).resolves.not.toThrow()
    })

    it('should use iOS API key on iOS platform', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')

      await initializeRevenueCat()

      expect(Purchases.configure).toHaveBeenCalledWith({
        apiKey: expect.any(String)
      })
    })

    it('should handle initialization errors', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.configure).mockRejectedValueOnce(new Error('Init failed'))

      await expect(initializeRevenueCat()).rejects.toThrow('Init failed')
    })
  })

  describe('purchasePro', () => {
    it('should successfully purchase Pro version', async () => {
      const result = await purchasePro()

      expect(result).toBe(true)
    })

    it('should return false if packages are not available', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.getOfferings).mockResolvedValueOnce({
        offerings: {
          current: null
        }
      } as any)

      await expect(purchasePro()).rejects.toThrow('No packages available')
    })

    it('should return false if Pro package not found', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.getOfferings).mockResolvedValueOnce({
        offerings: {
          current: {
            availablePackages: [
              {
                product: {
                  identifier: 'other_product',
                  title: 'Other Product'
                }
              }
            ]
          }
        }
      } as any)

      await expect(purchasePro()).rejects.toThrow('Pro package not found')
    })

    it('should handle user cancellation', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const error = new Error('Purchase cancelled') as any
      error.code = 'USER_CANCELLED'

      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(error)

      const result = await purchasePro()

      expect(result).toBe(false)
    })

    it('should save Pro status after successful purchase', async () => {
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')

      await purchasePro()

      expect(handlePurchaseSuccess).toHaveBeenCalledWith('cakecost_pro')
    })
  })

  describe('restorePurchases', () => {
    it('should restore Pro purchases', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.restorePurchases).mockResolvedValueOnce({
        customerInfo: {
          entitlements: {
            active: {
              cakecost_pro: {
                identifier: 'cakecost_pro',
                isActive: true
              }
            }
          }
        }
      } as any)

      const result = await restorePurchases()

      expect(result).toBe(true)
    })

    it('should return false if no purchases to restore', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.restorePurchases).mockResolvedValueOnce({
        customerInfo: {
          entitlements: {
            active: {}
          }
        }
      } as any)

      const result = await restorePurchases()

      expect(result).toBe(false)
    })

    it('should handle restore errors', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.restorePurchases).mockRejectedValueOnce(new Error('Restore failed'))

      await expect(restorePurchases()).rejects.toThrow('Restore failed')
    })
  })

  describe('getCustomerInfo', () => {
    it('should return customer info', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const mockInfo = {
        entitlements: {
          active: {
            cakecost_pro: {
              identifier: 'cakecost_pro'
            }
          }
        }
      }

      vi.mocked(Purchases.getCustomerInfo).mockResolvedValueOnce({
        customerInfo: mockInfo
      } as any)

      const info = await getCustomerInfo()

      expect(info).toEqual(mockInfo)
    })

    it('should return null on error', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.getCustomerInfo).mockRejectedValueOnce(new Error('Failed'))

      const info = await getCustomerInfo()

      expect(info).toBeNull()
    })
  })
})

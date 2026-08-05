// src/__tests__/unit/utils/purchases.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor'
import { initializeRevenueCat, purchasePro, restorePurchases, getCustomerInfo } from '@/utils/purchases'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'ios'
  },
  registerPlugin: vi.fn(() => ({}))
}))

// Mock RevenueCat.
//
// getOfferings() resolves PurchasesOfferings = { all, current } — there is no
// wrapping `offerings` key. An earlier mock invented one, which is exactly why
// destructuring `{ offerings }` passed here and threw on a real device.
//
// Only Purchases is stubbed; everything else (notably PURCHASES_ERROR_CODE) comes
// from the real module. Error codes are the SDK's own strings — "1", "6", "20" —
// and hand-copying them into the mock is how a purchase-cancelled branch ends up
// comparing against a value the SDK never sends.
//
// The fixture lives inside the factory on purpose: vi.mock is hoisted above every
// top-level statement, so a fixture declared outside is still uninitialized here.
vi.mock('@revenuecat/purchases-capacitor', async importOriginal => {
  const actual = await importOriginal<typeof import('@revenuecat/purchases-capacitor')>()
  const proOffering = {
    identifier: 'default',
    availablePackages: [
      {
        product: {
          identifier: 'cakecalc_pro',
          title: 'Cake calc Pro',
          description: 'Unlock all features',
          price: '$4.99',
          priceString: '$4.99'
        }
      }
    ]
  }
  return {
    ...actual,
    Purchases: {
      configure: vi.fn().mockResolvedValue(undefined),
      setLogLevel: vi.fn().mockResolvedValue(undefined),
      getOfferings: vi.fn().mockResolvedValue({
        all: { default: proOffering },
        current: proOffering
      }),
      purchasePackage: vi.fn().mockResolvedValue({
        customerInfo: {
          entitlements: {
            active: {
              cakecalc_pro: {
                identifier: 'cakecalc_pro',
                isActive: true,
                willRenew: false,
                productIdentifier: 'cakecalc_pro'
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
  }
})

// Mock secureStorage
vi.mock('@/utils/secureStorage', () => ({
  handlePurchaseSuccess: vi.fn().mockResolvedValue(undefined)
}))

/** Build a rejection exactly as the SDK reports it: an Error carrying a string code. */
function sdkError(code: PURCHASES_ERROR_CODE, message: string) {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}

describe('Purchases Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Supply keys explicitly: the local .env keeps a placeholder for iOS, and the
    // SDK is skipped entirely on a placeholder key — tests must not depend on that file.
    vi.stubEnv('VITE_REVENUECAT_API_KEY_IOS', 'appl_test_key')
    vi.stubEnv('VITE_REVENUECAT_API_KEY_ANDROID', 'goog_test_key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('initializeRevenueCat', () => {
    it('should initialize RevenueCat SDK', async () => {
      await expect(initializeRevenueCat()).resolves.not.toThrow()
    })

    it('should use iOS API key on iOS platform', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')

      await initializeRevenueCat()

      expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: 'appl_test_key' })
    })

    it('should skip initialization when the API key is a placeholder', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.stubEnv('VITE_REVENUECAT_API_KEY_IOS', 'YOUR_IOS_API_KEY')

      await initializeRevenueCat()

      expect(Purchases.configure).not.toHaveBeenCalled()
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

      expect(result).toBe('purchased')
    })

    it('should throw if packages are not available', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.getOfferings).mockResolvedValueOnce({
        all: {},
        current: null
      } as any)

      await expect(purchasePro()).rejects.toThrow('No packages available')
    })

    it('should throw if Pro package not found', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const otherOffering = {
        identifier: 'default',
        availablePackages: [
          {
            product: {
              identifier: 'other_product',
              title: 'Other Product'
            }
          }
        ]
      }
      vi.mocked(Purchases.getOfferings).mockResolvedValueOnce({
        all: { default: otherOffering },
        current: otherOffering
      } as any)

      await expect(purchasePro()).rejects.toThrow('Pro package not found')
    })

    it('should report cancellation when the user dismisses the store dialog', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      // The SDK sends PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ("1"); a made-up
      // name like 'USER_CANCELLED' never matches and shows an error to a user who
      // simply closed the dialog.
      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR, 'Purchase cancelled')
      )

      const result = await purchasePro()

      expect(result).toBe('cancelled')
    })

    it('should report a pending payment instead of failing', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')
      // Deferred payment methods (cash, bank transfer, slow test card) resolve later:
      // the charge is real, Pro is not granted yet, and it is not an error.
      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR, 'The payment is pending.')
      )

      const result = await purchasePro()

      expect(result).toBe('pending')
      expect(handlePurchaseSuccess).not.toHaveBeenCalled()
    })

    it('should rethrow unknown purchase errors', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR, 'Store is unreachable')
      )

      await expect(purchasePro()).rejects.toThrow('Store is unreachable')
    })

    it('should save Pro status after successful purchase', async () => {
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')

      await purchasePro()

      expect(handlePurchaseSuccess).toHaveBeenCalledWith('cakecalc_pro')
    })

    it('should NOT grant Pro when the entitlement is never confirmed', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')

      // Purchase resolves, but neither the result nor a follow-up check shows the entitlement
      vi.mocked(Purchases.purchasePackage).mockResolvedValueOnce({
        customerInfo: { entitlements: { active: {} } }
      } as any)
      vi.mocked(Purchases.getCustomerInfo).mockResolvedValueOnce({
        customerInfo: { entitlements: { active: {} } }
      } as any)

      const result = await purchasePro()

      expect(result).toBe('unconfirmed')
      expect(handlePurchaseSuccess).not.toHaveBeenCalled()
    })

    it('should grant Pro when the entitlement only appears on re-check', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')

      // Entitlement can lag right after the transaction
      vi.mocked(Purchases.purchasePackage).mockResolvedValueOnce({
        customerInfo: { entitlements: { active: {} } }
      } as any)
      vi.mocked(Purchases.getCustomerInfo).mockResolvedValueOnce({
        customerInfo: {
          entitlements: { active: { cakecalc_pro: { identifier: 'cakecalc_pro' } } }
        }
      } as any)

      const result = await purchasePro()

      expect(result).toBe('purchased')
      expect(handlePurchaseSuccess).toHaveBeenCalledWith('cakecalc_pro')
    })

    it('should restore Pro when the store reports the product as already purchased', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')

      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR, 'Product already purchased')
      )
      vi.mocked(Purchases.restorePurchases).mockResolvedValueOnce({
        customerInfo: {
          entitlements: { active: { cakecalc_pro: { identifier: 'cakecalc_pro' } } }
        }
      } as any)

      const result = await purchasePro()

      expect(result).toBe('purchased')
      expect(handlePurchaseSuccess).toHaveBeenCalledWith('cakecalc_pro')
    })

    it('should NOT grant Pro when "already purchased" restores no entitlement', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { handlePurchaseSuccess } = await import('@/utils/secureStorage')

      // Store says the product is owned while RevenueCat has no entitlement for it —
      // a stale unconsumed purchase or a configuration mismatch, not a paying user.
      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR, 'Product already purchased')
      )
      vi.mocked(Purchases.restorePurchases).mockResolvedValueOnce({
        customerInfo: { entitlements: { active: {} } }
      } as any)

      const result = await purchasePro()

      expect(result).toBe('unconfirmed')
      expect(handlePurchaseSuccess).not.toHaveBeenCalled()
    })

    it('should report pending when restoring an owned product hits a pending payment', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')

      vi.mocked(Purchases.purchasePackage).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR, 'Product already purchased')
      )
      vi.mocked(Purchases.restorePurchases).mockRejectedValueOnce(
        sdkError(PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR, 'The payment is pending.')
      )

      const result = await purchasePro()

      expect(result).toBe('pending')
    })
  })

  describe('restorePurchases', () => {
    it('should restore Pro purchases', async () => {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      vi.mocked(Purchases.restorePurchases).mockResolvedValueOnce({
        customerInfo: {
          entitlements: {
            active: {
              cakecalc_pro: {
                identifier: 'cakecalc_pro',
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
            cakecalc_pro: {
              identifier: 'cakecalc_pro'
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

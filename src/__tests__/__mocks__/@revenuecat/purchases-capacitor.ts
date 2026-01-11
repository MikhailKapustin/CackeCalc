// src/__tests__/__mocks__/@revenuecat/purchases-capacitor.ts
import { vi } from 'vitest'

export const Purchases = {
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

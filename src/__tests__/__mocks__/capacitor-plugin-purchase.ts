// src/__tests__/__mocks__/capacitor-plugin-purchase.ts
import { vi } from 'vitest'

export const InAppPurchase = {
  restorePurchases: vi.fn(),
  purchase: vi.fn(),
  getProducts: vi.fn()
}

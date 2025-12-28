// src/utils/secureStorage.ts
import { SecureStoragePlugin } from '@aparajita/capacitor-secure-storage'
import { InAppPurchase } from 'capacitor-plugin-purchase'

const PRO_STATUS_KEY = 'cakecost_pro_status'
const PRO_PRODUCT_ID = 'cakecost_pro'

export interface ProStatus {
  isPro: boolean
  purchaseDate?: string
  productId?: string
  lastVerified?: string
}

/**
 * Save Pro status to secure storage (Keychain on iOS, KeyStore on Android)
 */
export async function saveProStatus(status: ProStatus): Promise<void> {
  await SecureStoragePlugin.set({
    key: PRO_STATUS_KEY,
    value: JSON.stringify(status)
  })
}

/**
 * Get current Pro status from secure storage
 * Returns false if not found or on error
 */
export async function getProStatus(): Promise<boolean> {
  try {
    const result = await SecureStoragePlugin.get({
      key: PRO_STATUS_KEY
    })

    const status: ProStatus = JSON.parse(result.value)
    return status.isPro
  } catch (error) {
    // Key not found or parse error - default to free
    return false
  }
}

/**
 * Initialize Pro status by verifying with In-App Purchase
 * This should be called on app startup
 */
export async function initializeProStatus(): Promise<ProStatus> {
  try {
    // 1. Try to get existing status
    let currentStatus: ProStatus
    try {
      const result = await SecureStoragePlugin.get({
        key: PRO_STATUS_KEY
      })
      currentStatus = JSON.parse(result.value)
    } catch {
      // First run - no status yet
      currentStatus = { isPro: false }
    }

    // 2. Verify purchase with App Store / Play Store
    let hasPro = false
    try {
      const purchases = await InAppPurchase.restorePurchases()
      hasPro = purchases.some(p => p.productId === PRO_PRODUCT_ID)
    } catch (error) {
      // IAP error - keep current status
      console.warn('Failed to restore purchases:', error)
      return currentStatus
    }

    // 3. Update status based on IAP verification
    const newStatus: ProStatus = {
      isPro: hasPro,
      purchaseDate: hasPro ? (currentStatus.purchaseDate || new Date().toISOString()) : undefined,
      productId: hasPro ? PRO_PRODUCT_ID : undefined,
      lastVerified: new Date().toISOString()
    }

    // 4. Save updated status
    await saveProStatus(newStatus)

    return newStatus
  } catch (error) {
    console.error('Failed to initialize Pro status:', error)
    // Return safe default
    return { isPro: false }
  }
}

/**
 * Handle successful purchase - save Pro status
 */
export async function handlePurchaseSuccess(productId: string): Promise<void> {
  await saveProStatus({
    isPro: true,
    purchaseDate: new Date().toISOString(),
    productId: productId,
    lastVerified: new Date().toISOString()
  })
}

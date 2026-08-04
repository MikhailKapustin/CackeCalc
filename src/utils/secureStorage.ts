// src/utils/secureStorage.ts
import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'

const PRO_STATUS_KEY = 'cakecalc_pro_status'
const PRO_PRODUCT_ID = 'cakecalc_pro'

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
  // Plugin API is positional and serializes the value itself: set(key, data)
  await SecureStorage.set(PRO_STATUS_KEY, status)
}

/**
 * Get current Pro status from secure storage
 * Returns false if not found or on error
 */
export async function getProStatus(): Promise<boolean> {
  try {
    // get() returns the stored value itself (already deserialized), or null
    const status = (await SecureStorage.get(PRO_STATUS_KEY)) as ProStatus | null
    return status?.isPro === true
  } catch (error) {
    // Storage unavailable or corrupted value - default to free
    return false
  }
}

/**
 * Load Pro status on app startup.
 *
 * Reads Secure Storage only — RevenueCat is deliberately not called here
 * (see step 2 below); verification happens in the background after startup.
 */
export async function initializeProStatus(): Promise<ProStatus> {
  console.log('🔔 initializeProStatus: Starting...')

  // Skip on web
  if (!Capacitor.isNativePlatform()) {
    console.log('🔔 initializeProStatus: Web platform, returning free status')
    return { isPro: false }
  }

  try {
    // 1. Try to get existing status
    let currentStatus: ProStatus
    try {
      console.log('🔔 initializeProStatus: Reading from Secure Storage...')
      const stored = (await SecureStorage.get(PRO_STATUS_KEY)) as ProStatus | null
      if (!stored) {
        throw new Error('No stored Pro status')
      }
      currentStatus = stored
      console.log('🔔 initializeProStatus: Found existing status:', currentStatus)
    } catch (error) {
      // First run - no status yet
      console.log('🔔 initializeProStatus: No existing status, first run')
      currentStatus = { isPro: false }
    }

    // 2. Return status from Secure Storage only (do not call RevenueCat on startup)
    // RevenueCat BillingClient needs time to connect after configure() - calling it
    // immediately causes "Client is already in the process of connecting" and BILLING_UNAVAILABLE
    console.log('✅ initializeProStatus: Complete, returning:', currentStatus)
    return currentStatus
  } catch (error) {
    console.error('❌ initializeProStatus: Failed:', error)
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

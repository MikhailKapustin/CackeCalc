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
  await SecureStorage.set({
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
    const result = await SecureStorage.get({
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
 * Initialize Pro status by verifying with RevenueCat
 * This should be called on app startup
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
      const result = await SecureStorage.get({
        key: PRO_STATUS_KEY
      })
      currentStatus = JSON.parse(result.value)
      console.log('🔔 initializeProStatus: Found existing status:', currentStatus)
    } catch (error) {
      // First run - no status yet
      console.log('🔔 initializeProStatus: No existing status, first run')
      currentStatus = { isPro: false }
    }

    // 2. Verify purchase with RevenueCat
    let hasPro = false
    try {
      console.log('🔔 initializeProStatus: Importing RevenueCat...')
      const { Purchases } = await import('@revenuecat/purchases-capacitor')

      console.log('🔔 initializeProStatus: Checking if RevenueCat is configured...')
      try {
        // Try to get customer info first - this will fail if RevenueCat is not configured
        await Purchases.getCustomerInfo()
      } catch (configError: any) {
        // RevenueCat not configured - skip verification
        if (configError.message?.includes('not configured') || configError.message?.includes('API key')) {
          console.warn('⚠️ initializeProStatus: RevenueCat not configured, skipping verification')
          console.log('🔔 initializeProStatus: Keeping current status:', currentStatus)
          return currentStatus
        }
        throw configError
      }

      console.log('🔔 initializeProStatus: Calling restorePurchases...')
      const { customerInfo } = await Purchases.restorePurchases()

      // Check if user has active Pro entitlement
      console.log('🔔 initializeProStatus: Customer entitlements:', Object.keys(customerInfo.entitlements.active))
      hasPro = customerInfo.entitlements.active[PRO_PRODUCT_ID] !== undefined
      console.log('🔔 initializeProStatus: Has Pro entitlement:', hasPro)
    } catch (error) {
      // RevenueCat error - keep current status
      console.warn('⚠️ initializeProStatus: Failed to restore purchases:', error)
      console.log('🔔 initializeProStatus: Keeping current status:', currentStatus)
      return currentStatus
    }

    // 3. Update status based on RevenueCat verification
    const newStatus: ProStatus = {
      isPro: hasPro,
      purchaseDate: hasPro ? (currentStatus.purchaseDate || new Date().toISOString()) : undefined,
      productId: hasPro ? PRO_PRODUCT_ID : undefined,
      lastVerified: new Date().toISOString()
    }

    console.log('🔔 initializeProStatus: New status:', newStatus)

    // 4. Save updated status
    await saveProStatus(newStatus)

    console.log('✅ initializeProStatus: Complete, returning:', newStatus)
    return newStatus
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

// src/utils/purchases.ts
import { Capacitor } from '@capacitor/core'
import { handlePurchaseSuccess } from './secureStorage'

const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_API_KEY_IOS || 'YOUR_IOS_API_KEY'
const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || 'YOUR_ANDROID_API_KEY'
const PRO_PRODUCT_ID = 'cakecost_pro'

/**
 * Initialize RevenueCat SDK
 * Must be called before any purchase operations
 */
export async function initializeRevenueCat() {
  if (!Capacitor.isNativePlatform()) {
    console.log('RevenueCat: Skipping initialization on web platform')
    return
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')

    // Select API key based on platform
    const apiKey = Capacitor.getPlatform() === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID

    await Purchases.configure({
      apiKey,
    })

    console.log('RevenueCat: Initialized successfully')
  } catch (error) {
    console.error('RevenueCat: Initialization failed:', error)
    throw error
  }
}

/**
 * Purchase Pro version
 * Returns true if purchase was successful
 */
export async function purchasePro(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('RevenueCat: Purchases not available on web')
    return false
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')

    // Get available packages
    const { offerings } = await Purchases.getOfferings()

    if (!offerings.current || !offerings.current.availablePackages.length) {
      throw new Error('No packages available')
    }

    // Find Pro product package
    const proPackage = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === PRO_PRODUCT_ID
    )

    if (!proPackage) {
      throw new Error('Pro package not found')
    }

    // Make purchase
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: proPackage })

    // Check if user now has Pro entitlement
    const hasPro = customerInfo.entitlements.active[PRO_PRODUCT_ID] !== undefined

    if (hasPro) {
      // Save Pro status to secure storage
      await handlePurchaseSuccess(PRO_PRODUCT_ID)
      console.log('RevenueCat: Purchase successful')
      return true
    }

    return false
  } catch (error: any) {
    // User cancelled purchase
    if (error.code === 'USER_CANCELLED') {
      console.log('RevenueCat: Purchase cancelled by user')
      return false
    }

    console.error('RevenueCat: Purchase failed:', error)
    throw error
  }
}

/**
 * Restore previous purchases
 * Returns true if Pro was restored
 */
export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')

    const { customerInfo } = await Purchases.restorePurchases()

    const hasPro = customerInfo.entitlements.active[PRO_PRODUCT_ID] !== undefined

    if (hasPro) {
      await handlePurchaseSuccess(PRO_PRODUCT_ID)
      console.log('RevenueCat: Purchases restored successfully')
      return true
    }

    console.log('RevenueCat: No purchases to restore')
    return false
  } catch (error) {
    console.error('RevenueCat: Failed to restore purchases:', error)
    throw error
  }
}

/**
 * Get customer info (entitlements, subscriptions, etc.)
 */
export async function getCustomerInfo() {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo
  } catch (error) {
    console.error('RevenueCat: Failed to get customer info:', error)
    return null
  }
}

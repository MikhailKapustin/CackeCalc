// src/utils/purchases.ts
import { Capacitor } from '@capacitor/core'
import { handlePurchaseSuccess } from './secureStorage'

const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_API_KEY_IOS || 'YOUR_IOS_API_KEY'
const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || 'YOUR_ANDROID_API_KEY'
const PRO_PRODUCT_ID = 'cakecalc_pro'

/**
 * Initialize RevenueCat SDK
 * Must be called before any purchase operations
 */
export async function initializeRevenueCat() {
  console.log('🔔 RevenueCat: initializeRevenueCat() called')

  if (!Capacitor.isNativePlatform()) {
    console.log('⚠️ RevenueCat: Skipping initialization on web platform')
    return
  }

  // Select API key based on platform
  const platform = Capacitor.getPlatform()
  const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID

  console.log('🔔 RevenueCat: Platform:', platform)
  console.log('🔔 RevenueCat: API Key (first 20 chars):', apiKey.substring(0, 20))

  // Check if API key is configured
  if (apiKey.startsWith('YOUR_')) {
    console.warn('⚠️ RevenueCat: API key not configured! Please set VITE_REVENUECAT_API_KEY_IOS or VITE_REVENUECAT_API_KEY_ANDROID in .env file')
    console.warn('⚠️ RevenueCat: Skipping initialization. Purchases will not be available.')
    return
  }

  try {
    console.log('🔔 RevenueCat: Importing Purchases module...')
    const { Purchases } = await import('@revenuecat/purchases-capacitor')

    console.log('🔔 RevenueCat: Calling configure...')
    await Purchases.configure({
      apiKey,
    })

    console.log('✅ RevenueCat: Initialized successfully')
  } catch (error) {
    console.error('❌ RevenueCat: Initialization failed:', error)
    throw error
  }
}

/**
 * Purchase Pro version
 * Returns true if purchase was successful
 */
export async function purchasePro(): Promise<boolean> {
  console.log('🔔 RevenueCat: purchasePro() called')

  if (!Capacitor.isNativePlatform()) {
    console.warn('⚠️ RevenueCat: Purchases not available on web')
    return false
  }

  try {
    console.log('🔔 RevenueCat: Importing Purchases module...')
    const { Purchases } = await import('@revenuecat/purchases-capacitor')

    // Get available packages
    console.log('🔔 RevenueCat: Getting offerings...')
    const { offerings } = await Purchases.getOfferings()

    console.log('🔔 RevenueCat: Offerings received:', offerings)
    console.log('🔔 RevenueCat: Current offering:', offerings.current)

    if (!offerings.current || !offerings.current.availablePackages.length) {
      console.error('❌ RevenueCat: No packages available')
      throw new Error('No packages available')
    }

    console.log('🔔 RevenueCat: Available packages:', offerings.current.availablePackages.length)
    console.log('🔔 RevenueCat: Package identifiers:', offerings.current.availablePackages.map(pkg => pkg.product.identifier))

    // Find Pro product package
    const proPackage = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === PRO_PRODUCT_ID
    )

    if (!proPackage) {
      console.error('❌ RevenueCat: Pro package not found. Looking for:', PRO_PRODUCT_ID)
      throw new Error('Pro package not found')
    }

    console.log('🔔 RevenueCat: Pro package found:', proPackage)
    console.log('🔔 RevenueCat: Initiating purchase...')

    // Make purchase
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: proPackage })

    console.log('🔔 RevenueCat: Purchase completed, checking entitlements...')
    console.log('🔔 RevenueCat: Active entitlements:', Object.keys(customerInfo.entitlements.active))

    // Check if user now has Pro entitlement
    const hasPro = customerInfo.entitlements.active[PRO_PRODUCT_ID] !== undefined

    console.log('🔔 RevenueCat: Has Pro entitlement:', hasPro)

    if (hasPro) {
      // Save Pro status to secure storage
      console.log('🔔 RevenueCat: Saving Pro status to secure storage...')
      await handlePurchaseSuccess(PRO_PRODUCT_ID)
      console.log('✅ RevenueCat: Purchase successful')
      return true
    }

    console.warn('⚠️ RevenueCat: Purchase completed but Pro entitlement not found')
    return false
  } catch (error: any) {
    // User cancelled purchase
    if (error.code === 'USER_CANCELLED') {
      console.log('ℹ️ RevenueCat: Purchase cancelled by user')
      return false
    }

    console.error('❌ RevenueCat: Purchase failed:', error)
    console.error('❌ RevenueCat: Error code:', error.code)
    console.error('❌ RevenueCat: Error message:', error.message)
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

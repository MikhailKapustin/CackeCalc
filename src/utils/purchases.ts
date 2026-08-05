// src/utils/purchases.ts
import { Capacitor } from '@capacitor/core'
import { handlePurchaseSuccess } from './secureStorage'

export const PRO_PRODUCT_ID = 'cakecalc_pro'

/**
 * Outcome of a purchase attempt.
 *
 * A cancelled dialog and a deferred payment are normal states, not failures.
 * Returning a single boolean forced the UI to treat both as "something went
 * wrong", so the caller gets the actual outcome instead.
 */
export type PurchaseOutcome =
  | 'purchased'     // entitlement confirmed and Pro stored
  | 'cancelled'     // user dismissed the store dialog
  | 'pending'       // deferred payment — Pro arrives once the payment clears
  | 'unconfirmed'   // store reports ownership, RevenueCat has no entitlement for it
  | 'unavailable'   // not running on a device

/**
 * API key for the given platform.
 * Read at call time, not at module load, so the value is not frozen into the
 * module the moment it is imported (tests can supply their own).
 */
function apiKeyFor(platform: string): string {
  return platform === 'ios'
    ? import.meta.env.VITE_REVENUECAT_API_KEY_IOS || 'YOUR_IOS_API_KEY'
    : import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || 'YOUR_ANDROID_API_KEY'
}

/**
 * Error codes as the SDK actually reports them.
 *
 * PURCHASES_ERROR_CODE holds *strings* — "1", "6", "20" — see
 * node_modules/@revenuecat/purchases-typescript-internal-esm/dist/errors.d.ts.
 * Comparing against invented names ('USER_CANCELLED') never matches and turns
 * an ordinary cancellation into an error toast, which is exactly what happened
 * here before. Always take the constants from the SDK, never retype them.
 */
async function errorCodes() {
  const { PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor')
  return PURCHASES_ERROR_CODE
}

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
  const apiKey = apiKeyFor(platform)

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

    const { LOG_LEVEL } = await import('@revenuecat/purchases-capacitor')

    console.log('🔔 RevenueCat: Calling configure...')
    await Purchases.configure({ apiKey })
    await Purchases.setLogLevel({ level: LOG_LEVEL.VERBOSE })

    console.log('✅ RevenueCat: Initialized successfully')
  } catch (error) {
    console.error('❌ RevenueCat: Initialization failed:', error)
    throw error
  }
}

/**
 * Ask RevenueCat whether the Pro entitlement is active right now.
 * Used as a second opinion when a purchase result arrives without it.
 */
async function confirmProOwnership(): Promise<boolean> {
  const customerInfo = await getCustomerInfo()
  return customerInfo?.entitlements?.active?.[PRO_PRODUCT_ID] !== undefined
}

/**
 * Purchase Pro version.
 * Returns what actually happened — see PurchaseOutcome.
 */
export async function purchasePro(): Promise<PurchaseOutcome> {
  console.log('🔔 RevenueCat: purchasePro() called')

  if (!Capacitor.isNativePlatform()) {
    console.warn('⚠️ RevenueCat: Purchases not available on web')
    return 'unavailable'
  }

  try {
    console.log('🔔 RevenueCat: Importing Purchases module...')
    const { Purchases } = await import('@revenuecat/purchases-capacitor')

    // Get available packages
    console.log('🔔 RevenueCat: Getting offerings...')
    const offerings = await Purchases.getOfferings()

    console.log('🔔 RevenueCat: Current offering:', offerings.current)

    if (!offerings.current || !offerings.current.availablePackages.length) {
      console.error('❌ RevenueCat: No packages available')
      throw new Error('No packages available')
    }

    console.log('🔔 RevenueCat: Package identifiers:', offerings.current.availablePackages.map(pkg => pkg.product.identifier))

    // Find Pro product package
    const proPackage = offerings.current.availablePackages.find(
      pkg => pkg.product.identifier === PRO_PRODUCT_ID
    )

    if (!proPackage) {
      console.error('❌ RevenueCat: Pro package not found. Looking for:', PRO_PRODUCT_ID)
      throw new Error('Pro package not found')
    }

    console.log('🔔 RevenueCat: Initiating purchase...')

    // Make purchase
    const purchaseResult = await Purchases.purchasePackage({ aPackage: proPackage })

    const customerInfo = purchaseResult?.customerInfo

    console.log('🔔 RevenueCat: Active entitlements:', Object.keys(customerInfo?.entitlements?.active ?? {}))

    // Check if user now has Pro entitlement
    if (customerInfo?.entitlements?.active?.[PRO_PRODUCT_ID] !== undefined) {
      await handlePurchaseSuccess(PRO_PRODUCT_ID)
      console.log('✅ RevenueCat: Purchase successful')
      return 'purchased'
    }

    // Purchase returned without the entitlement. Do NOT grant Pro on assumption —
    // ask RevenueCat once more (the entitlement can lag right after the transaction),
    // and only grant if it confirms ownership.
    console.warn('⚠️ RevenueCat: Purchase completed but Pro entitlement missing, re-checking customer info...')
    if (await confirmProOwnership()) {
      await handlePurchaseSuccess(PRO_PRODUCT_ID)
      console.log('✅ RevenueCat: Pro confirmed on re-check')
      return 'purchased'
    }

    console.error('❌ RevenueCat: Pro entitlement not confirmed after purchase — not granting Pro')
    return 'unconfirmed'
  } catch (error: any) {
    const codes = await errorCodes()
    const code = String(error?.code ?? '')

    // User dismissed the store dialog — nothing failed
    if (code === codes.PURCHASE_CANCELLED_ERROR) {
      console.log('ℹ️ RevenueCat: Purchase cancelled by user')
      return 'cancelled'
    }

    // Deferred payment (cash, bank transfer, slow test card). The transaction is
    // real but not complete: Pro must not be granted now, and this is not an error.
    if (code === codes.PAYMENT_PENDING_ERROR) {
      console.log('ℹ️ RevenueCat: Payment is pending, Pro will follow once it clears')
      return 'pending'
    }

    // Product already owned in the store — restore instead of buying again
    if (code === codes.PRODUCT_ALREADY_PURCHASED_ERROR) {
      console.log('ℹ️ RevenueCat: Product already purchased, restoring...')
      try {
        const { Purchases: P } = await import('@revenuecat/purchases-capacitor')
        const { customerInfo } = await P.restorePurchases()
        if (customerInfo?.entitlements?.active?.[PRO_PRODUCT_ID] !== undefined) {
          await handlePurchaseSuccess(PRO_PRODUCT_ID)
          console.log('✅ RevenueCat: Pro restored after already-purchased error')
          return 'purchased'
        }
        // The store says "already purchased" but RevenueCat has no entitlement for it.
        // That is a configuration mismatch or an unconsumed stale purchase, not a paid
        // user — surface it instead of silently handing out Pro.
        console.error('❌ RevenueCat: Store reports product owned, but no Pro entitlement after restore')
        return 'unconfirmed'
      } catch (restoreError: any) {
        if (String(restoreError?.code ?? '') === codes.PAYMENT_PENDING_ERROR) {
          console.log('ℹ️ RevenueCat: Owned product has a pending payment')
          return 'pending'
        }
        console.warn('⚠️ RevenueCat: Restore failed after already-purchased error:', restoreError?.message)
        return 'unconfirmed'
      }
    }

    console.error('❌ RevenueCat: Purchase failed:', error)
    console.error('❌ RevenueCat: Error code:', error?.code)
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

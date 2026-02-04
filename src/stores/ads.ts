// src/stores/ads.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useSettingsStore } from './settings'

/**
 * Ads Store - AdMob Integration
 * Manages banner and interstitial ads for free users
 */
export const useAdsStore = defineStore('ads', () => {
  // State
  const isInitialized = ref(false)
  const isBannerVisible = ref(false)
  const bannerPosition = ref<'top' | 'bottom'>('bottom')
  const lastInterstitialTime = ref<number>(0)
  const lastInterstitialTrigger = ref<string | null>(null)
  const impressionsCount = ref(0)
  const failedLoadsCount = ref(0)

  // Constants
  const INTERSTITIAL_COOLDOWN = 30000 // 30 seconds
  const BANNER_AD_UNIT_ID = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111' // Test ID
  const INTERSTITIAL_AD_UNIT_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712' // Test ID

  // Log ad unit IDs on store creation for debugging
  console.log('🔔 AdMob Store: Banner ID from env:', import.meta.env.VITE_ADMOB_BANNER_ID)
  console.log('🔔 AdMob Store: Final Banner ID:', BANNER_AD_UNIT_ID)
  console.log('🔔 AdMob Store: Interstitial ID from env:', import.meta.env.VITE_ADMOB_INTERSTITIAL_ID)
  console.log('🔔 AdMob Store: Final Interstitial ID:', INTERSTITIAL_AD_UNIT_ID)

  // Getters
  const shouldShowAds = computed(() => {
    const settingsStore = useSettingsStore()
    return !settingsStore.isPro
  })

  const canShowInterstitial = computed(() => {
    const now = Date.now()
    return now - lastInterstitialTime.value >= INTERSTITIAL_COOLDOWN
  })

  /**
   * Dynamic banner height for content padding
   * Returns CSS value that includes safe-area-inset-bottom for devices with notch
   */
  const bannerHeight = computed(() => {
    if (!isBannerVisible.value || !shouldShowAds.value) {
      return '0px'
    }
    // Adaptive banner height: typically 50-100px depending on device
    // Using 60px as average, plus safe area inset for iOS devices
    return 'calc(60px + env(safe-area-inset-bottom, 0px))'
  })

  // Actions
  async function initializeAds() {
    console.log('🔔 AdMob: initializeAds() called')

    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Skipping initialization on web platform')
      return
    }

    const settingsStore = useSettingsStore()
    console.log('🔔 AdMob: isPro status:', settingsStore.isPro)
    console.log('🔔 AdMob: shouldShowAds:', shouldShowAds.value)

    if (!shouldShowAds.value) {
      console.log('AdMob: Ads disabled for Pro users')
      return
    }

    try {
      console.log('🔔 AdMob: Importing AdMob module...')
      const { AdMob } = await import('@capacitor-community/admob')

      console.log('🔔 AdMob: Calling initialize...')
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: [], // Empty array for production
        initializeForTesting: false // Set to false for production
      })

      isInitialized.value = true
      console.log('✅ AdMob: Initialized successfully')
    } catch (error) {
      console.error('❌ AdMob: Initialization failed:', error)
      // Don't throw error - allow app to continue without ads
      console.warn('⚠️ AdMob: App will continue without ads')
    }
  }

  async function showBanner() {
    console.log('🔔 AdMob: showBanner() called')
    console.log('🔔 AdMob: isNativePlatform:', Capacitor.isNativePlatform())
    console.log('🔔 AdMob: shouldShowAds:', shouldShowAds.value)
    console.log('🔔 AdMob: isInitialized:', isInitialized.value)

    if (!Capacitor.isNativePlatform()) {
      console.log('⚠️ AdMob: Not a native platform, skipping banner')
      return
    }

    if (!shouldShowAds.value) {
      console.log('⚠️ AdMob: Should not show ads (Pro user or setting disabled)')
      return
    }

    if (!isInitialized.value) {
      console.log('⚠️ AdMob: Not initialized, skipping banner')
      return
    }

    try {
      console.log('🔔 AdMob: Importing AdMob module for banner...')
      const { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = await import('@capacitor-community/admob')

      // Add event listeners for debugging
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('✅ AdMob: Banner ad loaded')
        isBannerVisible.value = true
        impressionsCount.value++
      })

      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
        console.error('❌ AdMob: Banner failed to load:', error)
        failedLoadsCount.value++
      })

      AdMob.addListener(BannerAdPluginEvents.Opened, () => {
        console.log('📱 AdMob: Banner ad opened')
      })

      AdMob.addListener(BannerAdPluginEvents.Closed, () => {
        console.log('📱 AdMob: Banner ad closed')
      })

      const options: BannerAdOptions = {
        adId: BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      }

      console.log('🔔 AdMob: Showing banner with options:', options)
      console.log('🔔 AdMob: Ad Unit ID:', BANNER_AD_UNIT_ID)
      await AdMob.showBanner(options)

      console.log('✅ AdMob: Banner ad show command sent')
    } catch (error) {
      console.error('❌ AdMob: Failed to show banner:', error)
      console.error('❌ AdMob: Error details:', JSON.stringify(error))
      failedLoadsCount.value++
    }
  }

  async function hideBanner() {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    try {
      const { AdMob } = await import('@capacitor-community/admob')

      await AdMob.hideBanner()
      isBannerVisible.value = false
      console.log('AdMob: Banner ad hidden')
    } catch (error) {
      console.error('AdMob: Failed to hide banner:', error)
      throw error
    }
  }

  async function removeBanner() {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    try {
      const { AdMob } = await import('@capacitor-community/admob')

      await AdMob.removeBanner()
      isBannerVisible.value = false
      console.log('AdMob: Banner ad removed')
    } catch (error) {
      console.error('AdMob: Failed to remove banner:', error)
      throw error
    }
  }

  async function showInterstitial(trigger: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !shouldShowAds.value || !isInitialized.value) {
      return false
    }

    if (!canShowInterstitial.value) {
      console.log('AdMob: Interstitial on cooldown')
      return false
    }

    try {
      const { AdMob, InterstitialAdPluginEvents, AdMobInterstitialAdSize } = await import('@capacitor-community/admob')

      // Prepare interstitial ad
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_AD_UNIT_ID,
        adSize: AdMobInterstitialAdSize.MEDIUM_RECTANGLE
      })

      // Show interstitial ad
      await AdMob.showInterstitial()

      lastInterstitialTime.value = Date.now()
      lastInterstitialTrigger.value = trigger
      impressionsCount.value++

      console.log(`AdMob: Interstitial ad shown (trigger: ${trigger})`)
      return true
    } catch (error) {
      console.error('AdMob: Failed to show interstitial:', error)
      failedLoadsCount.value++
      return false
    }
  }

  async function handleProUpgrade() {
    if (isBannerVisible.value) {
      await removeBanner()
    }

    lastInterstitialTime.value = 0
    lastInterstitialTrigger.value = null

    console.log('AdMob: Ads disabled after Pro upgrade')
  }

  return {
    // State
    isInitialized,
    isBannerVisible,
    bannerPosition,
    lastInterstitialTrigger,
    impressionsCount,
    failedLoadsCount,

    // Getters
    shouldShowAds,
    canShowInterstitial,
    bannerHeight,

    // Actions
    initializeAds,
    showBanner,
    hideBanner,
    removeBanner,
    showInterstitial,
    handleProUpgrade
  }
})

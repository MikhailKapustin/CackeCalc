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

  // Getters
  const shouldShowAds = computed(() => {
    const settingsStore = useSettingsStore()
    return !settingsStore.isPro
  })

  const canShowInterstitial = computed(() => {
    const now = Date.now()
    return now - lastInterstitialTime.value >= INTERSTITIAL_COOLDOWN
  })

  // Actions
  async function initializeAds() {
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Skipping initialization on web platform')
      return
    }

    if (!shouldShowAds.value) {
      console.log('AdMob: Ads disabled for Pro users')
      return
    }

    try {
      const { AdMob } = await import('@capacitor-community/admob')

      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: import.meta.env.DEV ? ['YOUR_TEST_DEVICE_ID'] : [],
        initializeForTesting: import.meta.env.DEV
      })

      isInitialized.value = true
      console.log('AdMob: Initialized successfully')
    } catch (error) {
      console.error('AdMob: Initialization failed:', error)
      throw error
    }
  }

  async function showBanner() {
    if (!Capacitor.isNativePlatform() || !shouldShowAds.value || !isInitialized.value) {
      return
    }

    try {
      const { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob')

      const options: BannerAdOptions = {
        adId: BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      }

      await AdMob.showBanner(options)
      isBannerVisible.value = true
      impressionsCount.value++

      console.log('AdMob: Banner ad shown')
    } catch (error) {
      console.error('AdMob: Failed to show banner:', error)
      failedLoadsCount.value++
      throw error
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

    // Actions
    initializeAds,
    showBanner,
    hideBanner,
    removeBanner,
    showInterstitial,
    handleProUpgrade
  }
})

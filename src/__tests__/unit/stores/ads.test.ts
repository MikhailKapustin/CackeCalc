// src/__tests__/unit/stores/ads.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdsStore } from '@/stores/ads'
import { useSettingsStore } from '@/stores/settings'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android'
  },
  registerPlugin: vi.fn(() => ({}))
}))

// Mock AdMob
vi.mock('@capacitor-community/admob', () => ({
  BannerAdSize: {
    ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
    BANNER: 'BANNER'
  },
  BannerAdPosition: {
    TOP_CENTER: 0,
    BOTTOM_CENTER: 2
  },
  AdMobInterstitialAdSize: {
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE'
  },
  InterstitialAdPluginEvents: {
    Loaded: 'interstitialAdLoaded',
    FailedToLoad: 'interstitialAdFailedToLoad',
    Showed: 'interstitialAdShowed',
    FailedToShow: 'interstitialAdFailedToShow',
    Dismissed: 'interstitialAdDismissed'
  },
  // Used by the store to track banner size / lifecycle (dynamic banner height)
  BannerAdPluginEvents: {
    Loaded: 'bannerAdLoaded',
    FailedToLoad: 'bannerAdFailedToLoad',
    SizeChanged: 'bannerAdSizeChanged',
    Opened: 'bannerAdOpened',
    Closed: 'bannerAdClosed',
    AdImpression: 'bannerAdImpression'
  },
  AdMob: {
    initialize: vi.fn().mockResolvedValue(undefined),
    showBanner: vi.fn().mockResolvedValue(undefined),
    hideBanner: vi.fn().mockResolvedValue(undefined),
    removeBanner: vi.fn().mockResolvedValue(undefined),
    prepareInterstitial: vi.fn().mockResolvedValue(undefined),
    showInterstitial: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn(),
    removeAllListeners: vi.fn()
  },
  BannerAdOptions: {},
  InterstitialAdOptions: {}
}))

/**
 * The store marks the banner visible only when AdMob reports it loaded
 * (BannerAdPluginEvents.Loaded), not right after showBanner() returns.
 * Tests have to fire that event the way the native plugin would.
 */
async function emitBannerLoaded() {
  const { AdMob } = await import('@capacitor-community/admob')
  const calls = (AdMob.addListener as any).mock.calls as Array<[string, () => void]>
  const handler = calls.find(([event]) => event === 'bannerAdLoaded')?.[1]
  if (!handler) {
    throw new Error('Store did not subscribe to BannerAdPluginEvents.Loaded')
  }
  handler()
}

describe('Ads Store - AdMob', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State Initialization', () => {
    it('should initialize with correct default state', () => {
      const store = useAdsStore()

      expect(store.isInitialized).toBe(false)
      expect(store.isBannerVisible).toBe(false)
      expect(store.bannerPosition).toBe('bottom')
      expect(store.impressionsCount).toBe(0)
      expect(store.failedLoadsCount).toBe(0)
    })
  })

  describe('Ad Initialization', () => {
    it('should initialize AdMob for Free users', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      await adsStore.initializeAds()

      expect(adsStore.isInitialized).toBe(true)
    })

    it('should NOT initialize ads for Pro users', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await adsStore.initializeAds()

      expect(adsStore.isInitialized).toBe(false)
      expect(adsStore.shouldShowAds).toBe(false)
    })
  })

  describe('Banner Ads', () => {
    it('should show banner ad for Free users', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      await adsStore.initializeAds()

      await adsStore.showBanner()
      await emitBannerLoaded()

      expect(adsStore.isBannerVisible).toBe(true)
      expect(adsStore.impressionsCount).toBe(1)
    })

    it('should NOT show banner for Pro users', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      await adsStore.showBanner()

      expect(adsStore.isBannerVisible).toBe(false)
    })

    it('should hide banner ad', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      await adsStore.initializeAds()
      await adsStore.showBanner()
      await emitBannerLoaded()

      expect(adsStore.isBannerVisible).toBe(true)

      await adsStore.hideBanner()

      expect(adsStore.isBannerVisible).toBe(false)
    })

    it('should remove banner when user upgrades to Pro', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      await adsStore.initializeAds()
      await adsStore.showBanner()
      await emitBannerLoaded()

      expect(adsStore.isBannerVisible).toBe(true)

      // User purchases Pro
      settingsStore.isPro = true
      await adsStore.handleProUpgrade()

      expect(adsStore.isBannerVisible).toBe(false)
      expect(adsStore.shouldShowAds).toBe(false)
    })
  })

  describe('Interstitial Ads', () => {
    it('should show interstitial ad when saving recipe', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      await adsStore.initializeAds()

      const shown = await adsStore.showInterstitial('recipe_saved')

      expect(shown).toBe(true)
      expect(adsStore.lastInterstitialTrigger).toBe('recipe_saved')
      expect(adsStore.impressionsCount).toBe(1)
    })

    it('should NOT show interstitial too frequently (cooldown period)', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      await adsStore.initializeAds()

      // First interstitial should show
      const firstShown = await adsStore.showInterstitial('recipe_saved')
      expect(firstShown).toBe(true)
      expect(adsStore.lastInterstitialTrigger).toBe('recipe_saved')

      // Immediate second attempt should fail due to cooldown
      const secondShown = await adsStore.showInterstitial('recipe_saved')
      expect(secondShown).toBe(false)

      // canShowInterstitial should be false immediately after showing
      expect(adsStore.canShowInterstitial).toBe(false)
    })

    it('should NOT show interstitial for Pro users', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const shown = await adsStore.showInterstitial('recipe_saved')

      expect(shown).toBe(false)
    })

    it('should show interstitial when attempting export in Free version', async () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      await adsStore.initializeAds()

      const shown = await adsStore.showInterstitial('export_attempt')

      expect(shown).toBe(true)
      expect(adsStore.lastInterstitialTrigger).toBe('export_attempt')
    })
  })

  describe('shouldShowAds Getter', () => {
    it('should return false for Pro users', () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      expect(adsStore.shouldShowAds).toBe(false)
    })

    it('should return true for Free users', () => {
      const adsStore = useAdsStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false

      expect(adsStore.shouldShowAds).toBe(true)
    })
  })
})

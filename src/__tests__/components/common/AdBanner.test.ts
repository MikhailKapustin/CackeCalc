// src/__tests__/components/common/AdBanner.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import AdBanner from '@/components/common/AdBanner.vue'
import { useAdsStore } from '@/stores/ads'
import { useSettingsStore } from '@/stores/settings'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true
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

describe('AdBanner Component', () => {
  let wrapper: any
  let adsStore: any
  let settingsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    adsStore = useAdsStore()
    settingsStore = useSettingsStore()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render placeholder when banner is visible and user is Free', async () => {
      settingsStore.isPro = false
      await adsStore.initializeAds()
      adsStore.isBannerVisible = true

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      expect(wrapper.find('[data-test="ad-banner-placeholder"]').exists()).toBe(true)
    })

    it('should NOT render when user is Pro', async () => {
      settingsStore.isPro = true

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      expect(wrapper.find('[data-test="ad-banner-placeholder"]').exists()).toBe(false)
    })

    it('should NOT render when banner is hidden', async () => {
      settingsStore.isPro = false
      adsStore.isBannerVisible = false

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      expect(wrapper.find('[data-test="ad-banner-placeholder"]').exists()).toBe(false)
    })
  })

  describe('Lifecycle', () => {
    it('should show banner on mount for Free users', async () => {
      settingsStore.isPro = false
      await adsStore.initializeAds()
      const showBannerSpy = vi.spyOn(adsStore, 'showBanner')

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      await wrapper.vm.$nextTick()

      expect(showBannerSpy).toHaveBeenCalled()
    })

    it('should NOT show banner on mount for Pro users', async () => {
      settingsStore.isPro = true
      const showBannerSpy = vi.spyOn(adsStore, 'showBanner')

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      await wrapper.vm.$nextTick()

      expect(showBannerSpy).not.toHaveBeenCalled()
    })

    it('should hide banner on unmount', async () => {
      settingsStore.isPro = false
      await adsStore.initializeAds()
      adsStore.isBannerVisible = true
      const hideBannerSpy = vi.spyOn(adsStore, 'hideBanner')

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      wrapper.unmount()
      await vi.waitFor(() => {
        expect(hideBannerSpy).toHaveBeenCalled()
      })
    })

    it('should handle show banner errors gracefully', async () => {
      settingsStore.isPro = false
      await adsStore.initializeAds()
      vi.spyOn(adsStore, 'showBanner').mockRejectedValueOnce(new Error('Ad load failed'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      await wrapper.vm.$nextTick()
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to show ad banner:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Placeholder Styling', () => {
    it('should render placeholder element when visible', async () => {
      settingsStore.isPro = false
      adsStore.isBannerVisible = true

      wrapper = mount(AdBanner, {
        global: {
          plugins: [Quasar]
        }
      })

      const placeholder = wrapper.find('[data-test="ad-banner-placeholder"]')
      expect(placeholder.exists()).toBe(true)
      expect(placeholder.classes()).toContain('ad-banner-placeholder')
    })
  })
})

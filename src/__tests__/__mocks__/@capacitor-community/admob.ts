// src/__tests__/__mocks__/@capacitor-community/admob.ts
import { vi } from 'vitest'

export const BannerAdSize = {
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE'
}

export const BannerAdPosition = {
  TOP_CENTER: 0,
  CENTER: 1,
  BOTTOM_CENTER: 2
}

export const AdMobInterstitialAdSize = {
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE'
}

export const InterstitialAdPluginEvents = {
  Loaded: 'interstitialAdLoaded',
  FailedToLoad: 'interstitialAdFailedToLoad',
  Showed: 'interstitialAdShowed',
  FailedToShow: 'interstitialAdFailedToShow',
  Dismissed: 'interstitialAdDismissed'
}

export const AdMob = {
  initialize: vi.fn().mockResolvedValue(undefined),
  showBanner: vi.fn().mockResolvedValue(undefined),
  hideBanner: vi.fn().mockResolvedValue(undefined),
  removeBanner: vi.fn().mockResolvedValue(undefined),
  prepareInterstitial: vi.fn().mockResolvedValue(undefined),
  showInterstitial: vi.fn().mockResolvedValue(undefined),
  addListener: vi.fn(),
  removeAllListeners: vi.fn()
}

export interface BannerAdOptions {
  adId: string
  adSize: string
  position: number
  margin?: number
}

export interface InterstitialAdOptions {
  adId: string
  adSize?: string
}

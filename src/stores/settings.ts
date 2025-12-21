import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * Supported theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * Supported currencies
 */
export type Currency = '₽' | '$' | '€' | '£' | '₸' | '₴'

/**
 * Supported languages
 * en - English, ru - Russian, es - Spanish, de - German,
 * fr - French, zh - Chinese, kk - Kazakh
 */
export type Language = 'en' | 'ru' | 'es' | 'de' | 'fr' | 'zh' | 'kk'

/**
 * Valid theme modes for validation
 */
const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'auto']

/**
 * Valid currencies for validation
 */
const VALID_CURRENCIES: Currency[] = ['₽', '$', '€', '£', '₸', '₴']

/**
 * Valid languages for validation
 */
const VALID_LANGUAGES: Language[] = ['en', 'ru', 'es', 'de', 'fr', 'zh', 'kk']

/**
 * Settings Store
 *
 * Manages application settings including theme, currency, and language.
 * Uses Composition API setup syntax for better TypeScript support.
 */
export const useSettingsStore = defineStore('settings', () => {
  // State
  const theme = ref<ThemeMode>('light')
  const currency = ref<Currency>('₽')
  const language = ref<Language>('en')

  // Getters (computed properties)
  const isDarkMode = computed(() => {
    if (theme.value === 'dark') {
      return true
    }
    if (theme.value === 'light') {
      return false
    }
    // For 'auto' mode, check system preference
    if (theme.value === 'auto') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      return false // Default to light if system preference not available
    }
    return false
  })

  const isAutoTheme = computed(() => theme.value === 'auto')

  // Actions
  function setTheme(newTheme: ThemeMode) {
    if (!VALID_THEMES.includes(newTheme)) {
      throw new Error(`Invalid theme: ${newTheme}. Must be one of: ${VALID_THEMES.join(', ')}`)
    }
    theme.value = newTheme
  }

  function toggleTheme() {
    // Cycle: light -> dark -> light
    // If auto, switch to light
    if (theme.value === 'light') {
      theme.value = 'dark'
    } else {
      theme.value = 'light'
    }
  }

  function setCurrency(newCurrency: Currency) {
    if (!VALID_CURRENCIES.includes(newCurrency)) {
      throw new Error(`Invalid currency: ${newCurrency}. Must be one of: ${VALID_CURRENCIES.join(', ')}`)
    }
    currency.value = newCurrency
  }

  function setLanguage(newLanguage: Language) {
    if (!VALID_LANGUAGES.includes(newLanguage)) {
      throw new Error(`Invalid language: ${newLanguage}. Must be one of: ${VALID_LANGUAGES.join(', ')}`)
    }
    language.value = newLanguage
  }

  return {
    // State
    theme,
    currency,
    language,
    // Getters
    isDarkMode,
    isAutoTheme,
    // Actions
    setTheme,
    toggleTheme,
    setCurrency,
    setLanguage,
  }
})

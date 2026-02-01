import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getDatabase } from '@/database/db'

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
  const isPro = ref(false) // Pro version status (loaded from Secure Storage, not DB)

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

  // Database actions
  /**
   * Load settings from database
   * @returns true if language was set (not first run), false if language is NULL (first run)
   */
  async function loadSettings(): Promise<boolean> {
    const database = await getDatabase()
    const result = await database.query('SELECT * FROM settings WHERE id = 1')

    console.log('🔍 loadSettings: query result:', JSON.stringify(result))

    if (result.values && result.values.length > 0) {
      const settings = result.values[0]
      console.log('🔍 loadSettings: settings row:', JSON.stringify(settings))
      console.log('🔍 loadSettings: settings.language value:', settings.language)
      let languageWasSet = false

      // Update state from database
      if (settings.language && VALID_LANGUAGES.includes(settings.language)) {
        console.log('✅ loadSettings: Language found in DB:', settings.language)
        language.value = settings.language as Language
        languageWasSet = true
      } else {
        console.log('⚠️ loadSettings: Language is NULL or invalid in DB')
      }
      if (settings.currency_symbol && VALID_CURRENCIES.includes(settings.currency_symbol)) {
        currency.value = settings.currency_symbol as Currency
      }
      if (settings.theme && VALID_THEMES.includes(settings.theme)) {
        theme.value = settings.theme as ThemeMode
      }

      console.log('🔍 loadSettings: returning languageWasSet =', languageWasSet)
      return languageWasSet // true if language was set, false if NULL (first run)
    }

    console.log('⚠️ loadSettings: No settings row found in database')
    return false // No settings in database (should not happen with INSERT_DEFAULT_SETTINGS)
  }

  async function saveLanguage(newLanguage: Language) {
    setLanguage(newLanguage)

    const database = await getDatabase()
    await database.run(
      'UPDATE settings SET language = ?, updated_at = strftime("%s", "now") WHERE id = 1',
      [newLanguage]
    )
  }

  async function saveTheme(newTheme: ThemeMode) {
    setTheme(newTheme)

    const database = await getDatabase()
    await database.run(
      'UPDATE settings SET theme = ?, updated_at = strftime("%s", "now") WHERE id = 1',
      [newTheme]
    )
  }

  async function saveCurrency(newCurrency: Currency) {
    setCurrency(newCurrency)

    const database = await getDatabase()
    await database.run(
      'UPDATE settings SET currency_symbol = ?, updated_at = strftime("%s", "now") WHERE id = 1',
      [newCurrency]
    )
  }

  return {
    // State
    theme,
    currency,
    language,
    isPro,
    // Getters
    isDarkMode,
    isAutoTheme,
    // Actions
    setTheme,
    toggleTheme,
    setCurrency,
    setLanguage,
    // Database actions
    loadSettings,
    saveLanguage,
    saveTheme,
    saveCurrency,
  }
})

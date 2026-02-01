// src/boot/i18n.ts
import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'

import en from '@/assets/i18n/en.json'
import ru from '@/assets/i18n/ru.json'
import es from '@/assets/i18n/es.json'
import kk from '@/assets/i18n/kk.json'
import de from '@/assets/i18n/de.json'

export type MessageLanguages = keyof typeof en
export type MessageSchema = typeof en

// Supported locales
export const SUPPORT_LOCALES = ['en', 'ru', 'es', 'kk', 'de'] as const
export type SupportedLocale = typeof SUPPORT_LOCALES[number]

/**
 * Detect browser locale and return supported locale
 * Falls back to 'en' if browser locale is not supported
 */
export function getBrowserLocale(): SupportedLocale {
  const navigatorLocale =
    navigator.languages !== undefined
      ? navigator.languages[0]
      : navigator.language

  if (!navigatorLocale) {
    return 'en'
  }

  // Extract language code (e.g., 'en-US' -> 'en')
  const languageCode = navigatorLocale.trim().split(/[-_]/)[0]

  // Check if language is supported
  if (SUPPORT_LOCALES.includes(languageCode as SupportedLocale)) {
    return languageCode as SupportedLocale
  }

  // Fallback to English
  return 'en'
}

/**
 * Create i18n instance
 */
export const i18n = createI18n<[MessageSchema], SupportedLocale>({
  locale: getBrowserLocale(),
  fallbackLocale: 'en',
  legacy: false, // Use Composition API mode
  globalInjection: true,
  messages: {
    en,
    ru,
    es,
    kk,
    de
  }
})

/**
 * Set i18n language and update HTML lang attribute
 */
export function setI18nLanguage(locale: SupportedLocale) {
  i18n.global.locale.value = locale

  // Update HTML lang attribute for accessibility and SEO
  const htmlElement = document.querySelector('html')
  if (htmlElement) {
    htmlElement.setAttribute('lang', locale)
  }
}

export default boot(async ({ app }) => {
  // Set i18n instance on app
  app.use(i18n)

  // Load settings from database to get saved language and theme
  const { useSettingsStore } = await import('@/stores/settings')
  const { initializeTheme } = await import('@/boot/theme')
  const settingsStore = useSettingsStore()

  try {
    // Get browser locale before loading settings
    const browserLocale = i18n.global.locale.value
    console.log(`🌐 Browser locale detected: ${browserLocale}`)
    console.log(`🌐 Navigator.language: ${navigator.language}`)
    console.log(`🌐 Navigator.languages: ${JSON.stringify(navigator.languages)}`)

    // Load settings from database
    const settingsFound = await settingsStore.loadSettings()
    console.log(`🔍 Settings found in DB (language was set): ${settingsFound}`)
    console.log(`🔍 Current settingsStore.language: ${settingsStore.language}`)

    if (!settingsFound) {
      // First run: no settings in database
      // Use browser locale and save it to database for future runs
      console.log(`✨ First run detected. Setting language to browser locale: ${browserLocale}`)
      await settingsStore.saveLanguage(browserLocale as SupportedLocale)
      setI18nLanguage(browserLocale as SupportedLocale)
    } else {
      // Settings found in database - use saved language
      console.log(`📚 Using saved language from database: ${settingsStore.language}`)
      setI18nLanguage(settingsStore.language as SupportedLocale)
    }

    // Initialize theme system
    await initializeTheme()
  } catch (error) {
    console.warn('Failed to load settings from database, using browser locale:', error)
    // Set initial language from browser
    setI18nLanguage(i18n.global.locale.value)
    // Initialize theme with default
    await initializeTheme()
  }
})

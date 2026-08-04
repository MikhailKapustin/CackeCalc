import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial State', () => {
    it('should have default theme as light', () => {
      const store = useSettingsStore()
      expect(store.theme).toBe('light')
    })

    it('should have default currency', () => {
      const store = useSettingsStore()
      // Default was changed from '₽' to '$' when the app went international
      expect(store.currency).toBe('$')
    })

    it('should have default language', () => {
      const store = useSettingsStore()
      expect(store.language).toBe('en')
    })
  })

  describe('Theme Management', () => {
    it('should toggle theme from light to dark', () => {
      const store = useSettingsStore()
      store.toggleTheme()
      expect(store.theme).toBe('dark')
    })

    it('should toggle theme from dark to light', () => {
      const store = useSettingsStore()
      store.theme = 'dark'
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })

    it('should toggle theme from auto to light', () => {
      const store = useSettingsStore()
      store.theme = 'auto'
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })

    it('should set specific theme', () => {
      const store = useSettingsStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
    })

    it('should handle auto theme based on system preference', () => {
      const store = useSettingsStore()
      store.setTheme('auto')
      expect(store.theme).toBe('auto')
    })

    it('should validate theme value', () => {
      const store = useSettingsStore()
      // @ts-expect-error Testing invalid value
      expect(() => store.setTheme('invalid')).toThrow()
    })
  })

  describe('Currency Management', () => {
    it('should set currency symbol', () => {
      const store = useSettingsStore()
      store.setCurrency('$')
      expect(store.currency).toBe('$')
    })

    it('should support multiple currencies', () => {
      const store = useSettingsStore()
      const currencies = ['₽', '$', '€', '£', '₸', '₴']

      currencies.forEach(currency => {
        store.setCurrency(currency)
        expect(store.currency).toBe(currency)
      })
    })
  })

  describe('Language Management', () => {
    it('should set language', () => {
      const store = useSettingsStore()
      store.setLanguage('ru')
      expect(store.language).toBe('ru')
    })

    it('should support multiple languages', () => {
      const store = useSettingsStore()
      const languages = ['en', 'ru', 'es', 'de', 'fr', 'zh', 'kk']

      languages.forEach(lang => {
        store.setLanguage(lang)
        expect(store.language).toBe(lang)
      })
    })

    it('should validate language code', () => {
      const store = useSettingsStore()
      // @ts-expect-error Testing invalid value
      expect(() => store.setLanguage('invalid')).toThrow()
    })
  })

  describe('Computed Properties', () => {
    it('should compute isDarkMode correctly', () => {
      const store = useSettingsStore()

      store.theme = 'light'
      expect(store.isDarkMode).toBe(false)

      store.theme = 'dark'
      expect(store.isDarkMode).toBe(true)

      store.theme = 'auto'
      // Should check system preference, defaults to false if not dark
      expect(typeof store.isDarkMode).toBe('boolean')
    })

    it('should compute isAutoTheme correctly', () => {
      const store = useSettingsStore()

      store.theme = 'light'
      expect(store.isAutoTheme).toBe(false)

      store.theme = 'auto'
      expect(store.isAutoTheme).toBe(true)
    })
  })

  describe('Persistence', () => {
    it('should persist theme changes', () => {
      const store = useSettingsStore()
      store.setTheme('dark')

      // Create new store instance to test persistence
      const newStore = useSettingsStore()
      expect(newStore.theme).toBe('dark')
    })

    it('should persist currency changes', () => {
      const store = useSettingsStore()
      store.setCurrency('$')

      const newStore = useSettingsStore()
      expect(newStore.currency).toBe('$')
    })

    it('should persist language changes', () => {
      const store = useSettingsStore()
      store.setLanguage('ru')

      const newStore = useSettingsStore()
      expect(newStore.language).toBe('ru')
    })
  })
})

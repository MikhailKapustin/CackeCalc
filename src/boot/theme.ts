import { watch } from 'vue'
import { applyTheme, watchSystemTheme } from '@/utils/theme'
import { useSettingsStore } from '@/stores/settings'

/**
 * Initialize theme system
 * - Loads theme from settings
 * - Applies theme
 * - Watches for theme changes
 * - Watches for system theme changes in auto mode
 */
export async function initializeTheme() {
  const settingsStore = useSettingsStore()

  try {
    // Apply initial theme (will be updated when settings load)
    applyTheme(settingsStore.theme)

    // Watch for system theme changes when in auto mode
    let unwatchSystemTheme: (() => void) | null = null

    // Function to setup system theme watcher
    const setupSystemThemeWatcher = () => {
      // Remove previous watcher if exists
      if (unwatchSystemTheme) {
        unwatchSystemTheme()
        unwatchSystemTheme = null
      }

      // Only watch system theme if in auto mode
      if (settingsStore.theme === 'auto') {
        unwatchSystemTheme = watchSystemTheme((isDark) => {
          // When system theme changes and we're in auto mode, Quasar will handle it automatically
          // We just need to ensure Dark.set('auto') is still active
          if (settingsStore.theme === 'auto') {
            applyTheme('auto')
          }
        })
      }
    }

    // Setup initial watcher
    setupSystemThemeWatcher()

    // Watch for theme changes in the store and reapply
    watch(
      () => settingsStore.theme,
      (newTheme) => {
        applyTheme(newTheme)
        setupSystemThemeWatcher()
      }
    )
  } catch (error) {
    console.warn('Failed to initialize theme:', error)
    // Apply default light theme
    applyTheme('light')
  }
}

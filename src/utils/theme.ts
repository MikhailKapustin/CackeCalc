import { Dark } from 'quasar'
import type { ThemeMode } from '@/stores/settings'

/**
 * Apply theme based on theme mode and system preferences
 */
export function applyTheme(themeMode: ThemeMode) {
  if (themeMode === 'dark') {
    Dark.set(true)
  } else if (themeMode === 'light') {
    Dark.set(false)
  } else if (themeMode === 'auto') {
    // Follow system preference
    Dark.set('auto')
  }
}

/**
 * Get current system theme preference
 */
export function getSystemThemePreference(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

/**
 * Watch for system theme changes and call callback
 */
export function watchSystemTheme(callback: (isDark: boolean) => void): (() => void) | null {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }

  return null
}

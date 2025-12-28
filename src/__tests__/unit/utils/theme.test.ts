import { describe, it, expect, beforeEach, vi } from 'vitest'
import { applyTheme, getSystemThemePreference, watchSystemTheme } from '@/utils/theme'
import { Dark } from 'quasar'

// Mock Quasar Dark
vi.mock('quasar', () => ({
  Dark: {
    set: vi.fn()
  }
}))

describe('Theme Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('applyTheme', () => {
    it('should set Dark to true for dark theme', () => {
      applyTheme('dark')
      expect(Dark.set).toHaveBeenCalledWith(true)
    })

    it('should set Dark to false for light theme', () => {
      applyTheme('light')
      expect(Dark.set).toHaveBeenCalledWith(false)
    })

    it('should set Dark to auto for auto theme', () => {
      applyTheme('auto')
      expect(Dark.set).toHaveBeenCalledWith('auto')
    })
  })

  describe('getSystemThemePreference', () => {
    it('should return light when matchMedia is not available', () => {
      const result = getSystemThemePreference()
      expect(result).toBe('light')
    })

    it('should return dark when system prefers dark theme', () => {
      // Mock matchMedia to return dark theme
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: true
      })
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })

      const result = getSystemThemePreference()
      expect(result).toBe('dark')
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('should return light when system prefers light theme', () => {
      // Mock matchMedia to return light theme
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false
      })
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })

      const result = getSystemThemePreference()
      expect(result).toBe('light')
    })
  })

  describe('watchSystemTheme', () => {
    it('should return null when matchMedia is not available', () => {
      // Remove matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined
      })

      const callback = vi.fn()
      const unwatch = watchSystemTheme(callback)
      expect(unwatch).toBeNull()
    })

    it('should setup event listener and return cleanup function', () => {
      const addEventListenerMock = vi.fn()
      const removeEventListenerMock = vi.fn()
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock
      })

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })

      const callback = vi.fn()
      const unwatch = watchSystemTheme(callback)

      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
      expect(typeof unwatch).toBe('function')

      // Call cleanup
      if (unwatch) {
        unwatch()
        expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
      }
    })

    it('should use addListener/removeListener for older browsers', () => {
      const addListenerMock = vi.fn()
      const removeListenerMock = vi.fn()
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addListener: addListenerMock,
        removeListener: removeListenerMock
      })

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock
      })

      const callback = vi.fn()
      const unwatch = watchSystemTheme(callback)

      expect(addListenerMock).toHaveBeenCalledWith(expect.any(Function))
      expect(typeof unwatch).toBe('function')

      // Call cleanup
      if (unwatch) {
        unwatch()
        expect(removeListenerMock).toHaveBeenCalledWith(expect.any(Function))
      }
    })
  })
})

// Test setup file
import { vi } from 'vitest'

// Mock Capacitor core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
    isNative: false,
  },
}))

// src/__tests__/__mocks__/capacitor-secure-storage.ts
import { vi } from 'vitest'

export const SecureStoragePlugin = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  keys: vi.fn(),
  clear: vi.fn()
}

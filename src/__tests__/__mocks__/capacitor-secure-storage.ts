// src/__tests__/__mocks__/capacitor-secure-storage.ts
import { vi } from 'vitest'

/**
 * Fake of @aparajita/capacitor-secure-storage v7.
 *
 * Mirrors the real contract instead of stubbing it:
 *  - the API is positional — set(key, data), get(key) — not object-based
 *  - set() JSON-serializes the value itself
 *  - get() returns the deserialized value, or null when the key is absent
 *
 * Keeping it faithful is the point: an object-based call (set({ key, value }))
 * stores `undefined` here exactly as it does on a device, so round-trip tests
 * catch that instead of passing against a forgiving stub.
 */
const store = new Map<string, string | undefined>()

export const SecureStorage = {
  set: vi.fn(async (key: unknown, data?: unknown): Promise<void> => {
    store.set(String(key), JSON.stringify(data))
  }),

  get: vi.fn(async (key: unknown): Promise<unknown> => {
    const raw = store.get(String(key))
    return raw === undefined ? null : JSON.parse(raw)
  }),

  remove: vi.fn(async (key: unknown): Promise<boolean> => store.delete(String(key))),

  keys: vi.fn(async (): Promise<string[]> => [...store.keys()]),

  clear: vi.fn(async (): Promise<void> => {
    store.clear()
  })
}

/** Drop everything the fake keeps between tests. */
export function __resetSecureStorage() {
  store.clear()
  SecureStorage.set.mockClear()
  SecureStorage.get.mockClear()
  SecureStorage.remove.mockClear()
  SecureStorage.keys.mockClear()
  SecureStorage.clear.mockClear()
}

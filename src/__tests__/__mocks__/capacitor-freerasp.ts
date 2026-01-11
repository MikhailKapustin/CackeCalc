// src/__tests__/__mocks__/capacitor-freerasp.ts
import { vi } from 'vitest'

type EventCallback = (...args: any[]) => void

const listeners = new Map<string, Set<EventCallback>>()

export const Talsec = {
  start: vi.fn().mockResolvedValue(undefined),

  addListener: vi.fn((eventName: string, callback: EventCallback) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set())
    }
    listeners.get(eventName)!.add(callback)

    return {
      remove: () => {
        listeners.get(eventName)?.delete(callback)
      }
    }
  }),

  // Helper for tests to trigger events
  __triggerEvent(eventName: string, data?: any) {
    const callbacks = listeners.get(eventName)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  },

  __clearListeners() {
    listeners.clear()
  }
}

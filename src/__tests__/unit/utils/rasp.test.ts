// src/__tests__/unit/utils/rasp.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { initializeRASP, setupThreatListeners, getDefaultRASPConfig } from '@/utils/rasp'
import { useSecurityStore } from '@/stores/security'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true
  },
  registerPlugin: vi.fn(() => ({}))
}))

// Mock capacitor-freerasp
type EventCallback = (...args: any[]) => void
const listeners = new Map<string, Set<EventCallback>>()

vi.mock('capacitor-freerasp', () => ({
  Talsec: {
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
}))

describe('RASP Utils', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('getDefaultRASPConfig', () => {
    it('should return valid RASP configuration', () => {
      const config = getDefaultRASPConfig()

      expect(config.androidConfig).toBeDefined()
      expect(config.androidConfig?.packageName).toBe('com.cakecost.app')
      expect(config.androidConfig?.certificateHashes).toHaveLength(1)

      expect(config.iosConfig).toBeDefined()
      expect(config.iosConfig?.appBundleIds).toBe('com.cakecost.app')

      expect(config.watcherMail).toBe('security@cakecost.app')
    })
  })

  describe('initializeRASP', () => {
    it('should initialize RASP with provided config', async () => {
      const config = getDefaultRASPConfig()

      await expect(initializeRASP(config)).resolves.not.toThrow()
    })

    it('should handle initialization errors', async () => {
      const { Talsec } = await import('capacitor-freerasp')
      vi.mocked(Talsec.start).mockRejectedValueOnce(new Error('Init failed'))

      const config = getDefaultRASPConfig()

      await expect(initializeRASP(config)).rejects.toThrow('Init failed')
    })
  })

  describe('setupThreatListeners', () => {
    it('should setup threat detection listeners', async () => {
      const securityStore = useSecurityStore()
      const { Talsec } = await import('capacitor-freerasp')

      await setupThreatListeners(securityStore)

      expect(Talsec.addListener).toHaveBeenCalledWith('privilegedAccess', expect.any(Function))
      expect(Talsec.addListener).toHaveBeenCalledWith('invalidSignature', expect.any(Function))
      expect(Talsec.addListener).toHaveBeenCalledWith('malware', expect.any(Function))
      expect(Talsec.addListener).toHaveBeenCalledWith('adbEnabled', expect.any(Function))
      expect(Talsec.addListener).toHaveBeenCalledWith('simulator', expect.any(Function))
      expect(Talsec.addListener).toHaveBeenCalledWith('screenshot', expect.any(Function))
    })

    it('should handle root detection', async () => {
      const securityStore = useSecurityStore()
      const { Talsec } = await import('capacitor-freerasp')

      await setupThreatListeners(securityStore)

      // Trigger root detection event
      Talsec.__triggerEvent('privilegedAccess')

      expect(securityStore.isDeviceCompromised).toBe(true)
      expect(securityStore.detectedThreats).toContain('root')
    })

    it('should handle tampering detection', async () => {
      const securityStore = useSecurityStore()
      const { Talsec } = await import('capacitor-freerasp')

      await setupThreatListeners(securityStore)

      // Trigger tampering detection event
      Talsec.__triggerEvent('invalidSignature')

      expect(securityStore.isDeviceCompromised).toBe(true)
      expect(securityStore.detectedThreats).toContain('tampering')
    })

    it('should handle malware detection', async () => {
      const securityStore = useSecurityStore()
      const { Talsec } = await import('capacitor-freerasp')

      await setupThreatListeners(securityStore)

      // Trigger malware detection event
      Talsec.__triggerEvent('malware', { packageName: 'com.evil.app' })

      expect(securityStore.isDeviceCompromised).toBe(true)
      expect(securityStore.detectedThreats).toContain('malware')
    })

    it('should handle non-critical threats without compromising device', async () => {
      const securityStore = useSecurityStore()
      const { Talsec } = await import('capacitor-freerasp')

      await setupThreatListeners(securityStore)

      // Trigger ADB detection (non-critical)
      Talsec.__triggerEvent('adbEnabled')

      expect(securityStore.isDeviceCompromised).toBe(false)
      expect(securityStore.detectedThreats).toContain('adb')
    })
  })
})

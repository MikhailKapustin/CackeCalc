// src/__tests__/unit/stores/security.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecurityStore } from '@/stores/security'
import { useSettingsStore } from '@/stores/settings'

describe('Security Store - RASP', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('State', () => {
    it('should initialize with safe state', () => {
      const store = useSecurityStore()

      expect(store.isDeviceCompromised).toBe(false)
      expect(store.detectedThreats).toEqual([])
    })
  })

  describe('Threat Detection', () => {
    it('should mark device as compromised when root detected', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('root')

      expect(store.isDeviceCompromised).toBe(true)
      expect(store.detectedThreats).toContain('root')
    })

    it('should mark device as compromised when tampering detected', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('tampering')

      expect(store.isDeviceCompromised).toBe(true)
      expect(store.detectedThreats).toContain('tampering')
    })

    it('should mark device as compromised when malware detected', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('malware')

      expect(store.isDeviceCompromised).toBe(true)
      expect(store.detectedThreats).toContain('malware')
    })

    it('should not mark device as compromised for non-critical threats', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('adb')

      expect(store.isDeviceCompromised).toBe(false)
      expect(store.detectedThreats).toContain('adb')
    })

    it('should not mark device as compromised for screenshot detection', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('screenshot')

      expect(store.isDeviceCompromised).toBe(false)
      expect(store.detectedThreats).toContain('screenshot')
    })

    it('should track multiple threats', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('adb')
      store.handleThreatDetected('emulator')
      store.handleThreatDetected('root')

      expect(store.detectedThreats).toHaveLength(3)
      expect(store.detectedThreats).toContain('adb')
      expect(store.detectedThreats).toContain('emulator')
      expect(store.detectedThreats).toContain('root')
    })

    it('should not add duplicate threats', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('root')
      store.handleThreatDetected('root')
      store.handleThreatDetected('root')

      expect(store.detectedThreats).toHaveLength(1)
      expect(store.detectedThreats).toContain('root')
    })
  })

  describe('Critical Threats Classification', () => {
    it('should classify root as critical threat', () => {
      const store = useSecurityStore()

      const isCritical = store.isCriticalThreat('root')

      expect(isCritical).toBe(true)
    })

    it('should classify tampering as critical threat', () => {
      const store = useSecurityStore()

      const isCritical = store.isCriticalThreat('tampering')

      expect(isCritical).toBe(true)
    })

    it('should classify malware as critical threat', () => {
      const store = useSecurityStore()

      const isCritical = store.isCriticalThreat('malware')

      expect(isCritical).toBe(true)
    })

    it('should not classify adb as critical threat', () => {
      const store = useSecurityStore()

      const isCritical = store.isCriticalThreat('adb')

      expect(isCritical).toBe(false)
    })

    it('should not classify emulator as critical threat', () => {
      const store = useSecurityStore()

      const isCritical = store.isCriticalThreat('emulator')

      expect(isCritical).toBe(false)
    })

    it('should not classify screenshot as critical threat', () => {
      const store = useSecurityStore()

      const isCritical = store.isCriticalThreat('screenshot')

      expect(isCritical).toBe(false)
    })
  })

  describe('Pro Features Access Control', () => {
    it('should block Pro features when device is compromised', () => {
      const store = useSecurityStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true
      store.isDeviceCompromised = true

      const canAccess = store.canAccessProFeatures

      expect(canAccess).toBe(false)
    })

    it('should allow Pro features when device is safe and user is Pro', () => {
      const store = useSecurityStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true
      store.isDeviceCompromised = false

      const canAccess = store.canAccessProFeatures

      expect(canAccess).toBe(true)
    })

    it('should block Pro features when user is not Pro (regardless of device state)', () => {
      const store = useSecurityStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = false
      store.isDeviceCompromised = false

      const canAccess = store.canAccessProFeatures

      expect(canAccess).toBe(false)
    })

    it('should block Pro features when device is compromised even if user is Pro', () => {
      const store = useSecurityStore()
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true
      store.handleThreatDetected('root')

      const canAccess = store.canAccessProFeatures

      expect(canAccess).toBe(false)
    })
  })

  describe('Threat Clearing', () => {
    it('should clear all threats', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('adb')
      store.handleThreatDetected('emulator')
      store.handleThreatDetected('root')

      store.clearThreats()

      expect(store.detectedThreats).toEqual([])
    })

    it('should reset device compromised state when clearing threats', () => {
      const store = useSecurityStore()

      store.handleThreatDetected('root')
      expect(store.isDeviceCompromised).toBe(true)

      store.clearThreats()

      expect(store.isDeviceCompromised).toBe(false)
    })
  })

  describe('Threat Severity', () => {
    it('should return correct severity for critical threats', () => {
      const store = useSecurityStore()

      expect(store.getThreatSeverity('root')).toBe('critical')
      expect(store.getThreatSeverity('tampering')).toBe('critical')
      expect(store.getThreatSeverity('malware')).toBe('critical')
    })

    it('should return correct severity for non-critical threats', () => {
      const store = useSecurityStore()

      expect(store.getThreatSeverity('adb')).toBe('warning')
      expect(store.getThreatSeverity('emulator')).toBe('warning')
      expect(store.getThreatSeverity('screenshot')).toBe('info')
    })
  })
})

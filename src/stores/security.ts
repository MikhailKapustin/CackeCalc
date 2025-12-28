// src/stores/security.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'

export type ThreatType = 'root' | 'tampering' | 'malware' | 'adb' | 'emulator' | 'screenshot'
export type ThreatSeverity = 'critical' | 'warning' | 'info'

// Critical threats that compromise device security
const CRITICAL_THREATS: ThreatType[] = ['root', 'tampering', 'malware']

// Map threats to their severity levels
const THREAT_SEVERITY_MAP: Record<ThreatType, ThreatSeverity> = {
  root: 'critical',
  tampering: 'critical',
  malware: 'critical',
  adb: 'warning',
  emulator: 'warning',
  screenshot: 'info'
}

export const useSecurityStore = defineStore('security', () => {
  // State
  const isDeviceCompromised = ref(false)
  const detectedThreats = ref<ThreatType[]>([])

  // Getters
  const canAccessProFeatures = computed(() => {
    const settingsStore = useSettingsStore()

    // Block Pro features if:
    // 1. Device is compromised
    // 2. User is not Pro
    if (isDeviceCompromised.value || !settingsStore.isPro) {
      return false
    }

    return true
  })

  // Actions
  function handleThreatDetected(threat: ThreatType) {
    // Add threat to list if not already present
    if (!detectedThreats.value.includes(threat)) {
      detectedThreats.value.push(threat)
    }

    // Mark device as compromised if threat is critical
    if (isCriticalThreat(threat)) {
      isDeviceCompromised.value = true
    }
  }

  function isCriticalThreat(threat: ThreatType): boolean {
    return CRITICAL_THREATS.includes(threat)
  }

  function getThreatSeverity(threat: ThreatType): ThreatSeverity {
    return THREAT_SEVERITY_MAP[threat] || 'info'
  }

  function clearThreats() {
    detectedThreats.value = []
    isDeviceCompromised.value = false
  }

  return {
    // State
    isDeviceCompromised,
    detectedThreats,

    // Getters
    canAccessProFeatures,

    // Actions
    handleThreatDetected,
    isCriticalThreat,
    getThreatSeverity,
    clearThreats
  }
})

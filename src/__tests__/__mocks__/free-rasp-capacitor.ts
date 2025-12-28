// src/__tests__/__mocks__/free-rasp-capacitor.ts
import { vi } from 'vitest'

export const FreRasp = {
  start: vi.fn(),
  addListener: vi.fn(),
  removeAllListeners: vi.fn()
}

// Threat types
export enum Threat {
  Root = 'root',
  Tampering = 'tampering',
  ADB = 'adb',
  Emulator = 'emulator',
  Malware = 'malware',
  Screenshot = 'screenshot'
}

export interface ThreatEvent {
  threat: Threat
  data?: any
}

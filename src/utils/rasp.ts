// src/utils/rasp.ts
import { Capacitor } from '@capacitor/core'
import type { useSecurityStore } from '@/stores/security'

/**
 * RASP Configuration Interface
 * Based on capacitor-freerasp documentation
 */
export interface RASPConfig {
  androidConfig?: {
    packageName: string
    certificateHashes: string[]
    supportedAlternativeStores?: string[]
  }
  iosConfig?: {
    appBundleIds: string
    appTeamId: string
  }
  watcherMail?: string
}

/**
 * Initialize RASP (Runtime Application Self-Protection)
 * Detects threats like root/jailbreak, tampering, malware, etc.
 */
export async function initializeRASP(config: RASPConfig) {
  // Only initialize on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('RASP: Skipping initialization on web platform')
    return
  }

  try {
    // Dynamic import to avoid errors on web
    const { Talsec } = await import('capacitor-freerasp')

    await Talsec.start(config)
    console.log('RASP: Initialized successfully')
  } catch (error) {
    console.error('RASP: Initialization failed:', error)
    throw error
  }
}

/**
 * Setup threat detection listeners
 * Integrates with SecurityStore to handle detected threats
 */
export async function setupThreatListeners(securityStore: ReturnType<typeof useSecurityStore>) {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    const { Talsec } = await import('capacitor-freerasp')

    // Root/Jailbreak Detection
    Talsec.addListener('privilegedAccess', () => {
      console.warn('⚠️ RASP: Root/Jailbreak detected')
      securityStore.handleThreatDetected('root')
    })

    // App Tampering Detection
    Talsec.addListener('invalidSignature', () => {
      console.warn('⚠️ RASP: App tampering detected (invalid signature)')
      securityStore.handleThreatDetected('tampering')
    })

    Talsec.addListener('invalidApplicationIdentity', () => {
      console.warn('⚠️ RASP: App tampering detected (invalid identity)')
      securityStore.handleThreatDetected('tampering')
    })

    // Malware Detection (Android only)
    Talsec.addListener('malware', (data: any) => {
      console.error('⚠️ RASP: Malware detected:', data)
      securityStore.handleThreatDetected('malware')
    })

    // USB Debugging (Android only)
    Talsec.addListener('adbEnabled', () => {
      console.warn('⚠️ RASP: ADB enabled')
      securityStore.handleThreatDetected('adb')
    })

    // Emulator Detection
    Talsec.addListener('simulator', () => {
      console.warn('⚠️ RASP: Emulator detected')
      securityStore.handleThreatDetected('emulator')
    })

    // Screenshot/Screen Recording Detection (iOS only)
    Talsec.addListener('screenshot', () => {
      console.log('📸 RASP: Screenshot detected')
      securityStore.handleThreatDetected('screenshot')
    })

    console.log('RASP: Threat listeners configured')
  } catch (error) {
    console.error('RASP: Failed to setup listeners:', error)
    throw error
  }
}

/**
 * Get default RASP configuration
 * Should be customized for production
 */
export function getDefaultRASPConfig(): RASPConfig {
  return {
    androidConfig: {
      packageName: 'com.gliderk.cakecalc',
      // SHA-256 подписей в base64. Первый — сертификат Play App Signing: именно им
      // подписана сборка, которую получает пользователь, поэтому сверять нужно с
      // ним, а не с upload-ключом. Второй — upload-ключ, чтобы собранный локально
      // релиз не выглядел подделкой при отладке на устройстве.
      certificateHashes: [
        'tzfFTGMSmT+CtcKxdB0KPZaxYxCJhiuizChk64hN06Y=',
        'Hy3dyDXy3CtV9FmJtgBuf3yy5P3iTn0uXGxpsUywmWY='
      ],
      supportedAlternativeStores: [
        'com.sec.android.app.samsungapps', // Samsung Galaxy Store
        'com.amazon.venezia' // Amazon Appstore
      ]
    },
    iosConfig: {
      appBundleIds: 'com.gliderk.cakecalc',
      appTeamId: 'YOUR_APPLE_TEAM_ID' // TODO: Replace with actual team ID
    },
    watcherMail: 'security@cakecost.app'
  }
}

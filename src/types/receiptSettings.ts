// src/types/receiptSettings.ts

export type LogoPosition = 'center' | 'watermark'

export interface ReceiptSettings {
  logoPath: string | null
  logoOpacity: number // 0-100
  logoPosition: LogoPosition
  backgroundColor: string // HEX color
  backgroundOpacity: number // 0-100
  textColor: string // HEX color
  businessName: string | null
  contactPhone: string | null
  instagram: string | null
  website: string | null
}

export interface ReceiptSettingsResult {
  success: boolean
  error?: string
  showPaywall?: boolean
}

export interface BusinessInfo {
  name?: string
  phone?: string
  instagram?: string
  website?: string
}

// src/types/export.ts
import type { Ingredient } from './ingredient'
import type { Recipe } from './recipe'
import type { Currency, ThemeMode } from '@/stores/settings'
import type { LogoPosition } from './receiptSettings'

export interface ExportSettings {
  currency?: Currency
  language?: string
  theme?: ThemeMode
}

export interface ExportReceiptSettings {
  logoPath?: string | null
  logoOpacity?: number
  logoPosition?: LogoPosition
  backgroundColor?: string
  backgroundOpacity?: number
  textColor?: string
  businessName?: string | null
  contactPhone?: string | null
  instagram?: string | null
  website?: string | null
  logo?: {
    base64: string
    filename: string
  }
}

export interface ExportData {
  version: string
  exportDate: string
  exportedBy: 'free' | 'pro'
  data: {
    ingredients: Ingredient[]
    recipes: Recipe[]
    settings: ExportSettings
    receiptSettings?: ExportReceiptSettings
  }
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface ImportResult {
  success: boolean
  error?: string
  showPaywall?: boolean
  message?: string
}

// src/utils/importData.ts
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'
import type { ExportData, ValidationResult, ImportResult } from '@/types/export'
import { Filesystem, Directory } from '@capacitor/filesystem'

// Free version limits
const FREE_RECIPES_LIMIT = 5
const FREE_INGREDIENTS_LIMIT = 15

/**
 * Validate import data structure
 * @param data Data object to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateImportData(data: any): ValidationResult {
  // Check for required fields
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'Неверный формат файла'
    }
  }

  if (!data.version) {
    return {
      valid: false,
      error: 'Отсутствует версия файла'
    }
  }

  if (!data.data || typeof data.data !== 'object') {
    return {
      valid: false,
      error: 'Неверный формат файла'
    }
  }

  return { valid: true }
}

/**
 * Import data from ExportData object
 * @param importFileData Parsed export data object
 * @returns Import result with success flag and optional error/paywall info
 */
export async function importData(importFileData: ExportData): Promise<ImportResult> {
  // Validate data structure
  const validation = validateImportData(importFileData)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    }
  }

  const settingsStore = useSettingsStore()
  const ingredientsStore = useIngredientsStore()
  const recipesStore = useRecipesStore()
  const receiptStore = useReceiptSettingsStore()

  // Check Free version limits
  if (!settingsStore.isPro) {
    const recipesCount = importFileData.data.recipes?.length || 0
    const ingredientsCount = importFileData.data.ingredients?.length || 0

    if (recipesCount > FREE_RECIPES_LIMIT) {
      return {
        success: false,
        error: `Файл содержит ${recipesCount} рецептов. В бесплатной версии можно импортировать максимум ${FREE_RECIPES_LIMIT} рецептов.`,
        showPaywall: true
      }
    }

    if (ingredientsCount > FREE_INGREDIENTS_LIMIT) {
      return {
        success: false,
        error: `Файл содержит ${ingredientsCount} ингредиентов. В бесплатной версии можно импортировать максимум ${FREE_INGREDIENTS_LIMIT} ингредиентов.`,
        showPaywall: true
      }
    }
  }

  try {
    // Clear existing data (replace with imported data)
    ingredientsStore.ingredients = []
    recipesStore.recipes = []

    // Import ingredients
    if (importFileData.data.ingredients) {
      ingredientsStore.ingredients = importFileData.data.ingredients
    }

    // Import recipes
    if (importFileData.data.recipes) {
      recipesStore.recipes = importFileData.data.recipes
    }

    // Import settings (but NOT isPro flag - security measure)
    if (importFileData.data.settings) {
      const { isPro, ...safeSettings } = importFileData.data.settings as any

      if (safeSettings.currency !== undefined) {
        settingsStore.currency = safeSettings.currency
      }
      if (safeSettings.language !== undefined) {
        settingsStore.language = safeSettings.language
      }
      if (safeSettings.theme !== undefined) {
        settingsStore.theme = safeSettings.theme
      }
    }

    // Import receipt settings for Pro users only
    if (settingsStore.isPro && importFileData.data.receiptSettings) {
      const receiptSettings = importFileData.data.receiptSettings

      // Import receipt settings fields
      if (receiptSettings.logoOpacity !== undefined) {
        receiptStore.settings.logoOpacity = receiptSettings.logoOpacity
      }
      if (receiptSettings.logoPosition !== undefined) {
        receiptStore.settings.logoPosition = receiptSettings.logoPosition
      }
      if (receiptSettings.backgroundColor !== undefined) {
        receiptStore.settings.backgroundColor = receiptSettings.backgroundColor
      }
      if (receiptSettings.backgroundOpacity !== undefined) {
        receiptStore.settings.backgroundOpacity = receiptSettings.backgroundOpacity
      }
      if (receiptSettings.textColor !== undefined) {
        receiptStore.settings.textColor = receiptSettings.textColor
      }
      if (receiptSettings.businessName !== undefined) {
        receiptStore.settings.businessName = receiptSettings.businessName
      }
      if (receiptSettings.contactPhone !== undefined) {
        receiptStore.settings.contactPhone = receiptSettings.contactPhone
      }
      if (receiptSettings.instagram !== undefined) {
        receiptStore.settings.instagram = receiptSettings.instagram
      }
      if (receiptSettings.website !== undefined) {
        receiptStore.settings.website = receiptSettings.website
      }

      // Decode and save logo if present
      if (receiptSettings.logo) {
        try {
          const { base64, filename } = receiptSettings.logo

          // Extract base64 data (remove data:image/png;base64, prefix if present)
          const base64Data = base64.includes(',') ? base64.split(',')[1] : base64

          // Save to filesystem
          const path = `logos/${filename}`
          await Filesystem.writeFile({
            path,
            data: base64Data,
            directory: Directory.Data
          })

          receiptStore.settings.logoPath = path
        } catch (error) {
          console.warn('Failed to save logo during import:', error)
          // Continue without logo - not a critical error
        }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при импорте данных'
    }
  }
}

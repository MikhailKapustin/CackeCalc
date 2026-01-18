// src/utils/exportData.ts
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'
import type { ExportData, ExportSettings, ExportReceiptSettings } from '@/types/export'
import { Filesystem, Directory } from '@capacitor/filesystem'

/**
 * Export all application data to JSON format
 * @returns ExportData object ready for serialization
 */
export async function exportData(): Promise<ExportData> {
  const ingredientsStore = useIngredientsStore()
  const recipesStore = useRecipesStore()
  const settingsStore = useSettingsStore()
  const receiptStore = useReceiptSettingsStore()

  // Prepare settings (exclude isPro for security)
  const settings: ExportSettings = {
    currency: settingsStore.currency,
    language: settingsStore.language,
    theme: settingsStore.theme
  }

  // Prepare export data structure
  const exportData: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    exportedBy: settingsStore.isPro ? 'pro' : 'free',
    data: {
      ingredients: ingredientsStore.ingredients,
      recipes: recipesStore.recipes,
      settings
    }
  }

  // Include receipt settings for Pro users only
  if (settingsStore.isPro) {
    const receiptSettings: ExportReceiptSettings = {
      logoPath: receiptStore.settings.logoPath,
      logoOpacity: receiptStore.settings.logoOpacity,
      logoPosition: receiptStore.settings.logoPosition,
      backgroundColor: receiptStore.settings.backgroundColor,
      backgroundOpacity: receiptStore.settings.backgroundOpacity,
      textColor: receiptStore.settings.textColor,
      businessName: receiptStore.settings.businessName,
      contactPhone: receiptStore.settings.contactPhone,
      instagram: receiptStore.settings.instagram,
      website: receiptStore.settings.website
    }

    // Export logo as base64 if it exists
    if (receiptStore.settings.logoPath) {
      try {
        const result = await Filesystem.readFile({
          path: receiptStore.settings.logoPath,
          directory: Directory.Data
        })

        // Extract filename from path
        const filename = receiptStore.settings.logoPath.split('/').pop() || 'logo.png'

        receiptSettings.logo = {
          base64: result.data as string,
          filename
        }
      } catch (error) {
        // Logo file not found or read error - continue without logo
        console.warn('Failed to read logo file for export:', error)
      }
    }

    exportData.data.receiptSettings = receiptSettings
  }

  return exportData
}

/**
 * Generate filename for export with current date
 * @returns Filename in format: cakecost_backup_YYYY-MM-DD.json
 */
export function generateExportFilename(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `cakecost_backup_${year}-${month}-${day}.json`
}

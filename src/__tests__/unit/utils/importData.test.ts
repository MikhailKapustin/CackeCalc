// src/__tests__/unit/utils/importData.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { importData, validateImportData } from '@/utils/importData'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'
import type { ExportData } from '@/types/export'

// Mock Filesystem
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn()
  },
  Directory: {
    Data: 'DATA'
  }
}))

// Mock database
vi.mock('@/database/db', () => ({
  db: {
    query: vi.fn(),
    execute: vi.fn()
  }
}))

describe('Import Data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('validateImportData', () => {
    it('should validate correct import data structure', () => {
      const validData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'free',
        data: {
          ingredients: [],
          recipes: [],
          settings: {}
        }
      }

      const result = validateImportData(validData)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid JSON structure', () => {
      const invalidData = {
        version: '1.0'
        // Missing required fields
      } as any

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Неверный формат файла')
    })

    it('should reject data without version', () => {
      const invalidData = {
        exportDate: '2025-01-15T10:00:00Z',
        data: {
          ingredients: [],
          recipes: []
        }
      } as any

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject data without data object', () => {
      const invalidData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z'
      } as any

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should accept data with Pro features', () => {
      const validData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'pro',
        data: {
          ingredients: [],
          recipes: [],
          settings: {},
          receiptSettings: {
            backgroundColor: '#FFE5E5',
            textColor: '#000000'
          }
        }
      }

      const result = validateImportData(validData)

      expect(result.valid).toBe(true)
    })
  })

  describe('importData', () => {
    it('should block import of >5 recipes for Free users', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.isPro = false

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'free',
        data: {
          ingredients: [],
          recipes: Array(6).fill(null).map((_, i) => ({
            id: i + 1,
            name: `Торт ${i + 1}`,
            items: [],
            sellingPrice: 1000,
            sellingUnit: 'kg',
            totalCost: 0,
            profitAmount: 1000,
            profitPercent: 0
          })),
          settings: {}
        }
      }

      const result = await importData(importFileData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Файл содержит 6 рецептов')
      expect(result.showPaywall).toBe(true)
    })

    it('should block import of >15 ingredients for Free users', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.isPro = false

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'free',
        data: {
          ingredients: Array(20).fill(null).map((_, i) => ({
            id: i + 1,
            name: `Ингредиент ${i + 1}`,
            purchasePrice: 100,
            purchaseAmount: 1,
            purchaseUnit: 'kg',
            type: 'weight',
            pricePerBaseUnit: 0.1
          })),
          recipes: [],
          settings: {}
        }
      }

      const result = await importData(importFileData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Файл содержит 20 ингредиентов')
      expect(result.showPaywall).toBe(true)
    })

    it('should allow import for Pro users without limits', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.isPro = true

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'pro',
        data: {
          ingredients: Array(20).fill(null).map((_, i) => ({
            id: i + 1,
            name: `Ингредиент ${i + 1}`,
            purchasePrice: 100,
            purchaseAmount: 1,
            purchaseUnit: 'kg',
            type: 'weight',
            pricePerBaseUnit: 0.1
          })),
          recipes: Array(10).fill(null).map((_, i) => ({
            id: i + 1,
            name: `Торт ${i + 1}`,
            items: [],
            sellingPrice: 1000,
            sellingUnit: 'kg',
            totalCost: 0,
            profitAmount: 1000,
            profitPercent: 0
          })),
          settings: {}
        }
      }

      const result = await importData(importFileData)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should import basic data successfully', async () => {
      const settingsStore = useSettingsStore()
      const ingredientsStore = useIngredientsStore()
      const recipesStore = useRecipesStore()

      settingsStore.isPro = false

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'free',
        data: {
          ingredients: [
            {
              id: 1,
              name: 'Мука',
              purchasePrice: 120,
              purchaseAmount: 2,
              purchaseUnit: 'kg',
              type: 'weight',
              pricePerBaseUnit: 0.06
            }
          ],
          recipes: [
            {
              id: 1,
              name: 'Торт',
              items: [{ ingredientId: 1, amount: 500 }],
              sellingPrice: 2000,
              sellingUnit: 'kg',
              totalCost: 30,
              profitAmount: 1970,
              profitPercent: 6566.67
            }
          ],
          settings: {
            currency: '$',
            language: 'en',
            theme: 'dark'
          }
        }
      }

      const result = await importData(importFileData)

      expect(result.success).toBe(true)
      expect(ingredientsStore.ingredients).toHaveLength(1)
      expect(recipesStore.recipes).toHaveLength(1)
      expect(settingsStore.currency).toBe('$')
    })

    it('should import receipt settings for Pro users', async () => {
      const settingsStore = useSettingsStore()
      const receiptStore = useReceiptSettingsStore()

      settingsStore.isPro = true

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'pro',
        data: {
          ingredients: [],
          recipes: [],
          settings: {},
          receiptSettings: {
            logoPath: null,
            logoOpacity: 80,
            logoPosition: 'center',
            backgroundColor: '#FFE5E5',
            backgroundOpacity: 90,
            textColor: '#333333',
            businessName: 'Sweet Dreams',
            contactPhone: '+1234567890',
            instagram: '@sweetdreams',
            website: 'sweetdreams.com'
          }
        }
      }

      const result = await importData(importFileData)

      expect(result.success).toBe(true)
      expect(receiptStore.settings.backgroundColor).toBe('#FFE5E5')
      expect(receiptStore.settings.businessName).toBe('Sweet Dreams')
      expect(receiptStore.settings.logoOpacity).toBe(80)
    })

    it('should NOT import receipt settings for Free users', async () => {
      const settingsStore = useSettingsStore()
      const receiptStore = useReceiptSettingsStore()

      settingsStore.isPro = false

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'pro',
        data: {
          ingredients: [],
          recipes: [],
          settings: {},
          receiptSettings: {
            backgroundColor: '#FFE5E5',
            textColor: '#000000'
          }
        }
      }

      await importData(importFileData)

      expect(receiptStore.settings.backgroundColor).toBe('#FFFFFF') // Default value
    })

    it('should decode base64 logo and save to filesystem', async () => {
      const { Filesystem } = await import('@capacitor/filesystem')
      const settingsStore = useSettingsStore()

      settingsStore.isPro = true

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'pro',
        data: {
          ingredients: [],
          recipes: [],
          settings: {},
          receiptSettings: {
            logo: {
              base64: 'data:image/png;base64,iVBORw0KGgo...',
              filename: 'logo.png'
            }
          }
        }
      }

      vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file://logos/logo.png' })

      const result = await importData(importFileData)

      expect(result.success).toBe(true)
      expect(Filesystem.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('logo.png'),
          data: expect.any(String)
        })
      )
    })

    it('should NOT import isPro flag', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.isPro = false

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'free',
        data: {
          ingredients: [],
          recipes: [],
          settings: {
            isPro: true // Attempting to import Pro status
          } as any
        }
      }

      await importData(importFileData)

      expect(settingsStore.isPro).toBe(false)
    })

    it('should handle invalid data gracefully', async () => {
      const invalidData = {
        version: '1.0'
      } as any

      const result = await importData(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should clear existing data before import', async () => {
      const ingredientsStore = useIngredientsStore()
      const recipesStore = useRecipesStore()

      // Add some existing data
      ingredientsStore.ingredients = [
        {
          id: 99,
          name: 'Old Ingredient',
          purchasePrice: 50,
          purchaseAmount: 1,
          purchaseUnit: 'kg',
          type: 'weight',
          pricePerBaseUnit: 0.05
        }
      ]

      const importFileData: ExportData = {
        version: '1.0',
        exportDate: '2025-01-15T10:00:00Z',
        exportedBy: 'free',
        data: {
          ingredients: [
            {
              id: 1,
              name: 'New Ingredient',
              purchasePrice: 100,
              purchaseAmount: 1,
              purchaseUnit: 'kg',
              type: 'weight',
              pricePerBaseUnit: 0.1
            }
          ],
          recipes: [],
          settings: {}
        }
      }

      const result = await importData(importFileData)

      expect(result.success).toBe(true)
      expect(ingredientsStore.ingredients).toHaveLength(1)
      expect(ingredientsStore.ingredients[0].name).toBe('New Ingredient')
    })
  })
})

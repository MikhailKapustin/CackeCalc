// src/__tests__/unit/utils/exportData.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { exportData, generateExportFilename } from '@/utils/exportData'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'
import { useReceiptSettingsStore } from '@/stores/receiptSettings'

// Mock Filesystem
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: vi.fn()
  },
  Directory: {
    Data: 'DATA'
  }
}))

describe('Export Data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should export all data to JSON', async () => {
    const ingredientsStore = useIngredientsStore()
    const recipesStore = useRecipesStore()
    const settingsStore = useSettingsStore()

    // Set up test data
    ingredientsStore.ingredients = [
      {
        id: 1,
        name: 'Мука',
        purchasePrice: 120,
        purchaseAmount: 2,
        purchaseUnit: 'kg',
        type: 'weight',
        pricePerBaseUnit: 0.06
      }
    ]

    recipesStore.recipes = [
      {
        id: 1,
        name: 'Торт',
        description: 'Вкусный торт',
        items: [{ ingredientId: 1, amount: 500 }],
        sellingPrice: 2000,
        sellingUnit: 'kg',
        totalCost: 30,
        profitAmount: 1970,
        profitPercent: 6566.67
      }
    ]

    settingsStore.currency = '₽'
    settingsStore.language = 'ru'
    settingsStore.theme = 'light'
    settingsStore.isPro = false

    const exportedData = await exportData()

    expect(exportedData.version).toBe('1.0')
    expect(exportedData.exportedBy).toBe('free')
    expect(exportedData.exportDate).toBeDefined()
    expect(exportedData.data.ingredients).toHaveLength(1)
    expect(exportedData.data.recipes).toHaveLength(1)
    expect(exportedData.data.settings).toBeDefined()
    expect(exportedData.data.settings.currency).toBe('₽')
  })

  it('should NOT include isPro flag in export', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = true

    const exportedData = await exportData()

    expect(exportedData.data.settings).not.toHaveProperty('isPro')
  })

  it('should include receipt settings for Pro users', async () => {
    const settingsStore = useSettingsStore()
    const receiptStore = useReceiptSettingsStore()

    settingsStore.isPro = true
    receiptStore.settings = {
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

    const exportedData = await exportData()

    expect(exportedData.exportedBy).toBe('pro')
    expect(exportedData.data.receiptSettings).toBeDefined()
    expect(exportedData.data.receiptSettings?.backgroundColor).toBe('#FFE5E5')
    expect(exportedData.data.receiptSettings?.businessName).toBe('Sweet Dreams')
    expect(exportedData.data.receiptSettings?.logoOpacity).toBe(80)
  })

  it('should NOT include receipt settings for Free users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = false

    const exportedData = await exportData()

    expect(exportedData.exportedBy).toBe('free')
    expect(exportedData.data.receiptSettings).toBeUndefined()
  })

  it('should encode logo to base64 for Pro users', async () => {
    const { Filesystem } = await import('@capacitor/filesystem')
    const settingsStore = useSettingsStore()
    const receiptStore = useReceiptSettingsStore()

    settingsStore.isPro = true
    receiptStore.settings.logoPath = 'logos/my_logo.png'

    // Mock Filesystem.readFile
    vi.mocked(Filesystem.readFile).mockResolvedValue({
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...'
    })

    const exportedData = await exportData()

    expect(exportedData.data.receiptSettings?.logo).toBeDefined()
    expect(exportedData.data.receiptSettings?.logo?.base64).toBeTruthy()
    expect(exportedData.data.receiptSettings?.logo?.filename).toBe('my_logo.png')
  })

  it('should handle missing logo gracefully', async () => {
    const { Filesystem } = await import('@capacitor/filesystem')
    const settingsStore = useSettingsStore()
    const receiptStore = useReceiptSettingsStore()

    settingsStore.isPro = true
    receiptStore.settings.logoPath = 'logos/missing.png'

    // Mock Filesystem.readFile to throw error
    vi.mocked(Filesystem.readFile).mockRejectedValue(new Error('File not found'))

    const exportedData = await exportData()

    expect(exportedData.data.receiptSettings?.logo).toBeUndefined()
  })

  it('should generate filename with current date', () => {
    const filename = generateExportFilename()

    expect(filename).toMatch(/^cakecost_backup_\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('should export empty arrays when no data exists', async () => {
    const exportedData = await exportData()

    expect(exportedData.data.ingredients).toEqual([])
    expect(exportedData.data.recipes).toEqual([])
  })

  it('should include all recipe fields in export', async () => {
    const recipesStore = useRecipesStore()

    recipesStore.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        description: 'Классический торт',
        items: [
          { ingredientId: 1, amount: 500 },
          { ingredientId: 2, amount: 300 }
        ],
        sellingPrice: 3000,
        sellingUnit: 'kg',
        totalCost: 150,
        profitAmount: 2850,
        profitPercent: 1900
      }
    ]

    const exportedData = await exportData()

    const recipe = exportedData.data.recipes[0]
    expect(recipe.name).toBe('Торт Наполеон')
    expect(recipe.description).toBe('Классический торт')
    expect(recipe.items).toHaveLength(2)
    expect(recipe.sellingPrice).toBe(3000)
  })

  it('should include all ingredient fields in export', async () => {
    const ingredientsStore = useIngredientsStore()

    ingredientsStore.ingredients = [
      {
        id: 1,
        name: 'Мука пшеничная',
        purchasePrice: 120,
        purchaseAmount: 2,
        purchaseUnit: 'kg',
        type: 'weight',
        pricePerBaseUnit: 0.06
      }
    ]

    const exportedData = await exportData()

    const ingredient = exportedData.data.ingredients[0]
    expect(ingredient.name).toBe('Мука пшеничная')
    expect(ingredient.purchasePrice).toBe(120)
    expect(ingredient.purchaseAmount).toBe(2)
    expect(ingredient.purchaseUnit).toBe('kg')
    expect(ingredient.type).toBe('weight')
    expect(ingredient.pricePerBaseUnit).toBe(0.06)
  })
})

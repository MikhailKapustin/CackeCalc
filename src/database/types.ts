// Database types

export type MeasurementType = 'weight' | 'volume' | 'count'
export type PurchaseUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'tens'
export type SellingUnit = 'kg' | 'pcs'
export type ThemeType = 'light' | 'dark' | 'auto'

export interface Ingredient {
  id: number
  name: string
  purchasePrice: number
  purchaseAmount: number
  purchaseUnit: PurchaseUnit
  type: MeasurementType
  pricePerBaseUnit: number
  createdAt?: number
  updatedAt?: number
}

export interface Recipe {
  id: number
  name: string
  description?: string
  totalCost: number
  sellingPrice: number
  sellingUnit: SellingUnit
  profitAmount: number
  profitPercent: number
  createdAt?: number
  updatedAt?: number
}

export interface RecipeItem {
  id: number
  recipeId: number
  ingredientId: number
  amount: number
}

export interface Settings {
  id: 1
  currencySymbol: string
  language: string
  theme: ThemeType
  receiptLogoPath?: string
  receiptLogoOpacity: number
  receiptLogoPosition: 'center' | 'watermark'
  receiptBgColor: string
  receiptBgOpacity: number
  receiptTextColor: string
  receiptBusinessName?: string
  receiptPhone?: string
  receiptInstagram?: string
  receiptWebsite?: string
  updatedAt?: number
}

// Pro status (stored in Secure Storage, NOT in database)
export interface ProStatus {
  isPro: boolean
  purchaseDate?: string
  productId?: string
  lastVerified?: string
}

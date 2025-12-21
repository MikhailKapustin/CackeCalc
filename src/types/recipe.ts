export type SellingUnit = 'kg' | 'pcs'

export interface RecipeItem {
  ingredientId: number
  amount: number  // Always in base units (g, ml, pcs)
}

export interface Recipe {
  id: number
  name: string
  description?: string
  items: RecipeItem[]
  sellingPrice: number
  sellingUnit: SellingUnit
  totalCost?: number      // Cached for performance
  profitAmount?: number   // Cached for performance
  profitPercent?: number  // Cached for performance
  createdAt?: number
  updatedAt?: number
}

export interface RecipeInput {
  name: string
  description?: string
  items: RecipeItem[]
  sellingPrice: number
  sellingUnit: SellingUnit
}

export interface RecipeUpdate {
  name?: string
  description?: string
  items?: RecipeItem[]
  sellingPrice?: number
  sellingUnit?: SellingUnit
}

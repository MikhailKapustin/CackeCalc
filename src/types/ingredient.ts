export type MeasurementType = 'weight' | 'volume' | 'count'

export type PurchaseUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'tens'

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

export interface IngredientInput {
  name: string
  purchasePrice: number
  purchaseAmount: number
  purchaseUnit: PurchaseUnit
  type: MeasurementType
}

export interface IngredientUpdate {
  name?: string
  purchasePrice?: number
  purchaseAmount?: number
  purchaseUnit?: PurchaseUnit
  type?: MeasurementType
}

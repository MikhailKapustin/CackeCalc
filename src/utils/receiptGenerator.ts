/**
 * Receipt Generator Utilities
 * Functions for calculating order totals and generating receipt text
 */

interface Recipe {
  name: string
  sellingPrice: number
  sellingUnit: 'kg' | 'pcs'
}

interface ReceiptData {
  recipeName: string
  weight: number
  pricePerUnit: number
  unit: string
  total: number
  currency: string
}

/**
 * Calculate the total price for an order
 * @param recipe - Recipe with selling price and unit
 * @param quantity - Weight in kg or number of pieces
 * @returns Total price
 */
export function calculateOrderTotal(recipe: Recipe, quantity: number): number {
  return recipe.sellingPrice * quantity
}

/**
 * Format number with spaces as thousands separator and 2 decimal places
 * Example: 10000 -> "10 000.00", 1234.5 -> "1 234.50"
 */
function formatNumber(num: number): string {
  const rounded = num.toFixed(2)
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Generate formatted receipt text for sharing with client
 * @param receipt - Receipt data including recipe name, weight, prices
 * @returns Formatted receipt text
 */
export function generateReceiptText(receipt: ReceiptData): string {
  const {
    recipeName,
    weight,
    pricePerUnit,
    unit,
    total,
    currency
  } = receipt

  const weightLabel = unit === 'кг' ? 'Вес' : 'Количество'
  const priceLabel = unit === 'кг' ? 'Цена за кг' : 'Цена за шт'

  const lines = [
    '🍰 Ваш расчет заказа',
    '',
    `Торт: ${recipeName}`,
    `${weightLabel}: ${weight} ${unit}`,
    `${priceLabel}: ${formatNumber(pricePerUnit)} ${currency}`,
    '',
    `💰 ИТОГО: ${formatNumber(total)} ${currency}`,
    '',
    'Посчитано в приложении CakeCost для кондитеров',
    '[Ссылка на приложение]'
  ]

  return lines.join('\n')
}

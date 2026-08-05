/**
 * Unit conversion utilities for the Cake calc application
 * Handles conversions between purchase units and base units
 */

/**
 * Conversion rates to base units:
 * - Weight: grams (g)
 * - Volume: milliliters (ml)
 * - Count: pieces (pcs)
 */
export const CONVERSION_RATES: Record<string, number> = {
  // Вес -> Граммы
  g: 1,
  kg: 1000,

  // Объем -> Миллилитры
  ml: 1,
  l: 1000,

  // Штуки -> Штуки
  pcs: 1,
  tens: 10,
}

/**
 * Calculates the price per base unit from purchase data
 *
 * @param price - Purchase price
 * @param amount - Purchase amount
 * @param unit - Purchase unit ('kg', 'g', 'l', 'ml', 'pcs', 'tens')
 * @returns Price per base unit (₽/g, ₽/ml, or ₽/pcs)
 *
 * @example
 * // Мука: 120₽ за 2кг → 0.06₽/г
 * calculateBasePrice(120, 2, 'kg') // returns 0.06
 *
 * @example
 * // Яйца: 90₽ за десяток → 9₽/шт
 * calculateBasePrice(90, 1, 'tens') // returns 9
 */
export function calculateBasePrice(
  price: number,
  amount: number,
  unit: string
): number {
  // Validation
  if (price < 0) {
    throw new Error('Price must be a positive number')
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  if (!CONVERSION_RATES[unit]) {
    throw new Error(`Invalid unit: ${unit}`)
  }

  const multiplier = CONVERSION_RATES[unit]
  const totalBaseUnits = amount * multiplier

  return price / totalBaseUnits
}

/**
 * Converts an amount from any unit to its base unit
 *
 * @param amount - Amount to convert
 * @param unit - Source unit
 * @returns Amount in base units
 *
 * @example
 * convertToBaseUnit(2.5, 'kg') // returns 2500 (grams)
 *
 * @example
 * convertToBaseUnit(1.5, 'l') // returns 1500 (ml)
 */
export function convertToBaseUnit(amount: number, unit: string): number {
  if (!CONVERSION_RATES[unit]) {
    throw new Error(`Invalid unit: ${unit}`)
  }

  return amount * CONVERSION_RATES[unit]
}

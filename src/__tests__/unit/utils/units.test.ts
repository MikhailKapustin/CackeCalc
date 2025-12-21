import { describe, it, expect } from 'vitest'
import { calculateBasePrice, convertToBaseUnit, CONVERSION_RATES } from '@/utils/units'

describe('Units Conversion', () => {
  describe('CONVERSION_RATES', () => {
    it('should have correct conversion rates for weight', () => {
      expect(CONVERSION_RATES.g).toBe(1)
      expect(CONVERSION_RATES.kg).toBe(1000)
    })

    it('should have correct conversion rates for volume', () => {
      expect(CONVERSION_RATES.ml).toBe(1)
      expect(CONVERSION_RATES.l).toBe(1000)
    })

    it('should have correct conversion rates for count', () => {
      expect(CONVERSION_RATES.pcs).toBe(1)
      expect(CONVERSION_RATES.tens).toBe(10)
    })
  })

  describe('calculateBasePrice', () => {
    it('should calculate price per gram for flour', () => {
      // Мука: 120₽ за 2кг
      const result = calculateBasePrice(120, 2, 'kg')
      expect(result).toBe(0.06) // 120 / (2 * 1000) = 0.06₽/г
    })

    it('should calculate price per piece for eggs', () => {
      // Яйца: 90₽ за десяток
      const result = calculateBasePrice(90, 1, 'tens')
      expect(result).toBe(9) // 90 / (1 * 10) = 9₽/шт
    })

    it('should calculate price per ml for vanilla', () => {
      // Ваниль: 500₽ за 50мл
      const result = calculateBasePrice(500, 50, 'ml')
      expect(result).toBe(10) // 500 / (50 * 1) = 10₽/мл
    })

    it('should handle edge case: 1 gram package', () => {
      const result = calculateBasePrice(5, 1, 'g')
      expect(result).toBe(5)
    })

    it('should throw error for invalid unit', () => {
      expect(() => calculateBasePrice(100, 1, 'invalid')).toThrow()
    })

    it('should handle zero amount gracefully', () => {
      expect(() => calculateBasePrice(100, 0, 'kg')).toThrow()
    })

    it('should handle negative price gracefully', () => {
      expect(() => calculateBasePrice(-100, 2, 'kg')).toThrow()
    })
  })

  describe('convertToBaseUnit', () => {
    it('should convert kg to grams', () => {
      expect(convertToBaseUnit(2.5, 'kg')).toBe(2500)
    })

    it('should convert liters to ml', () => {
      expect(convertToBaseUnit(1.5, 'l')).toBe(1500)
    })

    it('should not convert base units', () => {
      expect(convertToBaseUnit(100, 'g')).toBe(100)
      expect(convertToBaseUnit(50, 'ml')).toBe(50)
      expect(convertToBaseUnit(5, 'pcs')).toBe(5)
    })

    it('should convert tens to pieces', () => {
      expect(convertToBaseUnit(2, 'tens')).toBe(20)
    })

    it('should throw error for invalid unit', () => {
      expect(() => convertToBaseUnit(100, 'invalid')).toThrow()
    })

    it('should handle decimal amounts', () => {
      expect(convertToBaseUnit(0.5, 'kg')).toBe(500)
      expect(convertToBaseUnit(0.25, 'l')).toBe(250)
    })
  })
})

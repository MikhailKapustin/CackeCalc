import { describe, it, expect } from 'vitest'
import { generateReceiptText, calculateOrderTotal } from '@/utils/receiptGenerator'

describe('Receipt Generator', () => {
  describe('calculateOrderTotal', () => {
    it('should calculate total for kg-based recipe', () => {
      const recipe = {
        name: 'Торт Наполеон',
        sellingPrice: 2000,
        sellingUnit: 'kg' as const
      }

      const total = calculateOrderTotal(recipe, 2.5)

      expect(total).toBe(5000) // 2000₽/кг × 2.5кг
    })

    it('should calculate total for piece-based recipe', () => {
      const recipe = {
        name: 'Капкейк',
        sellingPrice: 150,
        sellingUnit: 'pcs' as const
      }

      const total = calculateOrderTotal(recipe, 10)

      expect(total).toBe(1500) // 150₽/шт × 10шт
    })

    it('should handle decimal weights', () => {
      const recipe = {
        name: 'Торт',
        sellingPrice: 1800,
        sellingUnit: 'kg' as const
      }

      const total = calculateOrderTotal(recipe, 1.5)

      expect(total).toBe(2700)
    })
  })

  describe('generateReceiptText', () => {
    it('should generate formatted receipt text', () => {
      const receipt = {
        recipeName: 'Торт Сникерс',
        weight: 2.5,
        pricePerUnit: 1800,
        unit: 'кг',
        total: 4500,
        currency: '₽'
      }

      const text = generateReceiptText(receipt)

      expect(text).toContain('🍰 Ваш расчет заказа')
      expect(text).toContain('Торт: Торт Сникерс')
      expect(text).toContain('Вес: 2.5 кг')
      expect(text).toContain('Цена за кг: 1 800.00 ₽')
      expect(text).toContain('💰 ИТОГО: 4 500.00 ₽')
      expect(text).toContain('Посчитано в приложении CakeCost')
    })

    it('should format large numbers with spaces', () => {
      const receipt = {
        recipeName: 'Торт',
        weight: 5,
        pricePerUnit: 2000,
        unit: 'кг',
        total: 10000,
        currency: '₽'
      }

      const text = generateReceiptText(receipt)

      expect(text).toContain('10 000.00 ₽')
    })

    it('should handle piece-based orders', () => {
      const receipt = {
        recipeName: 'Капкейк',
        weight: 12,
        pricePerUnit: 150,
        unit: 'шт',
        total: 1800,
        currency: '₽'
      }

      const text = generateReceiptText(receipt)

      expect(text).toContain('Количество: 12 шт')
      expect(text).toContain('Цена за шт: 150.00 ₽')
    })
  })
})

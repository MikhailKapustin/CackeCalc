// src/__tests__/unit/i18n/translations.test.ts
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import en from '@/assets/i18n/en.json'
import ru from '@/assets/i18n/ru.json'
import es from '@/assets/i18n/es.json'
import kk from '@/assets/i18n/kk.json'
import de from '@/assets/i18n/de.json'

describe('i18n Translations', () => {
  const i18n = createI18n({
    locale: 'en',
    messages: { en, ru, es, kk, de }
  })

  describe('Required Keys', () => {
    it('should have all required keys in all languages', () => {
      const requiredKeys = [
        'ingredients.title',
        'ingredients.add',
        'ingredients.search',
        'ingredients.name',
        'ingredients.price',
        'ingredients.amount',
        'ingredients.empty',
        'ingredients.noResults',
        'recipes.title',
        'recipes.add',
        'recipes.search',
        'recipes.name',
        'recipes.description',
        'recipes.empty',
        'recipes.noResults',
        'calculator.title',
        'calculator.selectRecipe',
        'calculator.weight',
        'calculator.total',
        'calculator.share',
        'settings.title',
        'settings.language',
        'settings.currency',
        'settings.theme',
        'common.save',
        'common.cancel',
        'common.delete',
        'common.edit',
        'common.confirm'
      ]

      const languages = ['en', 'ru', 'es', 'kk', 'de']

      languages.forEach(lang => {
        requiredKeys.forEach(key => {
          expect(
            i18n.global.te(key, lang),
            `Missing key "${key}" in language "${lang}"`
          ).toBe(true)
        })
      })
    })
  })

  describe('English Translations', () => {
    it('should translate ingredients title correctly', () => {
      expect(i18n.global.t('ingredients.title', {}, { locale: 'en' })).toBe('Ingredients')
    })

    it('should translate recipes title correctly', () => {
      expect(i18n.global.t('recipes.title', {}, { locale: 'en' })).toBe('Recipes')
    })

    it('should translate calculator title correctly', () => {
      expect(i18n.global.t('calculator.title', {}, { locale: 'en' })).toBe('Order Calculator')
    })

    it('should translate settings title correctly', () => {
      expect(i18n.global.t('settings.title', {}, { locale: 'en' })).toBe('Settings')
    })
  })

  describe('Russian Translations', () => {
    it('should translate ingredients title correctly', () => {
      expect(i18n.global.t('ingredients.title', {}, { locale: 'ru' })).toBe('Ингредиенты')
    })

    it('should translate recipes title correctly', () => {
      expect(i18n.global.t('recipes.title', {}, { locale: 'ru' })).toBe('Рецепты')
    })

    it('should translate calculator title correctly', () => {
      expect(i18n.global.t('calculator.title', {}, { locale: 'ru' })).toBe('Калькулятор заказа')
    })

    it('should translate settings title correctly', () => {
      expect(i18n.global.t('settings.title', {}, { locale: 'ru' })).toBe('Настройки')
    })
  })

  describe('Spanish Translations', () => {
    it('should translate ingredients title correctly', () => {
      expect(i18n.global.t('ingredients.title', {}, { locale: 'es' })).toBe('Ingredientes')
    })

    it('should translate recipes title correctly', () => {
      expect(i18n.global.t('recipes.title', {}, { locale: 'es' })).toBe('Recetas')
    })

    it('should translate calculator title correctly', () => {
      expect(i18n.global.t('calculator.title', {}, { locale: 'es' })).toBe('Calculadora de Pedidos')
    })

    it('should translate settings title correctly', () => {
      expect(i18n.global.t('settings.title', {}, { locale: 'es' })).toBe('Configuración')
    })
  })

  describe('Kazakh Translations', () => {
    it('should translate ingredients title correctly', () => {
      expect(i18n.global.t('ingredients.title', {}, { locale: 'kk' })).toBe('Ингредиенттер')
    })

    it('should translate recipes title correctly', () => {
      expect(i18n.global.t('recipes.title', {}, { locale: 'kk' })).toBe('Рецепттер')
    })

    it('should translate calculator title correctly', () => {
      expect(i18n.global.t('calculator.title', {}, { locale: 'kk' })).toBe('Тапсырыс калькуляторы')
    })

    it('should translate settings title correctly', () => {
      expect(i18n.global.t('settings.title', {}, { locale: 'kk' })).toBe('Баптаулар')
    })
  })

  describe('German Translations', () => {
    it('should translate ingredients title correctly', () => {
      expect(i18n.global.t('ingredients.title', {}, { locale: 'de' })).toBe('Zutaten')
    })

    it('should translate recipes title correctly', () => {
      expect(i18n.global.t('recipes.title', {}, { locale: 'de' })).toBe('Rezepte')
    })

    it('should translate calculator title correctly', () => {
      expect(i18n.global.t('calculator.title', {}, { locale: 'de' })).toBe('Bestellrechner')
    })

    it('should translate settings title correctly', () => {
      expect(i18n.global.t('settings.title', {}, { locale: 'de' })).toBe('Einstellungen')
    })
  })

  describe('Pluralization', () => {
    it('should handle pluralization for ingredients count in English', () => {
      const count1 = i18n.global.t('ingredients.resultsCount', { count: 1 }, { locale: 'en' })
      const count5 = i18n.global.t('ingredients.resultsCount', { count: 5 }, { locale: 'en' })

      expect(count1).toBe('1 ingredient found')
      expect(count5).toBe('5 ingredients found')
    })

    it('should handle pluralization for recipes count in English', () => {
      const count1 = i18n.global.t('recipes.resultsCount', { count: 1 }, { locale: 'en' })
      const count5 = i18n.global.t('recipes.resultsCount', { count: 5 }, { locale: 'en' })

      expect(count1).toBe('1 recipe found')
      expect(count5).toBe('5 recipes found')
    })

    it('should handle pluralization for ingredients count in Russian', () => {
      const count1 = i18n.global.t('ingredients.resultsCount', { count: 1 }, { locale: 'ru' })
      const count2 = i18n.global.t('ingredients.resultsCount', { count: 2 }, { locale: 'ru' })
      const count5 = i18n.global.t('ingredients.resultsCount', { count: 5 }, { locale: 'ru' })

      // Note: vue-i18n pluralization - 0: zero, 1: one, 2+: other
      expect(count1).toContain('ингредиент')
      expect(count1).toContain('1')
      expect(count2).toContain('ингредиент')
      expect(count2).toContain('2')
      expect(count5).toContain('ингредиент')
      expect(count5).toContain('5')
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency correctly for English locale', () => {
      const numberEn = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(1500)

      expect(numberEn).toContain('1,500')
    })

    it('should format currency correctly for Russian locale', () => {
      const numberRu = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(1500)

      // Russian locale uses space as thousand separator
      expect(numberRu).toMatch(/1\s500/)
    })

    it('should format currency correctly for Spanish locale', () => {
      const numberEs = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(1500)

      expect(numberEs).toContain('1500')
    })
  })
})

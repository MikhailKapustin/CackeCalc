# CakeCost - TDD Roadmap

## Оглавление
1. [Введение в TDD подход](#введение-в-tdd-подход)
2. [Фаза 0: Подготовка и настройка](#фаза-0-подготовка-и-настройка)
3. [Фаза 1: Основа приложения (Core Foundation)](#фаза-1-основа-приложения)
4. [Фаза 2: Модуль ингредиентов](#фаза-2-модуль-ингредиентов)
5. [Фаза 3: Модуль рецептов](#фаза-3-модуль-рецептов)
6. [Фаза 4: Калькулятор заказов](#фаза-4-калькулятор-заказов)
7. [Фаза 5: Локализация](#фаза-5-локализация)
8. [Фаза 6: Монетизация и безопасность](#фаза-6-монетизация-и-безопасность)
9. [Фаза 7: Экспорт/Импорт данных](#фаза-7-экспортимпорт-данных)
10. [Фаза 8: Полировка и релиз](#фаза-8-полировка-и-релиз)

---

## Введение в TDD подход

### Цикл TDD (Red-Green-Refactor)

```
1. RED    → Напишите тест, который падает
2. GREEN  → Напишите минимальный код для прохождения теста
3. REFACTOR → Улучшите код, сохраняя прохождение тестов
```

### Принципы TDD для этого проекта

- **Тесты пишутся ДО реализации**
- **Один тест → одна функциональность**
- **Тесты должны быть независимыми**
- **Используем Vitest для unit/integration тестов**
- **Используем @vue/test-utils для тестирования компонентов**
- **E2E тесты (опционально) через Playwright**

### Типы тестов

1. **Unit тесты** - функции, утилиты, геттеры Pinia
2. **Component тесты** - компоненты Vue
3. **Integration тесты** - Pinia stores + SQLite
4. **E2E тесты** - критические пользовательские сценарии

---

## Фаза 0: Подготовка и настройка

**Длительность:** 3-5 дней

### 0.1 Инициализация проекта

#### Задачи:
- [ ] Создать проект Quasar с TypeScript
  ```bash
  npm create quasar
  # Выбрать: App with Quasar CLI, Quasar v2, TypeScript
  ```
- [ ] Настроить Capacitor
  ```bash
  quasar mode add capacitor
  ```
- [ ] Настроить Vitest
  ```bash
  npm install -D vitest @vue/test-utils @vitest/ui jsdom
  ```

#### Конфигурация Vitest:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar } from '@quasar/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    quasar({
      autoImportComponentCase: 'pascal'
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/']
    }
  }
})
```

#### Структура проекта:

```
src/
├── __tests__/              # Тесты
│   ├── unit/              # Unit тесты
│   ├── components/        # Component тесты
│   └── integration/       # Integration тесты
├── components/
├── stores/
├── database/
├── utils/
├── pages/
└── router/
```

### 0.2 Настройка базы данных SQLite

#### Задачи:
- [ ] Установить @capacitor-community/sqlite
- [ ] Создать schema.ts с определением таблиц
- [ ] Написать тесты для миграций

#### TDD: Тесты для схемы БД

```typescript
// src/__tests__/integration/database/schema.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase, runMigrations } from '@/database/schema'

describe('Database Schema', () => {
  let db: any

  beforeEach(async () => {
    db = await createDatabase(':memory:')
  })

  it('should create ingredients table', async () => {
    await runMigrations(db)

    const result = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ingredients'"
    )

    expect(result.values).toHaveLength(1)
  })

  it('should create recipes table with correct schema', async () => {
    await runMigrations(db)

    const result = await db.query('PRAGMA table_info(recipes)')
    const columns = result.values.map(col => col.name)

    expect(columns).toContain('id')
    expect(columns).toContain('name')
    expect(columns).toContain('total_cost')
    expect(columns).toContain('selling_price')
  })

  it('should create recipe_items table with foreign keys', async () => {
    await runMigrations(db)

    const result = await db.query('PRAGMA foreign_key_list(recipe_items)')

    expect(result.values).toHaveLength(2) // recipe_id и ingredient_id
  })
})
```

---

## Фаза 1: Основа приложения

**Длительность:** 1 неделя

### 1.1 Утилиты для конвертации единиц измерения

#### TDD: Тесты СНАЧАЛА

```typescript
// src/__tests__/unit/utils/units.test.ts
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
    })
  })
})
```

#### Реализация (ПОСЛЕ тестов)

```typescript
// src/utils/units.ts
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

export function calculateBasePrice(
  price: number,
  amount: number,
  unit: string
): number {
  if (!CONVERSION_RATES[unit]) {
    throw new Error(`Invalid unit: ${unit}`)
  }

  const multiplier = CONVERSION_RATES[unit]
  const totalBaseUnits = amount * multiplier

  return price / totalBaseUnits
}

export function convertToBaseUnit(amount: number, unit: string): number {
  if (!CONVERSION_RATES[unit]) {
    throw new Error(`Invalid unit: ${unit}`)
  }

  return amount * CONVERSION_RATES[unit]
}
```

### 1.2 Навигация и темы

#### TDD: Тесты для theme store

```typescript
// src/__tests__/unit/stores/settings.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have default theme as light', () => {
    const store = useSettingsStore()
    expect(store.theme).toBe('light')
  })

  it('should toggle theme from light to dark', () => {
    const store = useSettingsStore()
    store.toggleTheme()
    expect(store.theme).toBe('dark')
  })

  it('should toggle theme from dark to light', () => {
    const store = useSettingsStore()
    store.theme = 'dark'
    store.toggleTheme()
    expect(store.theme).toBe('light')
  })

  it('should set specific theme', () => {
    const store = useSettingsStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('should handle auto theme based on system preference', () => {
    const store = useSettingsStore()
    store.setTheme('auto')
    expect(store.theme).toBe('auto')
  })
})
```

---

## Фаза 2: Модуль ингредиентов

**Длительность:** 1.5 недели

### 2.1 Pinia Store для ингредиентов

#### TDD: Тесты для Ingredients Store

```typescript
// src/__tests__/unit/stores/ingredients.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIngredientsStore } from '@/stores/ingredients'

describe('Ingredients Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('State', () => {
    it('should initialize with empty ingredients array', () => {
      const store = useIngredientsStore()
      expect(store.ingredients).toEqual([])
    })

    it('should initialize with empty search query', () => {
      const store = useIngredientsStore()
      expect(store.searchQuery).toBe('')
    })
  })

  describe('Getters', () => {
    it('should filter ingredients by search query', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 },
        { id: 3, name: 'Яйца', purchasePrice: 90, purchaseAmount: 1, purchaseUnit: 'tens', type: 'count', pricePerBaseUnit: 9 }
      ]

      store.searchQuery = 'мука'

      expect(store.filteredIngredients).toHaveLength(1)
      expect(store.filteredIngredients[0].name).toBe('Мука пшеничная')
    })

    it('should return all ingredients when search query is empty', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
      ]

      store.searchQuery = ''

      expect(store.filteredIngredients).toHaveLength(2)
    })

    it('should be case-insensitive when filtering', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
      ]

      store.searchQuery = 'МУКА'

      expect(store.filteredIngredients).toHaveLength(1)
    })

    it('should get ingredient by id', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
      ]

      const ingredient = store.getById(2)

      expect(ingredient).toBeDefined()
      expect(ingredient?.name).toBe('Сахар')
    })

    it('should return undefined for non-existent id', () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
      ]

      const ingredient = store.getById(999)

      expect(ingredient).toBeUndefined()
    })
  })

  describe('Actions', () => {
    it('should add new ingredient', async () => {
      const store = useIngredientsStore()

      await store.addIngredient({
        name: 'Мука',
        purchasePrice: 120,
        purchaseAmount: 2,
        purchaseUnit: 'kg',
        type: 'weight'
      })

      expect(store.ingredients).toHaveLength(1)
      expect(store.ingredients[0].name).toBe('Мука')
      expect(store.ingredients[0].pricePerBaseUnit).toBe(0.06)
    })

    it('should calculate pricePerBaseUnit when adding ingredient', async () => {
      const store = useIngredientsStore()

      await store.addIngredient({
        name: 'Яйца',
        purchasePrice: 90,
        purchaseAmount: 1,
        purchaseUnit: 'tens',
        type: 'count'
      })

      expect(store.ingredients[0].pricePerBaseUnit).toBe(9)
    })

    it('should update ingredient', async () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
      ]

      await store.updateIngredient(1, {
        purchasePrice: 150,
        purchaseAmount: 2,
        purchaseUnit: 'kg'
      })

      expect(store.ingredients[0].purchasePrice).toBe(150)
      expect(store.ingredients[0].pricePerBaseUnit).toBe(0.075)
    })

    it('should delete ingredient', async () => {
      const store = useIngredientsStore()
      store.ingredients = [
        { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
        { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
      ]

      await store.deleteIngredient(1)

      expect(store.ingredients).toHaveLength(1)
      expect(store.ingredients[0].id).toBe(2)
    })

    it('should load ingredients from database', async () => {
      const store = useIngredientsStore()
      // Mock database call
      vi.mock('@/database/db', () => ({
        query: vi.fn().mockResolvedValue({
          values: [
            { id: 1, name: 'Мука', purchase_price: 120, purchase_amount: 2, purchase_unit: 'kg', type: 'weight', price_per_base_unit: 0.06 }
          ]
        })
      }))

      await store.loadIngredients()

      expect(store.ingredients).toHaveLength(1)
    })
  })
})
```

### 2.2 Component тесты для IngredientForm

```typescript
// src/__tests__/components/ingredients/IngredientForm.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import IngredientForm from '@/components/ingredients/IngredientForm.vue'

describe('IngredientForm', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(IngredientForm, {
      global: {
        plugins: [createPinia(), Quasar]
      }
    })
  })

  it('should render all form fields', () => {
    expect(wrapper.find('[data-test="ingredient-name"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-price"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-amount"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-unit"]').exists()).toBe(true)
  })

  it('should validate required name field', async () => {
    const nameInput = wrapper.find('[data-test="ingredient-name"]')

    await nameInput.setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Название обязательно')
  })

  it('should validate price as positive number', async () => {
    const priceInput = wrapper.find('[data-test="purchase-price"]')

    await priceInput.setValue(-10)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Цена должна быть положительным числом')
  })

  it('should emit save event with correct data', async () => {
    await wrapper.find('[data-test="ingredient-name"]').setValue('Мука')
    await wrapper.find('[data-test="purchase-price"]').setValue('120')
    await wrapper.find('[data-test="purchase-amount"]').setValue('2')
    await wrapper.find('[data-test="purchase-unit"]').setValue('kg')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual({
      name: 'Мука',
      purchasePrice: 120,
      purchaseAmount: 2,
      purchaseUnit: 'kg',
      type: 'weight'
    })
  })

  it('should calculate and display price per base unit', async () => {
    await wrapper.find('[data-test="purchase-price"]').setValue('120')
    await wrapper.find('[data-test="purchase-amount"]').setValue('2')
    await wrapper.find('[data-test="purchase-unit"]').setValue('kg')

    expect(wrapper.find('[data-test="price-per-unit"]').text()).toContain('0.06')
  })

  it('should prefill form when editing existing ingredient', async () => {
    const ingredient = {
      id: 1,
      name: 'Мука',
      purchasePrice: 120,
      purchaseAmount: 2,
      purchaseUnit: 'kg',
      type: 'weight',
      pricePerBaseUnit: 0.06
    }

    wrapper = mount(IngredientForm, {
      props: { ingredient, mode: 'edit' },
      global: {
        plugins: [createPinia(), Quasar]
      }
    })

    expect(wrapper.find('[data-test="ingredient-name"]').element.value).toBe('Мука')
    expect(wrapper.find('[data-test="purchase-price"]').element.value).toBe('120')
  })
})
```

### 2.3 Component тесты для IngredientList

```typescript
// src/__tests__/components/ingredients/IngredientList.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import IngredientList from '@/components/ingredients/IngredientList.vue'
import { useIngredientsStore } from '@/stores/ingredients'

describe('IngredientList', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useIngredientsStore()

    wrapper = mount(IngredientList, {
      global: {
        plugins: [Quasar]
      }
    })
  })

  it('should display empty state when no ingredients', () => {
    expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Добавьте первый ингредиент')
  })

  it('should display ingredients list', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('[data-test="ingredient-item"]')
    expect(items).toHaveLength(2)
  })

  it('should filter ingredients when searching', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('мука')
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('[data-test="ingredient-item"]')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('Мука пшеничная')
  })

  it('should display no results message when search has no matches', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('несуществующий')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="no-results"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ничего не найдено по запросу')
  })

  it('should emit edit event when edit button clicked', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    await wrapper.vm.$nextTick()

    await wrapper.find('[data-test="edit-button"]').trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toBe(1)
  })

  it('should confirm before deleting ingredient', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('[data-test="delete-button"]')
    await deleteButton.trigger('click')

    // Проверяем что показался диалог подтверждения
    expect(wrapper.vm.showDeleteDialog).toBe(true)
  })

  it('should display count of found ingredients when searching', async () => {
    store.ingredients = [
      { id: 1, name: 'Мука пшеничная', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Мука ржаная', purchasePrice: 100, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.05 }
    ]

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('мука')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="results-count"]').text()).toContain('2 ингредиента найдено')
  })
})
```

### Контрольная точка Фазы 2

**Критерии завершения:**
- ✅ Все тесты для ingredients store проходят
- ✅ Все component тесты для форм и списков проходят
- ✅ Покрытие кода тестами > 80%
- ✅ Можно добавлять, редактировать, удалять ингредиенты
- ✅ Поиск по ингредиентам работает
- ✅ Цена за базовую единицу рассчитывается корректно

---

## Фаза 3: Модуль рецептов

**Длительность:** 2 недели

### 3.1 Pinia Store для рецептов с реактивным пересчетом

#### TDD: Тесты для Recipes Store

```typescript
// src/__tests__/unit/stores/recipes.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'

describe('Recipes Store', () => {
  let recipesStore: any
  let ingredientsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    recipesStore = useRecipesStore()
    ingredientsStore = useIngredientsStore()

    // Подготовка тестовых ингредиентов
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 },
      { id: 3, name: 'Яйца', purchasePrice: 90, purchaseAmount: 1, purchaseUnit: 'tens', type: 'count', pricePerBaseUnit: 9 }
    ]
  })

  describe('Getters - Recipe Cost Calculation', () => {
    it('should calculate recipe cost correctly', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт Наполеон',
        items: [
          { ingredientId: 1, amount: 500 },  // 500г муки × 0.06₽ = 30₽
          { ingredientId: 2, amount: 300 },  // 300г сахара × 0.08₽ = 24₽
          { ingredientId: 3, amount: 5 }     // 5 яиц × 9₽ = 45₽
        ],
        sellingPrice: 2500,
        sellingUnit: 'kg'
      }]

      const cost = recipesStore.getRecipeCost(recipesStore.recipes[0])

      expect(cost).toBe(99) // 30 + 24 + 45 = 99₽
    })

    it('should handle recipe with missing ingredient gracefully', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 },
          { ingredientId: 999, amount: 100 }  // Несуществующий ингредиент
        ],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      }]

      const cost = recipesStore.getRecipeCost(recipesStore.recipes[0])

      expect(cost).toBe(30) // Только мука
    })

    it('should recalculate cost when ingredient price changes', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 1000 }  // 1кг муки
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }]

      const costBefore = recipesStore.getRecipeCost(recipesStore.recipes[0])
      expect(costBefore).toBe(60) // 1000г × 0.06₽

      // Изменяем цену муки
      ingredientsStore.ingredients[0].purchasePrice = 150
      ingredientsStore.ingredients[0].pricePerBaseUnit = 0.075

      const costAfter = recipesStore.getRecipeCost(recipesStore.recipes[0])
      expect(costAfter).toBe(75) // 1000г × 0.075₽
    })
  })

  describe('Getters - Profit Calculation', () => {
    it('should calculate profit amount correctly', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 }  // Себестоимость: 30₽
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }]

      const profit = recipesStore.getRecipeProfit(recipesStore.recipes[0])

      expect(profit).toBe(1970) // 2000 - 30 = 1970₽
    })

    it('should calculate profit percent correctly', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 }  // Себестоимость: 30₽
        ],
        sellingPrice: 90,
        sellingUnit: 'kg'
      }]

      const profitPercent = recipesStore.getRecipeProfitPercent(recipesStore.recipes[0])

      expect(profitPercent).toBe(200) // ((90 - 30) / 30) * 100 = 200%
    })

    it('should return 0 profit percent when cost is 0', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      }]

      const profitPercent = recipesStore.getRecipeProfitPercent(recipesStore.recipes[0])

      expect(profitPercent).toBe(0)
    })

    it('should handle negative profit (selling below cost)', () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 1000 }  // Себестоимость: 60₽
        ],
        sellingPrice: 50,
        sellingUnit: 'kg'
      }]

      const profit = recipesStore.getRecipeProfit(recipesStore.recipes[0])
      const profitPercent = recipesStore.getRecipeProfitPercent(recipesStore.recipes[0])

      expect(profit).toBe(-10)
      expect(profitPercent).toBeLessThan(0)
    })
  })

  describe('Actions', () => {
    it('should add new recipe', async () => {
      await recipesStore.addRecipe({
        name: 'Торт Наполеон',
        description: 'Классический рецепт',
        items: [
          { ingredientId: 1, amount: 500 }
        ],
        sellingPrice: 2500,
        sellingUnit: 'kg'
      })

      expect(recipesStore.recipes).toHaveLength(1)
      expect(recipesStore.recipes[0].name).toBe('Торт Наполеон')
    })

    it('should update recipe items', async () => {
      recipesStore.recipes = [{
        id: 1,
        name: 'Торт',
        items: [
          { ingredientId: 1, amount: 500 }
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }]

      await recipesStore.updateRecipeItems(1, [
        { ingredientId: 1, amount: 600 },
        { ingredientId: 2, amount: 200 }
      ])

      expect(recipesStore.recipes[0].items).toHaveLength(2)
      expect(recipesStore.recipes[0].items[0].amount).toBe(600)
    })

    it('should delete recipe', async () => {
      recipesStore.recipes = [
        { id: 1, name: 'Торт 1', items: [], sellingPrice: 1000, sellingUnit: 'kg' },
        { id: 2, name: 'Торт 2', items: [], sellingPrice: 1500, sellingUnit: 'kg' }
      ]

      await recipesStore.deleteRecipe(1)

      expect(recipesStore.recipes).toHaveLength(1)
      expect(recipesStore.recipes[0].id).toBe(2)
    })
  })

  describe('Search', () => {
    beforeEach(() => {
      recipesStore.recipes = [
        { id: 1, name: 'Торт Наполеон', items: [], sellingPrice: 2500, sellingUnit: 'kg' },
        { id: 2, name: 'Торт Медовик', items: [], sellingPrice: 2000, sellingUnit: 'kg' },
        { id: 3, name: 'Пирог яблочный', items: [], sellingPrice: 1500, sellingUnit: 'kg' }
      ]
    })

    it('should filter recipes by name', () => {
      recipesStore.searchQuery = 'торт'

      expect(recipesStore.filteredRecipes).toHaveLength(2)
    })

    it('should be case-insensitive', () => {
      recipesStore.searchQuery = 'НАПОЛЕОН'

      expect(recipesStore.filteredRecipes).toHaveLength(1)
      expect(recipesStore.filteredRecipes[0].name).toBe('Торт Наполеон')
    })

    it('should return all recipes when search is empty', () => {
      recipesStore.searchQuery = ''

      expect(recipesStore.filteredRecipes).toHaveLength(3)
    })
  })
})
```

### 3.2 Integration тесты для реактивного пересчета

```typescript
// src/__tests__/integration/reactive-recalculation.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'

describe('Reactive Recipe Recalculation', () => {
  let recipesStore: any
  let ingredientsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    recipesStore = useRecipesStore()
    ingredientsStore = useIngredientsStore()
  })

  it('should automatically recalculate all affected recipes when ingredient price changes', async () => {
    // 1. Добавляем ингредиенты
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    // 2. Создаем рецепты, использующие этот ингредиент
    recipesStore.recipes = [
      {
        id: 1,
        name: 'Торт 1',
        items: [{ ingredientId: 1, amount: 1000 }],  // 1кг муки
        sellingPrice: 2000,
        sellingUnit: 'kg'
      },
      {
        id: 2,
        name: 'Торт 2',
        items: [{ ingredientId: 1, amount: 500 }],   // 500г муки
        sellingPrice: 1500,
        sellingUnit: 'kg'
      }
    ]

    // 3. Проверяем начальные значения
    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(60)  // 1000г × 0.06₽
    expect(recipesStore.getRecipeCost(recipesStore.recipes[1])).toBe(30)  // 500г × 0.06₽

    // 4. Изменяем цену ингредиента
    await ingredientsStore.updateIngredient(1, {
      purchasePrice: 180,  // Было 120₽, стало 180₽
      purchaseAmount: 2,
      purchaseUnit: 'kg'
    })

    // 5. Проверяем что все рецепты автоматически пересчитались
    expect(ingredientsStore.ingredients[0].pricePerBaseUnit).toBe(0.09)  // 180 / 2000 = 0.09₽/г
    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(90)  // 1000г × 0.09₽
    expect(recipesStore.getRecipeCost(recipesStore.recipes[1])).toBe(45)  // 500г × 0.09₽

    // 6. Проверяем что маржа тоже пересчиталась
    expect(recipesStore.getRecipeProfit(recipesStore.recipes[0])).toBe(1910)  // 2000 - 90
    expect(recipesStore.getRecipeProfit(recipesStore.recipes[1])).toBe(1455)  // 1500 - 45
  })

  it('should handle multiple ingredients in recipe', async () => {
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    recipesStore.recipes = [{
      id: 1,
      name: 'Торт',
      items: [
        { ingredientId: 1, amount: 500 },  // 30₽
        { ingredientId: 2, amount: 300 }   // 24₽
      ],
      sellingPrice: 2000,
      sellingUnit: 'kg'
    }]

    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(54)

    // Меняем цену только сахара
    await ingredientsStore.updateIngredient(2, {
      purchasePrice: 100,
      purchaseAmount: 1,
      purchaseUnit: 'kg'
    })

    expect(recipesStore.getRecipeCost(recipesStore.recipes[0])).toBe(60) // 30 (мука) + 30 (сахар новая цена)
  })

  it('should handle deletion of ingredient used in recipes', async () => {
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 }
    ]

    recipesStore.recipes = [{
      id: 1,
      name: 'Торт',
      items: [
        { ingredientId: 1, amount: 500 },
        { ingredientId: 2, amount: 300 }
      ],
      sellingPrice: 2000,
      sellingUnit: 'kg'
    }]

    // Удаляем сахар
    await ingredientsStore.deleteIngredient(2)

    // Рецепт должен пересчитаться без сахара
    const cost = recipesStore.getRecipeCost(recipesStore.recipes[0])
    expect(cost).toBe(30) // Только мука
  })
})
```

### Контрольная точка Фазы 3

**Критерии завершения:**
- ✅ Все тесты для recipes store проходят
- ✅ Реактивный пересчет работает корректно
- ✅ Покрытие кода тестами > 80%
- ✅ Можно создавать, редактировать, удалять рецепты
- ✅ Себестоимость и маржа рассчитываются автоматически
- ✅ Изменение цены ингредиента обновляет все связанные рецепты

---

## Фаза 4: Калькулятор заказов

**Длительность:** 1 неделя

### 4.1 Утилиты для генерации чека

#### TDD: Тесты для генератора чека

```typescript
// src/__tests__/unit/utils/receiptGenerator.test.ts
import { describe, it, expect } from 'vitest'
import { generateReceiptText, calculateOrderTotal } from '@/utils/receiptGenerator'

describe('Receipt Generator', () => {
  describe('calculateOrderTotal', () => {
    it('should calculate total for kg-based recipe', () => {
      const recipe = {
        name: 'Торт Наполеон',
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }

      const total = calculateOrderTotal(recipe, 2.5)

      expect(total).toBe(5000) // 2000₽/кг × 2.5кг
    })

    it('should calculate total for piece-based recipe', () => {
      const recipe = {
        name: 'Капкейк',
        sellingPrice: 150,
        sellingUnit: 'pcs'
      }

      const total = calculateOrderTotal(recipe, 10)

      expect(total).toBe(1500) // 150₽/шт × 10шт
    })

    it('should handle decimal weights', () => {
      const recipe = {
        name: 'Торт',
        sellingPrice: 1800,
        sellingUnit: 'kg'
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
      expect(text).toContain('Цена за кг: 1 800 ₽')
      expect(text).toContain('💰 ИТОГО: 4 500 ₽')
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

      expect(text).toContain('10 000 ₽')
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
      expect(text).toContain('Цена за шт: 150 ₽')
    })
  })
})
```

### 4.2 Component тесты для OrderCalculator

```typescript
// src/__tests__/components/calculator/OrderCalculator.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import OrderCalculator from '@/components/calculator/OrderCalculator.vue'
import { useRecipesStore } from '@/stores/recipes'

describe('OrderCalculator', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useRecipesStore()

    store.recipes = [
      {
        id: 1,
        name: 'Торт Наполеон',
        sellingPrice: 2000,
        sellingUnit: 'kg',
        totalCost: 500
      },
      {
        id: 2,
        name: 'Капкейк',
        sellingPrice: 150,
        sellingUnit: 'pcs',
        totalCost: 50
      }
    ]

    wrapper = mount(OrderCalculator, {
      global: {
        plugins: [Quasar]
      }
    })
  })

  it('should display recipe selector', () => {
    expect(wrapper.find('[data-test="recipe-select"]').exists()).toBe(true)
  })

  it('should display weight/quantity input', () => {
    expect(wrapper.find('[data-test="weight-input"]').exists()).toBe(true)
  })

  it('should calculate total price correctly', async () => {
    await wrapper.find('[data-test="recipe-select"]').setValue('1')
    await wrapper.find('[data-test="weight-input"]').setValue('2.5')

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('5 000')
  })

  it('should display profit for confectioner (not in receipt)', async () => {
    await wrapper.find('[data-test="recipe-select"]').setValue('1')
    await wrapper.find('[data-test="weight-input"]').setValue('2')

    // Прибыль: (2000 - 500) × 2 = 3000₽
    expect(wrapper.find('[data-test="profit"]').text()).toContain('3 000')
    expect(wrapper.find('[data-test="profit"]').classes()).toContain('text-caption')
  })

  it('should show share button when total is calculated', async () => {
    await wrapper.find('[data-test="recipe-select"]').setValue('1')
    await wrapper.find('[data-test="weight-input"]').setValue('2')

    expect(wrapper.find('[data-test="share-button"]').exists()).toBe(true)
  })

  it('should generate receipt text when share button clicked', async () => {
    const sharePlugin = { share: vi.fn() }

    await wrapper.find('[data-test="recipe-select"]').setValue('1')
    await wrapper.find('[data-test="weight-input"]').setValue('2.5')
    await wrapper.find('[data-test="share-button"]').trigger('click')

    expect(wrapper.emitted('share')).toBeTruthy()
  })

  it('should update total when weight changes', async () => {
    await wrapper.find('[data-test="recipe-select"]').setValue('1')
    await wrapper.find('[data-test="weight-input"]').setValue('2')

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('4 000')

    await wrapper.find('[data-test="weight-input"]').setValue('3')

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('6 000')
  })

  it('should handle piece-based recipes', async () => {
    await wrapper.find('[data-test="recipe-select"]').setValue('2')
    await wrapper.find('[data-test="weight-input"]').setValue('10')

    expect(wrapper.find('[data-test="total-price"]').text()).toContain('1 500')
    expect(wrapper.find('[data-test="unit-label"]').text()).toBe('шт')
  })

  it('should validate weight input as positive number', async () => {
    await wrapper.find('[data-test="recipe-select"]').setValue('1')
    await wrapper.find('[data-test="weight-input"]').setValue('-5')

    expect(wrapper.find('[data-test="error-message"]').exists()).toBe(true)
  })
})
```

### Контрольная точка Фазы 4

**Критерии завершения:**
- ✅ Все тесты для калькулятора проходят
- ✅ Расчет стоимости заказа работает корректно
- ✅ Генерация текстового чека функционирует
- ✅ Функция "Поделиться" интегрирована
- ✅ Отображение прибыли только для кондитера

---

## Фаза 5: Локализация

**Длительность:** 1 неделя (первая волна)

### 5.1 Настройка vue-i18n

#### TDD: Тесты для локализации

```typescript
// src/__tests__/unit/i18n/translations.test.ts
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import en from '@/assets/i18n/en.json'
import ru from '@/assets/i18n/ru.json'
import es from '@/assets/i18n/es.json'
import kk from '@/assets/i18n/kk.json'

describe('i18n Translations', () => {
  const i18n = createI18n({
    locale: 'en',
    messages: { en, ru, es, kk }
  })

  it('should have all required keys in all languages', () => {
    const requiredKeys = [
      'ingredients.title',
      'ingredients.add',
      'ingredients.search',
      'recipes.title',
      'recipes.add',
      'calculator.title',
      'settings.title'
    ]

    const languages = ['en', 'ru', 'es', 'kk']

    languages.forEach(lang => {
      requiredKeys.forEach(key => {
        expect(i18n.global.te(key, lang)).toBe(true)
      })
    })
  })

  it('should translate ingredients title correctly', () => {
    expect(i18n.global.t('ingredients.title', {}, { locale: 'en' })).toBe('Ingredients')
    expect(i18n.global.t('ingredients.title', {}, { locale: 'ru' })).toBe('Ингредиенты')
    expect(i18n.global.t('ingredients.title', {}, { locale: 'es' })).toBe('Ingredientes')
  })

  it('should handle pluralization', () => {
    const count1 = i18n.global.t('ingredients.resultsCount', { count: 1 }, { locale: 'en' })
    const count5 = i18n.global.t('ingredients.resultsCount', { count: 5 }, { locale: 'en' })

    expect(count1).toBe('1 ingredient found')
    expect(count5).toBe('5 ingredients found')
  })

  it('should format currency correctly for different locales', () => {
    const numberEn = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(1500)

    const numberRu = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(1500)

    expect(numberEn).toContain('1,500')
    expect(numberRu).toContain('1 500')
  })
})
```

### 5.2 Component тесты с локализацией

```typescript
// src/__tests__/components/IngredientList.i18n.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import IngredientList from '@/components/ingredients/IngredientList.vue'
import en from '@/assets/i18n/en.json'
import ru from '@/assets/i18n/ru.json'

describe('IngredientList i18n', () => {
  const createWrapper = (locale: string) => {
    const i18n = createI18n({
      locale,
      messages: { en, ru }
    })

    return mount(IngredientList, {
      global: {
        plugins: [createPinia(), Quasar, i18n]
      }
    })
  }

  it('should display English text when locale is en', () => {
    const wrapper = createWrapper('en')

    expect(wrapper.text()).toContain('Add your first ingredient')
  })

  it('should display Russian text when locale is ru', () => {
    const wrapper = createWrapper('ru')

    expect(wrapper.text()).toContain('Добавьте первый ингредиент')
  })

  it('should switch language dynamically', async () => {
    const wrapper = createWrapper('en')

    expect(wrapper.text()).toContain('Ingredients')

    wrapper.vm.$i18n.locale = 'ru'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Ингредиенты')
  })
})
```

### Контрольная точка Фазы 5

**Критерии завершения:**
- ✅ vue-i18n настроен и работает
- ✅ Переводы для 4 языков (EN, RU, ES, KK)
- ✅ Все UI элементы локализованы
- ✅ Тесты для переводов проходят
- ✅ Автоопределение языка по системной локали

---

## Фаза 6: Монетизация и безопасность

**Длительность:** 2-3 недели

### 6.1 Secure Storage для Pro статуса

#### TDD: Тесты для Secure Storage

```typescript
// src/__tests__/unit/utils/secureStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveProStatus, getProStatus, initializeProStatus } from '@/utils/secureStorage'

// Mock Capacitor Secure Storage
vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStoragePlugin: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}))

describe('Secure Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save Pro status to secure storage', async () => {
    const status = {
      isPro: true,
      purchaseDate: '2025-01-15T10:00:00Z',
      productId: 'cakecost_pro'
    }

    await saveProStatus(status)

    expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
      key: 'cakecost_pro_status',
      value: JSON.stringify(status)
    })
  })

  it('should retrieve Pro status from secure storage', async () => {
    const mockStatus = {
      isPro: true,
      purchaseDate: '2025-01-15T10:00:00Z'
    }

    SecureStoragePlugin.get.mockResolvedValue({
      value: JSON.stringify(mockStatus)
    })

    const isPro = await getProStatus()

    expect(isPro).toBe(true)
  })

  it('should return false when Pro status not found', async () => {
    SecureStoragePlugin.get.mockRejectedValue(new Error('Key not found'))

    const isPro = await getProStatus()

    expect(isPro).toBe(false)
  })

  it('should verify Pro status with IAP on initialization', async () => {
    // Mock In-App Purchase
    const InAppPurchase = {
      restorePurchases: vi.fn().mockResolvedValue([
        { productId: 'cakecost_pro' }
      ])
    }

    await initializeProStatus()

    // Должно проверить покупку и сохранить статус
    expect(SecureStoragePlugin.set).toHaveBeenCalled()
  })
})
```

### 6.2 RASP Integration

#### TDD: Тесты для RASP

```typescript
// src/__tests__/unit/stores/security.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecurityStore } from '@/stores/security'

describe('Security Store - RASP', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with safe state', () => {
    const store = useSecurityStore()

    expect(store.isDeviceCompromised).toBe(false)
    expect(store.detectedThreats).toEqual([])
  })

  it('should mark device as compromised when root detected', () => {
    const store = useSecurityStore()

    store.handleThreatDetected('root')

    expect(store.isDeviceCompromised).toBe(true)
    expect(store.detectedThreats).toContain('root')
  })

  it('should mark device as compromised when tampering detected', () => {
    const store = useSecurityStore()

    store.handleThreatDetected('tampering')

    expect(store.isDeviceCompromised).toBe(true)
    expect(store.detectedThreats).toContain('tampering')
  })

  it('should not mark device as compromised for non-critical threats', () => {
    const store = useSecurityStore()

    store.handleThreatDetected('adb')

    expect(store.isDeviceCompromised).toBe(false)
    expect(store.detectedThreats).toContain('adb')
  })

  it('should block Pro features when device is compromised', () => {
    const store = useSecurityStore()
    const settingsStore = useSettingsStore()

    settingsStore.isPro = true
    store.isDeviceCompromised = true

    const canAccessPro = store.canAccessProFeatures

    expect(canAccessPro).toBe(false)
  })
})
```

### 6.3 Free версия - ограничения

#### TDD: Тесты для лимитов Free версии

```typescript
// src/__tests__/unit/stores/recipes.limits.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'

describe('Free Version Limits', () => {
  let recipesStore: any
  let settingsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    recipesStore = useRecipesStore()
    settingsStore = useSettingsStore()
  })

  it('should allow adding up to 5 recipes in free version', async () => {
    settingsStore.isPro = false

    for (let i = 1; i <= 5; i++) {
      const result = await recipesStore.addRecipe({
        name: `Торт ${i}`,
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(result.success).toBe(true)
    }

    expect(recipesStore.recipes).toHaveLength(5)
  })

  it('should block adding 6th recipe in free version', async () => {
    settingsStore.isPro = false

    // Добавляем 5 рецептов
    for (let i = 1; i <= 5; i++) {
      await recipesStore.addRecipe({
        name: `Торт ${i}`,
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })
    }

    // Попытка добавить 6-й
    const result = await recipesStore.addRecipe({
      name: 'Торт 6',
      items: [],
      sellingPrice: 1000,
      sellingUnit: 'kg'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('free_limit_reached')
    expect(recipesStore.recipes).toHaveLength(5)
  })

  it('should allow unlimited recipes in Pro version', async () => {
    settingsStore.isPro = true

    for (let i = 1; i <= 10; i++) {
      const result = await recipesStore.addRecipe({
        name: `Торт ${i}`,
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })

      expect(result.success).toBe(true)
    }

    expect(recipesStore.recipes).toHaveLength(10)
  })

  it('should show paywall when limit reached', async () => {
    settingsStore.isPro = false

    for (let i = 1; i <= 5; i++) {
      await recipesStore.addRecipe({
        name: `Торт ${i}`,
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      })
    }

    const result = await recipesStore.addRecipe({
      name: 'Торт 6',
      items: [],
      sellingPrice: 1000,
      sellingUnit: 'kg'
    })

    expect(result.showPaywall).toBe(true)
  })
})
```

### Контрольная точка Фазы 6

**Критерии завершения:**
- ✅ Secure Storage интегрирован и протестирован
- ✅ RASP защита работает
- ✅ Лимиты Free версии реализованы
- ✅ In-App Purchase интегрирован
- ✅ Все тесты безопасности проходят

---

## Фаза 7: Экспорт/Импорт данных

**Длительность:** 1 неделя

### 7.1 Экспорт данных

#### TDD: Тесты для экспорта

```typescript
// src/__tests__/unit/utils/exportData.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportData } from '@/utils/exportData'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import { useSettingsStore } from '@/stores/settings'

describe('Export Data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should export all data to JSON', async () => {
    const ingredientsStore = useIngredientsStore()
    const recipesStore = useRecipesStore()
    const settingsStore = useSettingsStore()

    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 }
    ]

    recipesStore.recipes = [
      {
        id: 1,
        name: 'Торт',
        items: [{ ingredientId: 1, amount: 500 }],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      }
    ]

    settingsStore.isPro = false

    const exportedData = await exportData()

    expect(exportedData.version).toBe('1.0')
    expect(exportedData.exportedBy).toBe('free')
    expect(exportedData.data.ingredients).toHaveLength(1)
    expect(exportedData.data.recipes).toHaveLength(1)
  })

  it('should NOT include isPro flag in export', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = true

    const exportedData = await exportData()

    expect(exportedData.data.settings).not.toHaveProperty('isPro')
  })

  it('should include receipt settings for Pro users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = true
    settingsStore.receiptBgColor = '#FFE5E5'
    settingsStore.receiptBusinessName = 'Sweet Dreams'

    const exportedData = await exportData()

    expect(exportedData.exportedBy).toBe('pro')
    expect(exportedData.data.receiptSettings).toBeDefined()
    expect(exportedData.data.receiptSettings.bgColor).toBe('#FFE5E5')
  })

  it('should NOT include receipt settings for Free users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = false

    const exportedData = await exportData()

    expect(exportedData.data.receiptSettings).toBeUndefined()
  })

  it('should encode logo to base64 for Pro users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = true
    settingsStore.receiptLogoPath = 'logos/my_logo.png'

    // Mock Filesystem
    vi.mock('@capacitor/filesystem', () => ({
      Filesystem: {
        readFile: vi.fn().mockResolvedValue({
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...'
        })
      }
    }))

    const exportedData = await exportData()

    expect(exportedData.data.receiptSettings.logo).toBeDefined()
    expect(exportedData.data.receiptSettings.logo.base64).toBeTruthy()
  })

  it('should generate filename with current date', async () => {
    const filename = generateExportFilename()

    expect(filename).toMatch(/^cakecost_backup_\d{4}-\d{2}-\d{2}\.json$/)
  })
})
```

### 7.2 Импорт данных с валидацией

#### TDD: Тесты для импорта

```typescript
// src/__tests__/unit/utils/importData.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { importData, validateImportData } from '@/utils/importData'
import { useSettingsStore } from '@/stores/settings'

describe('Import Data', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should validate import data structure', () => {
    const validData = {
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
  })

  it('should reject invalid JSON structure', () => {
    const invalidData = {
      version: '1.0'
      // Отсутствуют обязательные поля
    }

    const result = validateImportData(invalidData)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('Неверный формат файла')
  })

  it('should block import of >5 recipes for Free users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = false

    const importFileData = {
      version: '1.0',
      data: {
        ingredients: [],
        recipes: Array(6).fill({ name: 'Торт', items: [], sellingPrice: 1000 })
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

    const importFileData = {
      version: '1.0',
      data: {
        ingredients: Array(20).fill({ name: 'Ингредиент', purchasePrice: 100, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight' }),
        recipes: []
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

    const importFileData = {
      version: '1.0',
      data: {
        ingredients: Array(20).fill({ name: 'Ингредиент', purchasePrice: 100, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight' }),
        recipes: Array(10).fill({ name: 'Торт', items: [], sellingPrice: 1000 })
      }
    }

    const result = await importData(importFileData)

    expect(result.success).toBe(true)
  })

  it('should import receipt settings for Pro users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = true

    const importFileData = {
      version: '1.0',
      exportedBy: 'pro',
      data: {
        ingredients: [],
        recipes: [],
        settings: {},
        receiptSettings: {
          bgColor: '#FFE5E5',
          businessName: 'Sweet Dreams',
          logo: {
            base64: 'data:image/png;base64,iVBORw0KGgo...',
            filename: 'logo.png'
          }
        }
      }
    }

    const result = await importData(importFileData)

    expect(result.success).toBe(true)
    expect(settingsStore.receiptBgColor).toBe('#FFE5E5')
  })

  it('should NOT import receipt settings for Free users', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = false

    const importFileData = {
      version: '1.0',
      exportedBy: 'pro',
      data: {
        ingredients: [],
        recipes: [],
        settings: {},
        receiptSettings: {
          bgColor: '#FFE5E5'
        }
      }
    }

    await importData(importFileData)

    expect(settingsStore.receiptBgColor).toBeUndefined()
  })

  it('should decode base64 logo and save to filesystem', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = true

    const mockFilesystem = vi.fn()

    const importFileData = {
      version: '1.0',
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

    await importData(importFileData)

    expect(mockFilesystem).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('logo.png'),
        data: expect.any(String)
      })
    )
  })

  it('should NOT import isPro flag', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.isPro = false

    const importFileData = {
      version: '1.0',
      data: {
        ingredients: [],
        recipes: [],
        settings: {
          isPro: true  // Попытка импортировать Pro статус
        }
      }
    }

    await importData(importFileData)

    expect(settingsStore.isPro).toBe(false)
  })

  it('should restore purchases after import', async () => {
    const restorePurchases = vi.fn()

    await importData({
      version: '1.0',
      data: { ingredients: [], recipes: [], settings: {} }
    })

    expect(restorePurchases).toHaveBeenCalled()
  })
})
```

### Контрольная точка Фазы 7

**Критерии завершения:**
- ✅ Экспорт данных в JSON работает
- ✅ Импорт данных с валидацией реализован
- ✅ Лимиты Free версии при импорте работают
- ✅ Настройки чека экспортируются/импортируются для Pro
- ✅ isPro флаг НЕ экспортируется
- ✅ Все тесты экспорта/импорта проходят

---

## Фаза 8: Полировка и релиз

**Длительность:** 1-2 недели

### 8.1 E2E тесты (опционально)

```typescript
// e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  test('should create ingredient, recipe, and calculate order', async ({ page }) => {
    await page.goto('/')

    // 1. Добавить ингредиент
    await page.click('[data-test="nav-ingredients"]')
    await page.click('[data-test="add-ingredient-button"]')
    await page.fill('[data-test="ingredient-name"]', 'Мука пшеничная')
    await page.fill('[data-test="purchase-price"]', '120')
    await page.fill('[data-test="purchase-amount"]', '2')
    await page.selectOption('[data-test="purchase-unit"]', 'kg')
    await page.click('[data-test="save-button"]')

    await expect(page.locator('[data-test="ingredient-item"]')).toContainText('Мука пшеничная')

    // 2. Создать рецепт
    await page.click('[data-test="nav-recipes"]')
    await page.click('[data-test="add-recipe-button"]')
    await page.fill('[data-test="recipe-name"]', 'Торт Наполеон')
    await page.fill('[data-test="selling-price"]', '2500')
    await page.click('[data-test="add-ingredient-to-recipe"]')
    await page.selectOption('[data-test="ingredient-select"]', '1')
    await page.fill('[data-test="ingredient-amount"]', '500')
    await page.click('[data-test="save-recipe-button"]')

    await expect(page.locator('[data-test="recipe-item"]')).toContainText('Торт Наполеон')

    // 3. Рассчитать заказ
    await page.click('[data-test="nav-calculator"]')
    await page.selectOption('[data-test="recipe-select"]', '1')
    await page.fill('[data-test="weight-input"]', '2.5')

    await expect(page.locator('[data-test="total-price"]')).toContainText('6 250')
  })

  test('should update ingredient price and recalculate all recipes', async ({ page }) => {
    // Подготовка: создать ингредиент и рецепт
    // ...

    // Изменить цену ингредиента
    await page.click('[data-test="edit-ingredient-1"]')
    await page.fill('[data-test="purchase-price"]', '150')
    await page.click('[data-test="save-button"]')

    // Проверить что рецепт пересчитался
    await page.click('[data-test="nav-recipes"]')

    const newCost = await page.locator('[data-test="recipe-cost"]').textContent()
    expect(newCost).not.toBe('30 ₽')  // Старая себестоимость
  })

  test('Free user should see paywall when adding 6th recipe', async ({ page }) => {
    // Создать 5 рецептов
    for (let i = 1; i <= 5; i++) {
      await page.click('[data-test="add-recipe-button"]')
      await page.fill('[data-test="recipe-name"]', `Торт ${i}`)
      await page.fill('[data-test="selling-price"]', '1000')
      await page.click('[data-test="save-recipe-button"]')
    }

    // Попытка создать 6-й рецепт
    await page.click('[data-test="add-recipe-button"]')
    await page.fill('[data-test="recipe-name"]', 'Торт 6')
    await page.fill('[data-test="selling-price"]', '1000')
    await page.click('[data-test="save-recipe-button"]')

    // Должен показаться paywall
    await expect(page.locator('[data-test="paywall-dialog"]')).toBeVisible()
    await expect(page.locator('[data-test="paywall-message"]')).toContainText('5 рецептов')
  })
})
```

### 8.2 Покрытие тестами

**Целевые метрики:**
- Unit тесты: 85%+ покрытие
- Component тесты: 80%+ покрытие
- Integration тесты: критические потоки покрыты
- E2E тесты: основные пользовательские сценарии

**Проверка покрытия:**
```bash
npm run test:coverage
```

### 8.3 Performance тесты

```typescript
// src/__tests__/performance/recipe-calculation.test.ts
import { describe, it, expect } from 'vitest'
import { performance } from 'perf_hooks'
import { useRecipesStore } from '@/stores/recipes'

describe('Performance Tests', () => {
  it('should calculate 100 recipes in under 100ms', () => {
    const store = useRecipesStore()

    // Создать 100 рецептов
    for (let i = 0; i < 100; i++) {
      store.recipes.push({
        id: i,
        name: `Recipe ${i}`,
        items: [
          { ingredientId: 1, amount: 500 },
          { ingredientId: 2, amount: 300 }
        ],
        sellingPrice: 2000,
        sellingUnit: 'kg'
      })
    }

    const start = performance.now()

    // Рассчитать все рецепты
    store.recipes.forEach(recipe => {
      store.getRecipeCost(recipe)
    })

    const end = performance.now()
    const duration = end - start

    expect(duration).toBeLessThan(100)
  })

  it('should handle search on 1000 ingredients efficiently', () => {
    const store = useIngredientsStore()

    // Создать 1000 ингредиентов
    for (let i = 0; i < 1000; i++) {
      store.ingredients.push({
        id: i,
        name: `Ingredient ${i}`,
        purchasePrice: 100,
        purchaseAmount: 1,
        purchaseUnit: 'kg',
        type: 'weight',
        pricePerBaseUnit: 0.1
      })
    }

    const start = performance.now()

    store.searchQuery = 'Ingredient 5'
    const results = store.filteredIngredients

    const end = performance.now()
    const duration = end - start

    expect(duration).toBeLessThan(50)
    expect(results.length).toBeGreaterThan(0)
  })
})
```

### Контрольная точка Фазы 8

**Критерии завершения:**
- ✅ Все unit/component/integration тесты проходят
- ✅ Покрытие кода > 80%
- ✅ E2E тесты критических сценариев проходят
- ✅ Performance тесты показывают приемлемые результаты
- ✅ Приложение собирается без ошибок
- ✅ Готово к публикации в сторы

---

## Метрики и KPI проекта

### Code Coverage
- **Unit тесты:** 85%+
- **Component тесты:** 80%+
- **Integration тесты:** Все критические потоки

### Качество кода
- **ESLint:** 0 ошибок
- **TypeScript:** Strict mode, 0 ошибок
- **Vitest:** Все тесты проходят

### Performance
- **Расчет рецепта:** < 10ms
- **Поиск среди 1000 элементов:** < 50ms
- **Загрузка приложения:** < 2s

---

## Инструменты разработки

### Обязательные
- **Vitest** - основной test runner
- **@vue/test-utils** - тестирование Vue компонентов
- **@vitest/ui** - UI для просмотра тестов
- **@vitest/coverage-v8** - покрытие кода

### Опциональные
- **Playwright** - E2E тесты
- **MSW (Mock Service Worker)** - моки API
- **Faker.js** - генерация тестовых данных

---

## Скрипты package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

---

## Чеклист готовности к релизу

### Тесты
- [ ] Все unit тесты проходят
- [ ] Все component тесты проходят
- [ ] Все integration тесты проходят
- [ ] E2E тесты критических сценариев проходят
- [ ] Покрытие кода > 80%

### Функциональность
- [ ] Ингредиенты: CRUD + поиск
- [ ] Рецепты: CRUD + реактивный пересчет
- [ ] Калькулятор заказов работает
- [ ] Экспорт/импорт данных
- [ ] Локализация (4 языка)
- [ ] Монетизация (Free/Pro)
- [ ] Безопасность (Secure Storage + RASP)

### Качество
- [ ] Нет ESLint ошибок
- [ ] Нет TypeScript ошибок
- [ ] Performance тесты в норме
- [ ] Приложение собирается для iOS/Android

### Документация
- [ ] README.md обновлен
- [ ] Комментарии в коде
- [ ] Техническая документация

---

## Следующие шаги после релиза

1. **Сбор метрик:** Отслеживание Retention, Conversion, ARPU
2. **Вторая волна локализации:** Немецкий, Французский
3. **Третья волна:** Китайский
4. **Новые фичности:**
   - Генерация PDF чеков
   - Категории ингредиентов
   - История заказов
   - Статистика продаж

---

**Общая длительность проекта с TDD:** 12-16 недель

**Ключевое преимущество TDD:**
- Высокое качество кода
- Меньше багов в продакшене
- Уверенность при рефакторинге
- Живая документация через тесты

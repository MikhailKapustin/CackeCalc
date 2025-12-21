import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import RecipeForm from '@/components/recipes/RecipeForm.vue'
import { useIngredientsStore } from '@/stores/ingredients'

describe('RecipeForm', () => {
  let wrapper: any
  let ingredientsStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    ingredientsStore = useIngredientsStore()

    // Подготовка тестовых ингредиентов
    ingredientsStore.ingredients = [
      { id: 1, name: 'Мука', purchasePrice: 120, purchaseAmount: 2, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.06 },
      { id: 2, name: 'Сахар', purchasePrice: 80, purchaseAmount: 1, purchaseUnit: 'kg', type: 'weight', pricePerBaseUnit: 0.08 },
      { id: 3, name: 'Яйца', purchasePrice: 90, purchaseAmount: 1, purchaseUnit: 'tens', type: 'count', pricePerBaseUnit: 9 }
    ]

    wrapper = mount(RecipeForm, {
      global: {
        plugins: [createPinia(), Quasar]
      }
    })
  })

  describe('Form Fields', () => {
    it('should render all required form fields', () => {
      expect(wrapper.find('[data-test="recipe-name"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="recipe-description"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="selling-price"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="selling-unit"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="ingredients-section"]').exists()).toBe(true)
    })

    it('should validate required recipe name', async () => {
      await wrapper.find('[data-test="recipe-name"]').setValue('')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('Название обязательно')
    })

    it('should validate selling price as positive number', async () => {
      await wrapper.find('[data-test="selling-price"]').setValue('-100')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('Цена должна быть положительным числом')
    })

    it('should have default selling unit as kg', () => {
      const sellingUnitSelect = wrapper.find('[data-test="selling-unit"]')
      expect(sellingUnitSelect.element.value).toBe('kg')
    })
  })

  describe('Ingredient Management', () => {
    it('should show button to add ingredient to recipe', () => {
      expect(wrapper.find('[data-test="add-ingredient-button"]').exists()).toBe(true)
    })

    it('should display ingredient selector when adding ingredient', async () => {
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')

      expect(wrapper.find('[data-test="ingredient-selector"]').exists()).toBe(true)
    })

    it('should populate selector with available ingredients', async () => {
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')

      const options = wrapper.findAll('[data-test="ingredient-option"]')
      expect(options).toHaveLength(3)
      expect(options[0].text()).toContain('Мука')
      expect(options[1].text()).toContain('Сахар')
      expect(options[2].text()).toContain('Яйца')
    })

    it('should add ingredient to recipe items list', async () => {
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      const items = wrapper.findAll('[data-test="recipe-item"]')
      expect(items).toHaveLength(1)
      expect(items[0].text()).toContain('Мука')
      expect(items[0].text()).toContain('500 г')
    })

    it('should allow updating ingredient amount', async () => {
      // Добавляем ингредиент
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Изменяем количество
      await wrapper.find('[data-test="edit-item-amount"]').setValue('600')

      const item = wrapper.find('[data-test="recipe-item"]')
      expect(item.text()).toContain('600 г')
    })

    it('should remove ingredient from recipe', async () => {
      // Добавляем ингредиент
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      expect(wrapper.findAll('[data-test="recipe-item"]')).toHaveLength(1)

      // Удаляем
      await wrapper.find('[data-test="remove-item-button"]').trigger('click')

      expect(wrapper.findAll('[data-test="recipe-item"]')).toHaveLength(0)
    })

    it('should prevent adding same ingredient twice', async () => {
      // Добавляем мука первый раз
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Пытаемся добавить мука снова
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')

      const selector = wrapper.find('[data-test="ingredient-selector"]')
      const options = selector.findAll('option')

      // Мука не должна быть в списке доступных
      expect(options.some(opt => opt.text().includes('Мука'))).toBe(false)
    })

    it('should display amounts in correct units based on ingredient type', async () => {
      // Добавляем мука (вес - граммы)
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Добавляем яйца (штуки)
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('3')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('5')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      const items = wrapper.findAll('[data-test="recipe-item"]')
      expect(items[0].text()).toContain('500 г')
      expect(items[1].text()).toContain('5 шт')
    })
  })

  describe('Cost Calculation', () => {
    it('should calculate and display total cost automatically', async () => {
      // Добавляем мука: 500г × 0.06₽ = 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      expect(wrapper.find('[data-test="total-cost"]').text()).toContain('30')
    })

    it('should update cost when ingredient amount changes', async () => {
      // Добавляем мука: 500г × 0.06₽ = 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      expect(wrapper.find('[data-test="total-cost"]').text()).toContain('30')

      // Меняем количество на 1000г × 0.06₽ = 60₽
      await wrapper.find('[data-test="edit-item-amount"]').setValue('1000')

      expect(wrapper.find('[data-test="total-cost"]').text()).toContain('60')
    })

    it('should calculate cost for multiple ingredients', async () => {
      // Мука: 500г × 0.06₽ = 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Сахар: 300г × 0.08₽ = 24₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('2')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('300')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Яйца: 5шт × 9₽ = 45₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('3')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('5')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Итого: 30 + 24 + 45 = 99₽
      expect(wrapper.find('[data-test="total-cost"]').text()).toContain('99')
    })
  })

  describe('Profit Calculation', () => {
    it('should calculate and display profit when selling price is set', async () => {
      // Себестоимость: 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Цена продажи: 2000₽
      await wrapper.find('[data-test="selling-price"]').setValue('2000')

      // Прибыль: 2000 - 30 = 1970₽
      expect(wrapper.find('[data-test="profit-amount"]').text()).toContain('1 970')
    })

    it('should calculate and display profit percentage', async () => {
      // Себестоимость: 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Цена продажи: 90₽
      await wrapper.find('[data-test="selling-price"]').setValue('90')

      // Маржа: ((90 - 30) / 30) × 100 = 200%
      expect(wrapper.find('[data-test="profit-percent"]').text()).toContain('200%')
    })

    it('should show profit indicator with color coding', async () => {
      // Себестоимость: 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Цена продажи: 90₽ (маржа 200% - высокая)
      await wrapper.find('[data-test="selling-price"]').setValue('90')

      const profitIndicator = wrapper.find('[data-test="profit-indicator"]')
      expect(profitIndicator.classes()).toContain('text-positive') // Зеленый для >50%
    })

    it('should warn when selling below cost', async () => {
      // Себестоимость: 30₽
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      // Цена продажи: 20₽ (убыток!)
      await wrapper.find('[data-test="selling-price"]').setValue('20')

      expect(wrapper.find('[data-test="warning"]').text()).toContain('Цена ниже себестоимости')
      expect(wrapper.find('[data-test="profit-indicator"]').classes()).toContain('text-negative')
    })
  })

  describe('Form Submission', () => {
    it('should emit save event with correct recipe data', async () => {
      await wrapper.find('[data-test="recipe-name"]').setValue('Торт Наполеон')
      await wrapper.find('[data-test="recipe-description"]').setValue('Классический рецепт')
      await wrapper.find('[data-test="selling-price"]').setValue('2500')
      await wrapper.find('[data-test="selling-unit"]').setValue('kg')

      // Добавляем ингредиент
      await wrapper.find('[data-test="add-ingredient-button"]').trigger('click')
      await wrapper.find('[data-test="ingredient-selector"]').setValue('1')
      await wrapper.find('[data-test="ingredient-amount"]').setValue('500')
      await wrapper.find('[data-test="confirm-add-ingredient"]').trigger('click')

      await wrapper.find('form').trigger('submit')

      expect(wrapper.emitted('save')).toBeTruthy()
      expect(wrapper.emitted('save')[0][0]).toEqual({
        name: 'Торт Наполеон',
        description: 'Классический рецепт',
        sellingPrice: 2500,
        sellingUnit: 'kg',
        items: [
          { ingredientId: 1, amount: 500 }
        ]
      })
    })

    it('should not submit form if no ingredients added', async () => {
      await wrapper.find('[data-test="recipe-name"]').setValue('Торт')
      await wrapper.find('[data-test="selling-price"]').setValue('2000')

      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('Добавьте хотя бы один ингредиент')
      expect(wrapper.emitted('save')).toBeFalsy()
    })
  })

  describe('Edit Mode', () => {
    it('should prefill form when editing existing recipe', async () => {
      const recipe = {
        id: 1,
        name: 'Торт Наполеон',
        description: 'Классический рецепт',
        sellingPrice: 2500,
        sellingUnit: 'kg',
        items: [
          { ingredientId: 1, amount: 500 },
          { ingredientId: 2, amount: 300 }
        ]
      }

      wrapper = mount(RecipeForm, {
        props: { recipe, mode: 'edit' },
        global: {
          plugins: [createPinia(), Quasar]
        }
      })

      expect(wrapper.find('[data-test="recipe-name"]').element.value).toBe('Торт Наполеон')
      expect(wrapper.find('[data-test="recipe-description"]').element.value).toBe('Классический рецепт')
      expect(wrapper.find('[data-test="selling-price"]').element.value).toBe('2500')
      expect(wrapper.findAll('[data-test="recipe-item"]')).toHaveLength(2)
    })

    it('should show "Сохранить" button in edit mode', () => {
      const recipe = {
        id: 1,
        name: 'Торт',
        items: [],
        sellingPrice: 1000,
        sellingUnit: 'kg'
      }

      wrapper = mount(RecipeForm, {
        props: { recipe, mode: 'edit' },
        global: {
          plugins: [createPinia(), Quasar]
        }
      })

      expect(wrapper.find('[data-test="save-button"]').text()).toBe('Сохранить')
    })

    it('should show "Создать" button in create mode', () => {
      expect(wrapper.find('[data-test="save-button"]').text()).toBe('Создать рецепт')
    })
  })
})

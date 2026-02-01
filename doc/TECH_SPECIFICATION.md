# Техническая спецификация проекта CakeCost

## 1. Общая информация

### 1.1 Название проекта
**CakeCost** - Калькулятор себестоимости для кондитеров

Альтернативные варианты названия:
- BakeMargin
- MyPastry
- SweetMargin

### 1.2 Цель проекта
Создание мобильного приложения-утилиты для расчета себестоимости кондитерской продукции с автоматическим пересчетом при изменении цен на ингредиенты.

### 1.3 Целевая аудитория
- Домашние кондитеры
- Начинающие кондитеры, работающие на заказ
- Небольшие кондитерские

### 1.4 Бизнес-модель
**Freemium с рекламой:**
- Бесплатная версия: реклама + ограничения
- Платная версия: единоразовая покупка ($4.99 - $9.99)

---

## 2. Функциональные требования

### 2.1 Основные экраны

#### Экран 1: Склад (База ингредиентов)
**Назначение:** Справочник всех используемых ингредиентов с ценами

**Функционал:**
- **Поиск по ингредиентам** (строка поиска вверху экрана)
  - Поиск по названию ингредиента
  - Фильтрация в реальном времени при вводе
  - Кнопка очистки поиска (крестик)
- Создание нового ингредиента
- Редактирование существующего
- Удаление ингредиента
- Обновление цены с автоматическим пересчетом всех связанных рецептов
- Отображение счетчика найденных ингредиентов (при активном поиске)

**Поля ингредиента:**
- Название (текст, с подсветкой найденного текста при поиске)
- Цена покупки (число)
- Количество в упаковке (число)
- Единица измерения покупки (выбор из списка)
- Тип измерения (вес/объем/штуки)
- Автоматически вычисляемое: цена за базовую единицу

**Состояния экрана:**
- Пустой список: показ заглушки "Добавьте первый ингредиент"
- Нет результатов поиска: показ "Ничего не найдено по запросу '...'"
- Список ингредиентов: отображение всех или отфильтрованных ингредиентов

**Единицы измерения:**

*Вес:*
- Грамм (г) - базовая единица
- Килограмм (кг)

*Объем:*
- Миллилитр (мл) - базовая единица
- Литр (л)

*Штучные:*
- Штука (шт) - базовая единица
- Десяток (10 шт) - для яиц

#### Экран 2: Конструктор рецепта
**Назначение:** Создание и редактирование рецептов готовой продукции

**Функционал:**
- Создание нового рецепта
- Редактирование существующего
- Удаление рецепта
- Добавление/удаление ингредиентов в состав
- Указание количества ингредиентов (всегда в базовых единицах)
  - При добавлении ингредиента поле ввода количества автоматически показывает единицу измерения в label и suffix (г, мл, шт)
  - Единица измерения определяется типом выбранного ингредиента
  - Подсказка под полем ввода напоминает о необходимости использования базовых единиц
  - Поле ввода количества неактивно до тех пор, пока не выбран ингредиент

**Поля рецепта:**
- Название (текст)
- Описание (текст, опционально)
- Список ингредиентов с количеством (отображается с единицей измерения)
- Автоматически вычисляемая себестоимость
- Цена продажи (вводит пользователь)
- Единица продажи (за кг / за шт)
- Автоматически вычисляемая маржа (в рублях и %)

**Индикаторы:**
- Показ маржи: "Ваша наценка 125% (1000₽ с кг)"
- Цветовая индикация рентабельности

#### Экран 3: Список рецептов
**Назначение:** Просмотр всех сохраненных рецептов

**Функционал:**
- **Поиск по рецептам** (строка поиска вверху экрана)
  - Поиск по названию рецепта
  - Фильтрация в реальном времени при вводе
  - Кнопка очистки поиска (крестик)
- Отображение карточек рецептов
- Показ текущей себестоимости (обновляется автоматически)
- Кнопка "Изменить" (переход в Конструктор)
- Кнопка "Посчитать заказ" (переход в Калькулятор заказа)
- Удаление рецепта (свайп влево)
- Отображение счетчика найденных рецептов (при активном поиске)

**Отображение карточки:**
- Название рецепта (с подсветкой найденного текста при поиске)
- Себестоимость
- Цена продажи
- Маржа

**Состояния экрана:**
- Пустой список: показ заглушки "Создайте первый рецепт"
- Нет результатов поиска: показ "Ничего не найдено по запросу '...'"
- Список рецептов: отображение всех или отфильтрованных рецептов

#### Экран 4: Калькулятор заказа (для клиента)
**Назначение:** Быстрый расчет стоимости заказа конкретного веса/количества

**Функционал:**
- Выбор рецепта из списка
- Ввод веса/количества
- Автоматический расчет итоговой стоимости
- Показ прибыли (только для кондитера, не в чеке)
- Генерация чека для клиента

**Поля:**
- Выбранный торт (автоподстановка цены за кг/шт)
- Вес/количество (ввод числа)
- Итоговая стоимость (крупно)
- Чистая прибыль (мелко, только для кондитера)

**Кнопка для отправки чека клиенту:**

Реализован **Вариант Б: Картинка** через генерацию PNG изображения:

- **Кнопка "Отправить чек" (Share API):**
  - Генерирует красивую картинку чека (PNG формат)
  - Использует Capacitor Share API для мобильных устройств
  - Fallback на Web Share API для веб-платформы
  - Автоматически сохраняет файл во временное хранилище
  - Открывает системный диалог выбора приложения для отправки
  - Поддерживает все мессенджеры (WhatsApp, Telegram, Viber, Email и т.д.)
  - Позволяет сохранить изображение в галерею/файлы
  - Автоматически удаляет временный файл через 5 секунд
  - Закрывает калькулятор после успешной отправки

**Примечание:** Кнопка копирования в буфер обмена удалена из-за проблем с кроссплатформенной совместимостью Clipboard API для изображений. Пользователи могут сохранить чек через диалог Share и затем использовать его по необходимости.

**Формат чека (PNG изображение):**
- Генерация через HTML Canvas
- Фон с градиентом (по умолчанию)
- Название рецепта (торта)
- Вес/количество и единица измерения
- Цена за единицу
- Итоговая стоимость (крупным шрифтом)
- Footer с логотипом приложения
- Возможность кастомизации (только Pro версия)

**Техническая реализация:**
- Blob → Base64 → Filesystem.writeFile (временное хранилище)
- Share.share с URL временного файла
- Автоматическая очистка кэша после отправки
- Поддержка всех мессенджеров (WhatsApp, Telegram, Viber, Email и т.д.)

**Кастомизация чека (только Pro версия):**
- Загрузка собственного логотипа в качестве фона
  - Настройка прозрачности логотипа (0-100%)
  - Позиционирование (по центру, watermark)
- Выбор цвета фона
  - Палитра цветов или ввод HEX/RGB
  - Настройка прозрачности цвета (0-100%)
- Выбор цвета текста (для читаемости на темных фонах)
- Предпросмотр чека перед отправкой
- Сохранение настроек как шаблон по умолчанию

#### Экран 5: Настройки
**Назначение:** Управление параметрами приложения

**Функционал:**

*Основные настройки:*
- **Тема оформления:**
  - Переключатель "Светлая / Темная"
  - Опция "Следовать системной теме" (автоматически)
  - Мгновенное применение при переключении
- Выбор языка интерфейса
- Выбор валюты
- **Управление подпиской:**
  - Покупка Pro версии
  - Восстановление покупок (для нового устройства)
  - Проверка статуса подписки через магазин приложений
- **Резервное копирование данных:**
  - Экспорт всех данных в JSON файл
  - Импорт данных из JSON файла
  - Поля для экспорта: ингредиенты, рецепты, настройки чека
  - НЕ экспортируется: флаг Pro версии (восстанавливается через магазин)
  - Предупреждение при импорте о перезаписи данных
- Информация о приложении

*Настройки чека для клиента (только Pro):*
- **Брендирование:**
  - Загрузка логотипа (PNG/JPG, макс 2MB)
  - Регулировка прозрачности логотипа (слайдер 0-100%)
  - Позиция логотипа (центр, watermark в углу)
- **Цвета:**
  - Выбор цвета фона (палитра + HEX код)
  - Прозрачность фона (слайдер 0-100%)
  - Цвет текста (авто или ручной выбор)
  - Пресеты цветов (сохраненные комбинации)
- **Контакты:**
  - Поле для имени/названия кондитерской
  - Телефон
  - Instagram/социальные сети
  - Сайт
- **Предпросмотр:**
  - Кнопка "Посмотреть пример чека"
  - Живое обновление при изменении настроек

### 2.2 Вирусная петля (Viral Loop)

**Механизмы вирального распространения:**

1. **Водяной знак на чеке:**
   - В бесплатной версии: обязательная подпись "Посчитано в CakeCost"
   - В Pro версии: возможность убрать или заменить на свои контакты

2. **Функция "Поделиться расчетом":**
   - Кондитер отправляет чек клиенту
   - Клиент видит название приложения
   - Переход по ссылке в магазин приложений

3. **Брендирование чека (Pro версия):**
   - Загрузка логотипа кондитерской в качестве фона
   - Настройка фирменных цветов бренда
   - Контакты и социальные сети в footer чека
   - Профессиональный вид чека повышает доверие клиентов

4. **Триггеры покупки Pro:**
   - Кондитеры хотят выглядеть профессионально
   - Возможность убрать рекламу приложения и добавить свой бренд - сильный стимул
   - **Кастомизация чека - ключевой триггер:** "Сделайте чеки в стиле вашего бренда"
   - Показ примера брендированного vs стандартного чека при генерации

### 2.3 Система пересчета

**Логика автоматического пересчета:**

1. Пользователь изменяет цену ингредиента в Складе
2. Система пересчитывает `price_per_base_unit` для этого ингредиента
3. Автоматически обновляется себестоимость всех рецептов, использующих этот ингредиент
4. В списке рецептов отображаются новые цены
5. Обновляется маржа каждого рецепта

**Формула расчета себестоимости рецепта:**
```
Себестоимость = Σ (количество_ингредиента × цена_за_базовую_единицу)
```

**Формула расчета цены за базовую единицу:**
```
price_per_base_unit = purchase_price / (purchase_amount × conversion_rate)

где:
- purchase_price - цена покупки
- purchase_amount - количество в упаковке
- conversion_rate - коэффициент перевода в базовые единицы
```

**Примеры:**
- Мука: 120₽ за 2кг → 120 / (2 × 1000) = 0.06₽/г
- Яйца: 90₽ за десяток → 90 / (1 × 10) = 9₽/шт
- Ваниль: 500₽ за 50мл → 500 / (50 × 1) = 10₽/мл

---

## 3. Технические требования

### 3.1 Технологический стек

**Frontend Framework:**
- **Quasar Framework** (v2.x)
- **Vue 3** (Composition API)
- **Vite** (сборщик)

**Мобильная платформа:**
- **Capacitor** (через Quasar CLI)
- Таргет платформы: iOS, Android

**Управление состоянием:**
- **Pinia** (официальный state management для Vue 3)
- Pinia Plugin Persistedstate (для кеширования в начальной версии)

**База данных:**
- **SQLite** (через @capacitor-community/sqlite)
- Локальное хранение на устройстве пользователя

**Безопасность:**
- **@aparajita/capacitor-secure-storage** - защищенное хранилище для флага Pro версии (Keychain/KeyStore)
- **@talsec/free-rasp-capacitor** - Runtime Application Self-Protection (детекция root/tampering)

**Локализация:**
- **vue-i18n** (встроена в Quasar)
- Поддержка языков: английский (en), русский (ru), испанский (es), немецкий (de), французский (fr), китайский (zh), казахский (kk)

**Монетизация:**
- **AdMob** (capacitor-community/admob) - для рекламы
- **In-App Purchase** (capacitor-plugin-purchase) - для Pro версии

**Аналитика:**
- **Firebase Analytics** (@capawesome-team/capacitor-firebase/analytics) - основная аналитика
- Альтернатива: **Aptabase** (aptabase) - privacy-first аналитика

**Дополнительные библиотеки:**
- **html2canvas** - генерация изображений для чеков
- **@capacitor/filesystem** - работа с файловой системой (логотипы, экспорт/импорт JSON)
- **@capacitor/share** - функция "Поделиться" для экспорта файлов
- **Quasar Color Utils** - встроенные утилиты для работы с цветами (включены в Quasar)

**Плагины для экспорта/импорта:**
- File Picker API (встроен в Capacitor) - выбор файлов для импорта
- Share API (встроен в Capacitor) - отправка файлов экспорта

### 3.2 Архитектура приложения

**Структура проекта:**
```
src/
├── assets/
│   └── i18n/
│       ├── en.json
│       ├── ru.json
│       ├── es.json
│       ├── de.json
│       ├── fr.json
│       ├── zh.json
│       └── kk.json
├── components/
│   ├── ingredients/
│   │   ├── IngredientList.vue
│   │   ├── IngredientForm.vue
│   │   └── IngredientCard.vue
│   ├── recipes/
│   │   ├── RecipeList.vue
│   │   ├── RecipeForm.vue
│   │   └── RecipeCard.vue
│   ├── calculator/
│   │   ├── OrderCalculator.vue
│   │   └── ReceiptGenerator.vue
│   └── settings/
│       ├── ReceiptCustomization.vue
│       ├── ColorPicker.vue
│       ├── LogoUploader.vue
│       ├── DataExport.vue
│       └── DataImport.vue
├── stores/
│   ├── ingredients.ts
│   ├── recipes.ts
│   ├── settings.ts
│   └── security.ts          # RASP угрозы и состояние безопасности
├── database/
│   ├── schema.ts
│   └── migrations.ts
├── utils/
│   ├── exportData.ts
│   ├── importData.ts
│   ├── restorePurchases.ts
│   ├── secureStorage.ts      # Функции работы с Secure Storage (Pro статус)
│   └── rasp.ts               # Инициализация и конфигурация RASP
├── pages/
│   ├── IngredientsPage.vue
│   ├── RecipesPage.vue
│   ├── CalculatorPage.vue
│   └── SettingsPage.vue
└── router/
    └── routes.ts
```

### 3.3 Структура базы данных (SQLite)

#### Таблица: ingredients
```sql
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,

    -- Данные о покупке (как в чеке магазина)
    purchase_price REAL NOT NULL,      -- Цена покупки (например, 120 руб)
    purchase_amount REAL NOT NULL,     -- Количество (например, 2 или 10)
    purchase_unit TEXT NOT NULL,       -- Единица ('kg', 'g', 'l', 'ml', 'pcs', 'tens')

    -- Тип измерения
    type TEXT CHECK(type IN ('weight', 'volume', 'count')) NOT NULL,

    -- Вычисляемое поле: цена за 1 базовую единицу (г/мл/шт)
    price_per_base_unit REAL NOT NULL,

    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Таблица: recipes
```sql
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,

    -- Экономика
    total_cost REAL DEFAULT 0,        -- Себестоимость (кеш)
    selling_price REAL DEFAULT 0,     -- Цена продажи
    selling_unit TEXT CHECK(selling_unit IN ('kg', 'pcs')) DEFAULT 'kg',

    -- Вычисляемые поля (кеш для производительности)
    profit_amount REAL DEFAULT 0,     -- Прибыль в валюте
    profit_percent REAL DEFAULT 0,    -- Маржа в процентах

    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Таблица: recipe_items
```sql
CREATE TABLE IF NOT EXISTS recipe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,

    -- Количество ВСЕГДА в базовых единицах (г, мл, шт)
    amount REAL NOT NULL,

    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_ingredient ON recipe_items(ingredient_id);
```

#### Таблица: settings
```sql
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Всегда одна строка

    -- Основные настройки
    currency_symbol TEXT DEFAULT '₽',
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',              -- 'light', 'dark', 'auto'

    -- Настройки брендирования чека (Pro версия)
    receipt_logo_path TEXT,                -- Путь к файлу логотипа
    receipt_logo_opacity INTEGER DEFAULT 100,  -- Прозрачность логотипа (0-100)
    receipt_logo_position TEXT DEFAULT 'center', -- 'center', 'watermark'
    receipt_bg_color TEXT DEFAULT '#FFFFFF',    -- HEX цвет фона
    receipt_bg_opacity INTEGER DEFAULT 100,     -- Прозрачность фона (0-100)
    receipt_text_color TEXT DEFAULT '#000000',  -- HEX цвет текста

    -- Контакты кондитера для чека (Pro версия)
    receipt_business_name TEXT,           -- Название кондитерской
    receipt_phone TEXT,                   -- Телефон
    receipt_instagram TEXT,               -- Instagram handle
    receipt_website TEXT,                 -- Сайт

    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Начальные данные
INSERT OR IGNORE INTO settings (id) VALUES (1);

-- ВАЖНО: Флаг is_pro НЕ хранится в SQLite!
-- Он хранится в защищенном хранилище через Secure Storage (Keychain/KeyStore)
```

### 3.4 Экспорт/Импорт данных

**Назначение:**
Резервное копирование и перенос данных между устройствами.

**Формат экспорта:**
Все данные экспортируются в один JSON файл с именем `cakecost_backup_YYYY-MM-DD.json`

**Структура JSON файла:**

*Для Free пользователей:*
```json
{
  "version": "1.0",
  "exportDate": "2025-12-21T10:30:00Z",
  "exportedBy": "free",
  "data": {
    "ingredients": [
      {
        "id": 1,
        "name": "Мука пшеничная",
        "purchasePrice": 120,
        "purchaseAmount": 2,
        "purchaseUnit": "kg",
        "type": "weight",
        "pricePerBaseUnit": 0.06
      }
    ],
    "recipes": [
      {
        "id": 1,
        "name": "Торт Наполеон",
        "description": "Классический рецепт",
        "sellingPrice": 2500,
        "sellingUnit": "kg",
        "items": [
          {
            "ingredientId": 1,
            "amount": 500
          }
        ]
      }
    ],
    "settings": {
      "currencySymbol": "₽",
      "language": "ru",
      "theme": "light"
      // Настройки чека НЕ экспортируются для Free версии
    }
  }
}
```

*Для Pro пользователей (с настройками чека):*
```json
{
  "version": "1.0",
  "exportDate": "2025-12-21T10:30:00Z",
  "exportedBy": "pro",
  "data": {
    "ingredients": [ /* ... */ ],
    "recipes": [ /* ... */ ],
    "settings": {
      "currencySymbol": "₽",
      "language": "ru",
      "theme": "dark"
    },
    "receiptSettings": {
      "logo": {
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
        "filename": "my_logo.png"
      },
      "logoOpacity": 80,
      "logoPosition": "watermark",
      "bgColor": "#FFE5E5",
      "bgOpacity": 95,
      "textColor": "#2C1810",
      "businessName": "Sweet Dreams Bakery",
      "phone": "+7 999 123-45-67",
      "instagram": "@sweetdreams_bakery",
      "website": "sweetdreams.com"
    }
  }
}
```

**ВАЖНО:**
- Поле `is_pro` НЕ экспортируется (восстанавливается через IAP)
- Настройки чека экспортируются ТОЛЬКО для Pro пользователей
- Логотип кодируется в base64 (data URI формат)

**Логика экспорта:**
1. Извлечь все ингредиенты из таблицы `ingredients`
2. Извлечь все рецепты с их составом из таблиц `recipes` и `recipe_items`
3. Извлечь настройки из таблицы `settings`, **ИСКЛЮЧАЯ поле `is_pro`**
4. **Если пользователь Pro - экспортировать настройки чека:**
   - Прочитать логотип из файловой системы и закодировать в base64
   - Включить все настройки брендирования (цвета, прозрачность, позиция, контакты)
5. Сформировать JSON с версией и датой экспорта
6. Сохранить файл через Capacitor Filesystem API
7. Предложить пользователю поделиться файлом (облако, мессенджер)

**Логика импорта:**
1. Выбрать JSON файл через Capacitor File Picker
2. Валидировать структуру JSON (проверка версии, обязательных полей)
3. **Проверить статус Pro пользователя из Secure Storage**
4. **Валидация для Free пользователей:**
   ```typescript
   const isPro = await getProStatus();
   const recipesCount = importData.recipes.length;
   const ingredientsCount = importData.ingredients.length;

   if (!isPro) {
     if (recipesCount > 5) {
       showError(
         'Импорт невозможен',
         `Файл содержит ${recipesCount} рецептов. ` +
         `В бесплатной версии доступно максимум 5 рецептов. ` +
         `Приобретите Pro версию для импорта.`
       );
       return;
     }

     if (ingredientsCount > 15) {
       showError(
         'Импорт невозможен',
         `Файл содержит ${ingredientsCount} ингредиентов. ` +
         `В бесплатной версии доступно максимум 15 ингредиентов. ` +
         `Приобретите Pro версию для импорта.`
       );
       return;
     }
   }
   ```
5. Показать предупреждение: "Импорт перезапишет все текущие данные. Продолжить?"
6. При подтверждении:
   - Очистить таблицы `ingredients`, `recipes`, `recipe_items`
   - Вставить данные из JSON
   - Обновить основные настройки из JSON (язык, валюта, тема)
   - **Если пользователь Pro И в JSON есть настройки чека:**
     - Декодировать логотип из base64 и сохранить в файловую систему
     - Импортировать настройки брендирования чека (цвета, контакты)
   - **Pro статус НЕ импортируется** - он хранится в Secure Storage отдельно
   - Автоматически проверить статус Pro через магазин приложений (см. раздел 3.6)
7. Показать сообщение об успехе: "Импортировано: X ингредиентов, Y рецептов"

**Восстановление Pro версии:**
При каждом запуске приложения (и при импорте):
```typescript
// Проверка покупки через In-App Purchase плагин и Secure Storage
async function restorePurchases() {
  const purchases = await InAppPurchase.restorePurchases();
  const hasPro = purchases.some(p => p.productId === 'cakecalc_pro');

  if (hasPro) {
    // Сохранить флаг в Secure Storage (НЕ в SQLite!)
    await saveProStatus({
      isPro: true,
      purchaseDate: new Date().toISOString(),
      productId: 'cakecalc_pro',
      lastVerified: new Date().toISOString()
    });
  }
}
```

**Реализация экспорта:**
```typescript
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

async function exportData() {
  const isPro = await getProStatus();

  // 1. Собрать данные из SQLite
  const ingredients = await db.query('SELECT * FROM ingredients');
  const recipes = await db.query('SELECT * FROM recipes');
  const recipeItems = await db.query('SELECT * FROM recipe_items');
  const settings = await db.query('SELECT * FROM settings WHERE id = 1');

  // 2. Подготовить базовую структуру экспорта
  const exportData: any = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    exportedBy: isPro ? 'pro' : 'free',
    data: {
      ingredients: ingredients.values,
      recipes: recipes.values.map(recipe => ({
        ...recipe,
        items: recipeItems.values.filter(item => item.recipe_id === recipe.id)
      })),
      settings: {
        currencySymbol: settings.values[0].currency_symbol,
        language: settings.values[0].language,
        theme: settings.values[0].theme
      }
    }
  };

  // 3. Для Pro - добавить настройки чека
  if (isPro && settings.values[0].receipt_logo_path) {
    try {
      // Прочитать логотип и закодировать в base64
      const logoFile = await Filesystem.readFile({
        path: settings.values[0].receipt_logo_path,
        directory: Directory.Data
      });

      exportData.data.receiptSettings = {
        logo: {
          base64: logoFile.data, // Уже в base64 формате
          filename: settings.values[0].receipt_logo_path.split('/').pop()
        },
        logoOpacity: settings.values[0].receipt_logo_opacity,
        logoPosition: settings.values[0].receipt_logo_position,
        bgColor: settings.values[0].receipt_bg_color,
        bgOpacity: settings.values[0].receipt_bg_opacity,
        textColor: settings.values[0].receipt_text_color,
        businessName: settings.values[0].receipt_business_name,
        phone: settings.values[0].receipt_phone,
        instagram: settings.values[0].receipt_instagram,
        website: settings.values[0].receipt_website
      };
    } catch (error) {
      console.warn('Could not read logo file:', error);
      // Продолжить экспорт без логотипа
    }
  }

  // 4. Сохранить JSON файл
  const filename = `cakecost_backup_${new Date().toISOString().split('T')[0]}.json`;
  const jsonString = JSON.stringify(exportData, null, 2);

  await Filesystem.writeFile({
    path: filename,
    data: jsonString,
    directory: Directory.Documents,
    encoding: Encoding.UTF8
  });

  // 5. Поделиться файлом
  const fileUri = await Filesystem.getUri({
    path: filename,
    directory: Directory.Documents
  });

  await Share.share({
    title: 'Экспорт данных CakeCost',
    text: 'Резервная копия данных приложения',
    url: fileUri.uri,
    dialogTitle: 'Сохранить резервную копию'
  });
}
```

**Реализация импорта с валидацией:**
```typescript
async function importData(fileUri: string) {
  try {
    // 1. Прочитать файл
    const fileContent = await Filesystem.readFile({
      path: fileUri,
      encoding: Encoding.UTF8
    });

    const importData = JSON.parse(fileContent.data as string);

    // 2. Валидация структуры
    if (!importData.version || !importData.data) {
      throw new Error('Неверный формат файла');
    }

    // 3. Проверить статус Pro
    const isPro = await getProStatus();
    const recipesCount = importData.data.recipes?.length || 0;
    const ingredientsCount = importData.data.ingredients?.length || 0;

    // 4. Валидация для Free пользователей
    if (!isPro) {
      if (recipesCount > 5) {
        Dialog.create({
          title: 'Импорт невозможен',
          message: `Файл содержит ${recipesCount} рецептов. ` +
                   `В бесплатной версии доступно максимум 5 рецептов.\n\n` +
                   `Приобретите Pro версию для импорта всех данных.`,
          ok: {
            label: 'Купить Pro',
            color: 'primary'
          },
          cancel: {
            label: 'Отмена',
            color: 'grey'
          }
        }).onOk(() => {
          // Открыть экран покупки Pro
          router.push('/settings/purchase-pro');
        });
        return;
      }

      if (ingredientsCount > 15) {
        Dialog.create({
          title: 'Импорт невозможен',
          message: `Файл содержит ${ingredientsCount} ингредиентов. ` +
                   `В бесплатной версии доступно максимум 15 ингредиентов.\n\n` +
                   `Приобретите Pro версию для импорта всех данных.`,
          ok: {
            label: 'Купить Pro',
            color: 'primary'
          },
          cancel: {
            label: 'Отмена',
            color: 'grey'
          }
        }).onOk(() => {
          router.push('/settings/purchase-pro');
        });
        return;
      }
    }

    // 5. Подтверждение импорта
    Dialog.create({
      title: 'Подтверждение импорта',
      message: `Импорт перезапишет все текущие данные:\n\n` +
               `• ${ingredientsCount} ингредиентов\n` +
               `• ${recipesCount} рецептов\n\n` +
               `Продолжить?`,
      ok: {
        label: 'Импортировать',
        color: 'primary'
      },
      cancel: {
        label: 'Отмена',
        color: 'grey'
      }
    }).onOk(async () => {
      await performImport(importData, isPro);
    });

  } catch (error) {
    Notify.create({
      type: 'negative',
      message: `Ошибка импорта: ${error.message}`
    });
  }
}

async function performImport(importData: any, isPro: boolean) {
  // 6. Очистить существующие данные
  await db.execute('DELETE FROM recipe_items');
  await db.execute('DELETE FROM recipes');
  await db.execute('DELETE FROM ingredients');

  // 7. Импортировать ингредиенты
  for (const ingredient of importData.data.ingredients) {
    await db.execute(
      `INSERT INTO ingredients (name, purchase_price, purchase_amount,
       purchase_unit, type, price_per_base_unit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ingredient.name, ingredient.purchasePrice, ingredient.purchaseAmount,
       ingredient.purchaseUnit, ingredient.type, ingredient.pricePerBaseUnit]
    );
  }

  // 8. Импортировать рецепты
  for (const recipe of importData.data.recipes) {
    const result = await db.execute(
      `INSERT INTO recipes (name, description, selling_price, selling_unit)
       VALUES (?, ?, ?, ?)`,
      [recipe.name, recipe.description, recipe.sellingPrice, recipe.sellingUnit]
    );

    const recipeId = result.changes.lastId;

    // Импортировать состав рецепта
    for (const item of recipe.items) {
      await db.execute(
        `INSERT INTO recipe_items (recipe_id, ingredient_id, amount)
         VALUES (?, ?, ?)`,
        [recipeId, item.ingredientId, item.amount]
      );
    }
  }

  // 9. Импортировать основные настройки
  await db.execute(
    `UPDATE settings SET
     currency_symbol = ?,
     language = ?,
     theme = ?
     WHERE id = 1`,
    [importData.data.settings.currencySymbol,
     importData.data.settings.language,
     importData.data.settings.theme]
  );

  // 10. Импортировать настройки чека (только для Pro)
  if (isPro && importData.data.receiptSettings) {
    const receiptSettings = importData.data.receiptSettings;

    // Декодировать и сохранить логотип
    let logoPath = null;
    if (receiptSettings.logo?.base64) {
      try {
        const filename = receiptSettings.logo.filename || 'receipt_logo.png';
        const logoFilePath = `receipts/${filename}`;

        // Сохранить base64 как файл
        await Filesystem.writeFile({
          path: logoFilePath,
          data: receiptSettings.logo.base64,
          directory: Directory.Data
        });

        logoPath = logoFilePath;
      } catch (error) {
        console.error('Failed to save logo:', error);
      }
    }

    // Обновить настройки чека в БД
    await db.execute(
      `UPDATE settings SET
       receipt_logo_path = ?,
       receipt_logo_opacity = ?,
       receipt_logo_position = ?,
       receipt_bg_color = ?,
       receipt_bg_opacity = ?,
       receipt_text_color = ?,
       receipt_business_name = ?,
       receipt_phone = ?,
       receipt_instagram = ?,
       receipt_website = ?
       WHERE id = 1`,
      [logoPath,
       receiptSettings.logoOpacity,
       receiptSettings.logoPosition,
       receiptSettings.bgColor,
       receiptSettings.bgOpacity,
       receiptSettings.textColor,
       receiptSettings.businessName,
       receiptSettings.phone,
       receiptSettings.instagram,
       receiptSettings.website]
    );
  }

  // 11. Верифицировать Pro статус через IAP
  await restorePurchases();

  // 12. Уведомление об успехе
  Notify.create({
    type: 'positive',
    message: `Импортировано: ${importData.data.ingredients.length} ингредиентов, ` +
             `${importData.data.recipes.length} рецептов`,
    timeout: 3000
  });
}
```

**Преимущества такого подхода:**
- ✅ Данные не теряются при смене устройства
- ✅ Pro версия автоматически восстанавливается через магазин
- ✅ Простой обмен рецептами между пользователями (опционально)
- ✅ Защита от потери покупки при переустановке
- ✅ **Флаг Pro защищён в Secure Storage и не может быть изменён извне**
- ✅ **Free пользователи не могут импортировать больше лимита** → стимул купить Pro
- ✅ **Pro пользователи не теряют настройки чека** при переносе данных
- ✅ Логотип переносится вместе с настройками (base64 → файл)

### 3.5 Конвертация единиц измерения

**Константы для пересчета:**
```typescript
const CONVERSION_RATES = {
  // Вес -> Граммы
  'g': 1,
  'kg': 1000,

  // Объем -> Миллилитры
  'ml': 1,
  'l': 1000,

  // Штуки -> Штуки
  'pcs': 1,       // штука
  'tens': 10,     // десяток
};
```

**Функция расчета цены за базовую единицу:**
```typescript
function calculateBasePrice(
  price: number,
  amount: number,
  unit: string
): number {
  const multiplier = CONVERSION_RATES[unit] || 1;
  const totalBaseUnits = amount * multiplier;
  return price / totalBaseUnits;
}
```

**Примеры:**
- Мука: 120₽, 2кг → 2 × 1000 = 2000г → 120/2000 = 0.06₽/г
- Яйца: 90₽, 1 дес → 1 × 10 = 10шт → 90/10 = 9₽/шт
- Ваниль: 500₽, 50мл → 50 × 1 = 50мл → 500/50 = 10₽/мл

### 3.5 Реактивный пересчет (Pinia Getters)

```typescript
// stores/recipes.ts
export const useRecipesStore = defineStore('recipes', {
  state: () => ({
    recipes: [] as Recipe[]
  }),

  getters: {
    getRecipeCost: (state) => (recipe: Recipe) => {
      const ingredientsStore = useIngredientsStore();

      return recipe.items.reduce((sum, item) => {
        const ingredient = ingredientsStore.getById(item.ingredientId);
        if (!ingredient) return sum;

        return sum + (ingredient.pricePerBaseUnit * item.amount);
      }, 0);
    },

    getRecipeProfit: (state) => (recipe: Recipe) => {
      const cost = this.getRecipeCost(recipe);
      return recipe.sellingPrice - cost;
    },

    getRecipeProfitPercent: (state) => (recipe: Recipe) => {
      const cost = this.getRecipeCost(recipe);
      if (cost === 0) return 0;
      return ((recipe.sellingPrice - cost) / cost) * 100;
    }
  }
});
```

### 3.6 Защищенное хранилище для Pro статуса (Secure Storage)

**Назначение:**
Хранение флага Pro версии в безопасном хранилище операционной системы вместо SQLite, чтобы предотвратить его изменение внешними инструментами.

**Технология:**
- **iOS:** Keychain (системное зашифрованное хранилище)
- **Android:** EncryptedSharedPreferences (на основе KeyStore)
- **Библиотека:** @aparajita/capacitor-secure-storage

**Структура данных:**
```typescript
// Ключ для хранения
const PRO_STATUS_KEY = 'cakecalc_pro_status';

// Интерфейс данных Pro статуса
interface ProStatus {
  isPro: boolean;
  purchaseDate?: string;        // ISO дата покупки
  productId?: string;           // ID продукта из магазина
  lastVerified?: string;        // Дата последней проверки
}
```

**Реализация:**

*Инициализация при запуске приложения:*
```typescript
import { SecureStoragePlugin } from '@aparajita/capacitor-secure-storage';
import { InAppPurchase } from 'capacitor-plugin-purchase';

// Проверка и восстановление Pro статуса
async function initializeProStatus() {
  try {
    // 1. Попытаться прочитать из Secure Storage
    const stored = await SecureStoragePlugin.get({ key: PRO_STATUS_KEY });
    const proStatus: ProStatus = JSON.parse(stored.value);

    // 2. Верифицировать покупку через магазин приложений
    const purchases = await InAppPurchase.restorePurchases();
    const hasPro = purchases.some(p => p.productId === 'cakecalc_pro');

    // 3. Если статусы не совпадают - приоритет магазину
    if (hasPro && !proStatus.isPro) {
      await saveProStatus({
        isPro: true,
        purchaseDate: new Date().toISOString(),
        productId: 'cakecalc_pro',
        lastVerified: new Date().toISOString()
      });
    } else if (!hasPro && proStatus.isPro) {
      // Покупка не найдена - сбросить статус
      await saveProStatus({
        isPro: false,
        lastVerified: new Date().toISOString()
      });
    }

    return proStatus;
  } catch (error) {
    // Ключ не найден - первый запуск
    return { isPro: false };
  }
}

// Сохранение Pro статуса
async function saveProStatus(status: ProStatus) {
  await SecureStoragePlugin.set({
    key: PRO_STATUS_KEY,
    value: JSON.stringify(status)
  });
}

// Получение текущего статуса
async function getProStatus(): Promise<boolean> {
  try {
    const stored = await SecureStoragePlugin.get({ key: PRO_STATUS_KEY });
    const proStatus: ProStatus = JSON.parse(stored.value);
    return proStatus.isPro;
  } catch {
    return false;
  }
}

// Обработка успешной покупки
async function handlePurchaseSuccess(productId: string) {
  await saveProStatus({
    isPro: true,
    purchaseDate: new Date().toISOString(),
    productId: productId,
    lastVerified: new Date().toISOString()
  });
}
```

*Интеграция в Pinia Store:*
```typescript
// stores/settings.ts
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    isPro: false,
    currency: '₽',
    language: 'ru',
    theme: 'light',
    // ... другие настройки из SQLite
  }),

  actions: {
    async loadProStatus() {
      this.isPro = await getProStatus();
    },

    async purchasePro() {
      // Инициировать покупку через In-App Purchase
      const result = await InAppPurchase.purchase('cakecalc_pro');
      if (result.success) {
        await handlePurchaseSuccess('cakecalc_pro');
        this.isPro = true;
      }
    },

    async restorePurchases() {
      await initializeProStatus();
      this.isPro = await getProStatus();
    }
  }
});
```

**Преимущества:**
- ✅ Данные зашифрованы на уровне ОС
- ✅ Невозможно отредактировать через SQLite Browser или подобные инструменты
- ✅ Автоматическое резервное копирование через iCloud Keychain (iOS)
- ✅ Сохраняется при переустановке приложения (iOS Keychain)
- ✅ Защита от несанкционированного доступа

### 3.7 Runtime Application Self-Protection (RASP)

**Назначение:**
Детектирование попыток взлома, модификации приложения и запуска на скомпрометированных устройствах.

**Технология:**
- **Библиотека:** @talsec/free-rasp-capacitor (бесплатная версия)
- **Методы защиты:** Детекция root/jailbreak, tampering, debugging, эмуляторов

**Конфигурация:**
```typescript
import { ThreatEvent, Threat, FreRasp } from '@talsec/free-rasp-capacitor';

// Инициализация при запуске приложения
async function initializeRASP() {
  const config = {
    androidConfig: {
      packageName: 'com.cakecost.app',
      certificateHashes: ['YOUR_CERTIFICATE_HASH'],
      supportedAlternativeStores: [
        'com.sec.android.app.samsungapps',  // Samsung Galaxy Store
        'com.amazon.venezia'                 // Amazon Appstore
      ],
    },
    iosConfig: {
      appBundleIds: 'com.cakecost.app',
      appTeamId: 'YOUR_APPLE_TEAM_ID',
    },
    watcherMail: 'security@cakecost.app',  // Email для отчетов
  };

  try {
    await FreRasp.start(config);
    console.log('RASP initialized successfully');
  } catch (error) {
    console.error('RASP initialization failed:', error);
  }
}
```

**Обработчики угроз:**
```typescript
// Pinia store для управления состоянием безопасности
export const useSecurityStore = defineStore('security', {
  state: () => ({
    isDeviceCompromised: false,
    detectedThreats: [] as string[],
  }),

  actions: {
    setupThreatListeners() {
      // Root/Jailbreak обнаружен
      FreRasp.addListener('rootDetected', () => {
        console.warn('⚠️ Root/Jailbreak detected');
        this.isDeviceCompromised = true;
        this.detectedThreats.push('root');
        this.handleCompromisedDevice();
      });

      // Приложение модифицировано
      FreRasp.addListener('tamperDetected', () => {
        console.warn('⚠️ App tampering detected');
        this.isDeviceCompromised = true;
        this.detectedThreats.push('tampering');
        this.handleCompromisedDevice();
      });

      // USB Debugging включён (Android)
      FreRasp.addListener('adbEnabled', () => {
        console.warn('⚠️ ADB detected');
        this.detectedThreats.push('adb');
        // ADB не критично, но логируем
      });

      // Эмулятор обнаружен
      FreRasp.addListener('emulatorDetected', () => {
        console.warn('⚠️ Emulator detected');
        // Для разработки допустимо, в проде - блокируем Pro
      });

      // Malware обнаружен (Android)
      FreRasp.addListener('malwareDetected', (data) => {
        console.error('⚠️ Malware detected:', data);
        this.isDeviceCompromised = true;
        this.detectedThreats.push('malware');
        this.handleCompromisedDevice();
      });

      // Попытка снятия скриншота/записи экрана (iOS)
      FreRasp.addListener('screenshot', () => {
        console.log('📸 Screenshot detected');
        // Опционально: можно скрывать чувствительные данные
      });
    },

    handleCompromisedDevice() {
      const settingsStore = useSettingsStore();

      // Отключить Pro функции на скомпрометированном устройстве
      if (this.isDeviceCompromised) {
        // НЕ меняем реальный статус в Secure Storage
        // Просто блокируем доступ в runtime
        settingsStore.isPro = false;

        // Показать предупреждение
        this.showSecurityWarning();
      }
    },

    showSecurityWarning() {
      // Показать диалог пользователю
      Dialog.create({
        title: '🔒 Предупреждение безопасности',
        message: 'Обнаружены признаки модификации устройства или приложения. ' +
                 'Pro функции отключены в целях безопасности.',
        persistent: true,
        ok: {
          label: 'Понятно',
          color: 'negative'
        }
      });
    }
  }
});
```

**Интеграция в приложение:**
```typescript
// main.ts или App.vue
import { useSecurityStore } from 'stores/security';
import { useSettingsStore } from 'stores/settings';

async function initializeApp() {
  // 1. Инициализировать RASP
  await initializeRASP();

  // 2. Настроить обработчики угроз
  const securityStore = useSecurityStore();
  securityStore.setupThreatListeners();

  // 3. Загрузить Pro статус из Secure Storage
  const settingsStore = useSettingsStore();
  await settingsStore.loadProStatus();

  // 4. Если устройство скомпрометировано - заблокировать Pro
  if (securityStore.isDeviceCompromised) {
    settingsStore.isPro = false;
  }
}
```

**Логика блокировки Pro функций:**
```typescript
// Middleware для проверки доступа к Pro функциям
function requiresPro(): boolean {
  const settingsStore = useSettingsStore();
  const securityStore = useSecurityStore();

  // Блокируем если:
  // 1. Не куплена Pro версия
  // 2. Устройство скомпрометировано
  if (!settingsStore.isPro || securityStore.isDeviceCompromised) {
    showProPaywall();
    return false;
  }

  return true;
}

// Пример использования
function openReceiptCustomization() {
  if (!requiresPro()) return;

  // Открыть настройки брендирования
  router.push('/settings/receipt-customization');
}
```

**Детектируемые угрозы:**
- ✅ Root (Android) / Jailbreak (iOS)
- ✅ Модификация APK/IPA файлов
- ✅ USB Debugging (ADB)
- ✅ Эмуляторы
- ✅ Malware на устройстве (Android)
- ✅ Попытки debugging
- ✅ Снимки экрана (опционально, только iOS)

**Стратегия реагирования:**
1. **Критические угрозы** (root, tampering, malware):
   - Блокировка Pro функций
   - Показ предупреждения
   - Логирование для аналитики
2. **Некритические угрозы** (ADB, screenshot):
   - Только логирование
   - Без блокировки функционала

### 3.8 Архитектура безопасности - Итого

**Многоуровневая защита Pro версии:**

```
┌─────────────────────────────────────────────────────────────┐
│                     ПОЛЬЗОВАТЕЛЬ                             │
│              (пытается разблокировать Pro)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Уровень 1: RASP Detection   │
         │  @talsec/free-rasp-capacitor  │
         └───────────────┬───────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
   Root/Jailbreak?                    Tampering?
   Malware?                           Modified APK/IPA?
        │                                  │
        └────────────┬───────────────────┘
                     │
                     ▼
              Угроза обнаружена?
                     │
        ┌────────────┴────────────┐
        │ ДА                 НЕТ  │
        ▼                         ▼
   Блокировать Pro          Продолжить
   функции в runtime        проверку
        │                         │
        │                         ▼
        │          ┌─────────────────────────────┐
        │          │  Уровень 2: Secure Storage  │
        │          │ @aparajita/capacitor-secure │
        │          └──────────────┬──────────────┘
        │                         │
        │                         ▼
        │              Прочитать isPro из
        │              Keychain (iOS) /
        │              KeyStore (Android)
        │                         │
        │          ┌──────────────┴──────────────┐
        │          │                              │
        │          ▼                              ▼
        │     isPro = true?                isPro = false?
        │          │                              │
        │          ▼                              │
        │   ┌──────────────────────┐             │
        │   │ Уровень 3: IAP Check │             │
        │   │  In-App Purchase API │             │
        │   └─────────┬────────────┘             │
        │             │                           │
        │             ▼                           │
        │   Верифицировать покупку               │
        │   через App Store / Play               │
        │             │                           │
        │      ┌──────┴──────┐                   │
        │      │              │                   │
        │      ▼              ▼                   │
        │  Verified     Not Found                │
        │      │              │                   │
        │      ▼              ▼                   │
        │  РАЗРЕШИТЬ     Сбросить                │
        │  Pro функции   isPro = false           │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                          ▼
                    ЗАБЛОКИРОВАТЬ
                    Pro функции
```

**Уровни защиты:**

1. **RASP (Runtime Application Self-Protection):**
   - Первая линия защиты
   - Детектирует скомпрометированное устройство
   - Блокирует на уровне runtime, даже если isPro = true

2. **Secure Storage (Keychain/KeyStore):**
   - Вторая линия защиты
   - Шифрованное хранилище на уровне ОС
   - Невозможно отредактировать через SQLite Browser

3. **In-App Purchase Verification:**
   - Третья линия защиты
   - Истина о покупке хранится в Apple/Google серверах
   - Автоматическая верификация при запуске

**Точки атаки и защита:**

| Атака | Защита |
|-------|--------|
| Редактирование SQLite через внешние инструменты | `is_pro` не хранится в SQLite |
| Рутованное устройство с модифицированным Keychain | RASP детектирует root → блокирует Pro |
| Модификация APK/IPA файла приложения | RASP детектирует tampering → блокирует Pro |
| Переустановка приложения (потеря данных) | IAP автоматически восстанавливает покупку |
| Экспорт/импорт данных с попыткой подделки Pro | `is_pro` не экспортируется, восстанавливается через IAP |
| Malware на устройстве | RASP детектирует malware → блокирует Pro |

**Преимущества архитектуры:**
- ✅ 3 независимых уровня защиты
- ✅ Невозможно обойти простым редактированием файлов
- ✅ Автоматическое восстановление легитимных покупок
- ✅ Детекция взломанных устройств
- ✅ Минимальное влияние на UX для честных пользователей
- ✅ Защита ~90% от попыток взлома

### 3.5 UI/UX Требования

**Описание:** Стандарты разработки пользовательского интерфейса для обеспечения качественного опыта на мобильных устройствах.

#### 3.5.1 Принципы валидации форм

**Lazy Validation (Отложенная валидация):**
- Все формы должны использовать `lazy-rules` атрибут на полях ввода
- Валидация срабатывает только при попытке отправки формы
- Ошибки НЕ показываются во время ввода текста
- Предотвращает негативный UX от преждевременных сообщений об ошибках

**Пример:**
```vue
<QInput
  v-model="formData.name"
  label="Название"
  :rules="[
    val => !!val || 'Название обязательно'
  ]"
  lazy-rules
  outlined
/>
```

**Clear-on-Focus (Очистка при фокусе):**
- Числовые поля с дефолтным значением `0` должны очищаться при первом фокусе
- Реализуется через отслеживание состояния фокуса
- Улучшает скорость ввода данных, уменьшает количество действий

**Пример:**
```typescript
const priceFocused = ref(false)

function onPriceFocus() {
  if (!priceFocused.value && formData.value.price === 0) {
    formData.value.price = null as any
  }
  priceFocused.value = true
}
```

```vue
<QInput
  v-model.number="formData.price"
  label="Цена"
  type="number"
  @focus="onPriceFocus"
  lazy-rules
/>
```

#### 3.5.2 Использование Quasar компонентов

**Обязательные компоненты:**
- ✅ `QInput` - для всех текстовых полей и чисел
- ✅ `QSelect` - для всех выпадающих списков (НЕ использовать native `<select>`)
- ✅ `QBtn` - для всех кнопок
- ✅ `QDialog` - для всех диалоговых окон
- ✅ `QForm` - для всех форм с валидацией

**Запрещенные элементы:**
- ❌ Native `<select>` - использовать `QSelect`
- ❌ Native `<input>` - использовать `QInput`
- ❌ Native `<button>` - использовать `QBtn`

**Причины:**
- Единообразный стиль интерфейса
- Лучшая работа на мобильных устройствах
- Встроенная поддержка тем и локализации
- Accessibility из коробки

#### 3.5.3 Мобильная адаптация

**Диалоговые окна:**
- Все диалоги должны использовать `maximized` режим на мобильных
- Обязательна кнопка закрытия в toolbar
- Использовать `QToolbar` для заголовка

**Пример:**
```vue
<QDialog v-model="showDialog" maximized>
  <QCard>
    <QToolbar class="bg-primary text-white">
      <QToolbarTitle>Заголовок</QToolbarTitle>
      <QBtn flat round dense icon="close" v-close-popup />
    </QToolbar>

    <QCardSection>
      <!-- Контент диалога -->
    </QCardSection>
  </QCard>
</QDialog>
```

**Размеры элементов:**
- ❌ НЕ использовать атрибут `dense` для полей ввода (слишком мелко на мобильных)
- ✅ Использовать стандартные размеры Quasar компонентов
- ✅ Минимальная высота кнопок: 44px (стандарт iOS/Android)
- ✅ Минимальный размер touch target: 48x48px

**Spacing:**
- Использовать `q-gutter-md` для spacing между элементами
- Минимальный padding в диалогах: 16px
- Использовать `q-pa-md` и `q-mt-md` вместо custom CSS

#### 3.5.4 Accessibility (A11y)

**Обязательные требования:**
- Все интерактивные элементы имеют `aria-label` или видимый текст
- Поля ввода связаны с `label` элементами
- Кнопки имеют описательный текст (не только иконки)
- Использовать `QTooltip` для иконочных кнопок

**Пример:**
```vue
<QBtn
  flat
  round
  icon="delete"
  color="negative"
  @click="deleteItem"
>
  <QTooltip>Удалить</QTooltip>
</QBtn>
```

#### 3.5.5 Тестирование UI компонентов

**Важно:** При тестировании Quasar компонентов:
- QSelect НЕ рендерит options в DOM до открытия
- Использовать `wrapper.vm` для доступа к данным компонента вместо DOM queries
- Тесты должны проверять поведение, а не implementation details

**Пример правильного теста:**
```typescript
// ❌ Неправильно: проверка DOM элементов QSelect
const options = wrapper.findAll('option')
expect(options).toHaveLength(3)

// ✅ Правильно: проверка данных компонента
const availableOptions = wrapper.vm.availableOptions
expect(availableOptions).toHaveLength(3)
```

#### 3.5.6 Чек-лист при создании формы

- [ ] Все `QInput` имеют `lazy-rules`
- [ ] Числовые поля имеют `clear-on-focus` функциональность
- [ ] Использован `QSelect` вместо native select
- [ ] Диалог использует `maximized` режим
- [ ] Есть кнопка закрытия в toolbar
- [ ] НЕ используется атрибут `dense`
- [ ] Все кнопки имеют tooltips или текстовые labels
- [ ] Форма обернута в `QForm` компонент
- [ ] Написаны тесты, использующие `wrapper.vm` для QSelect

---

## 4. Монетизация

### 4.1 Бесплатная версия

**Ограничения:**
- Максимум 5 рецептов
- Максимум 15 ингредиентов
- Баннерная реклама внизу экрана (AdMob)
- Межстраничная реклама при сохранении рецепта
- Обязательный водяной знак в чеке

**Показ рекламы:**
- Баннер: постоянно внизу всех экранов
- Interstitial: при сохранении нового рецепта, при попытке экспорта

### 4.2 Pro версия (Premium)

**Стоимость:** $4.99 - $9.99 (единоразовый платеж)

**Преимущества:**
- Неограниченное количество рецептов
- Неограниченное количество ингредиентов
- Полное отключение рекламы
- Возможность убрать водяной знак из чека
- **Брендирование чеков:**
  - Загрузка собственного логотипа
  - Настройка прозрачности логотипа (0-100%)
  - Выбор цвета фона с настройкой прозрачности
  - Выбор цвета текста
  - Добавление контактов (имя, телефон, Instagram, сайт)
  - Сохранение шаблонов оформления
- Экспорт рецептов в PDF (опционально)

**Триггеры покупки:**
- При попытке создать 6-й рецепт
- При попытке добавить 16-й ингредиент
- **При попытке импортировать файл с >5 рецептами или >15 ингредиентами**
- Кнопка "Убрать рекламу" в настройках
- **Кнопка "Создать брендированный чек"** в калькуляторе заказа
- Показ сравнения "До/После" (стандартный чек vs брендированный)
- Показ примеров красивых брендированных чеков

---

## 5. Локализация

### 5.1 Поддерживаемые языки

**Полный набор:**
- **Английский (en)** - глобальный рынок, язык по умолчанию
- **Русский (ru)** - рынок СНГ (Россия, Беларусь, Украина)
- **Испанский (es)** - Латинская Америка, Испания
- **Немецкий (de)** - Германия, Австрия, Швейцария (крупный рынок домашней выпечки)
- **Французский (fr)** - Франция, Бельгия, Канада (кондитерская культура)
- **Китайский (zh)** - Китай (огромный рынок, растущий интерес к западной выпечке)
- **Казахский (kk)** - Казахстан (активный рынок СНГ с собственным языком)

**Приоритет внедрения:**
1. Первая волна (MVP): Английский, Русский, Испанский, Казахский
2. Вторая волна (после релиза): Немецкий, Французский
3. Третья волна (расширение): Китайский

### 5.2 Локализуемые элементы

**UI элементы:**
- Все надписи на кнопках
- Названия экранов
- Placeholder'ы в полях ввода
- Сообщения об ошибках
- Подсказки и тултипы

**Генерируемый контент:**
- Текст чека для клиента
- Названия единиц измерения
- Форматы чисел и валют

**Стартовые данные:**
- Примеры ингредиентов при первом запуске
- Названия категорий (если будут добавлены)

### 5.3 Региональные настройки

**Валюта:**
- Выбор символа: ₽, $, €, £, ₸, ₴
- Автоопределение по локали устройства
- Ручное изменение в настройках

**Числовые форматы:**
- Разделитель целой и дробной части: точка (US) / запятая (EU, RU)
- Использование системных настроек через Intl.NumberFormat

**Пример реализации:**
```typescript
// i18n/en.json
{
  "ingredients": {
    "title": "Ingredients",
    "add": "Add Ingredient",
    "search": "Search ingredients...",
    "noResults": "No ingredients found for '{{query}}'",
    "empty": "Add your first ingredient",
    "resultsCount": "{{count}} ingredient(s) found",
    "name": "Name",
    "price": "Price",
    "amount": "Amount"
  },
  "recipes": {
    "title": "Recipes",
    "add": "Add Recipe",
    "search": "Search recipes...",
    "noResults": "No recipes found for '{{query}}'",
    "empty": "Create your first recipe",
    "resultsCount": "{{count}} recipe(s) found"
  },
  "receipt": {
    "title": "Order Estimate",
    "item": "Item",
    "weight": "Weight",
    "pricePerUnit": "Price per kg",
    "total": "TOTAL",
    "footer": "Calculated via CakeCost app"
  }
}
```

---

## 6. UI/UX Компоненты (Quasar)

### 6.1 Рекомендуемые компоненты

**Списки:**
- `<q-list>`, `<q-item>`, `<q-item-section>` - для ингредиентов и рецептов
- `<q-slide-item>` - свайп для удаления элементов

**Формы:**
- `<q-input type="number">` - для ввода цен и количества
- `<q-input type="text">` - для строки поиска рецептов (с clearable и debounce)
- `<q-select>` - для выбора единиц измерения
- `<q-btn-toggle>` - для переключения типа измерения (вес/объем/штуки)
- `<q-toggle>` - переключатель темы (светлая/темная) в настройках
- `<q-file>` - для загрузки логотипа (с превью изображения)
- `<q-color>` - палитра выбора цвета для фона и текста
- `<q-slider>` - для настройки прозрачности (0-100%)

**Диалоги:**
- `<q-dialog>` - для форм создания/редактирования
- `<q-bottom-sheet>` - для калькулятора заказа (опционально)

**Навигация:**
- `<q-tabs>` - переключение между разделами
- `<q-page>` - контейнеры страниц

**Визуализация данных:**
- `<q-linear-progress>` - для показа маржи
- `<q-chip>` - для тегов и меток
- `<q-badge>` - для счетчиков

### 6.2 Дизайн-гайдлайны

**Цветовые темы:**

Приложение поддерживает две темы с возможностью переключения:

*Светлая тема (по умолчанию):*
- Фон: белый (#FFFFFF) / светло-серый (#F5F5F5)
- Основной цвет: светлые пастельные тона (ассоциация с выпечкой)
- Акцентный цвет: теплые тона (оранжевый #FF6B35, коралловый #FF8566)
- Текст: темно-серый (#212121), серый для второстепенного (#757575)
- Карточки: белый фон с легкой тенью

*Темная тема:*
- Фон: черный (#000000) / темно-серый (#121212)
- Поверхности: темно-серый (#1E1E1E, #2C2C2C) с повышением
- Акцентный цвет: более яркий оранжевый (#FF8A50) для контраста
- Текст: белый (#FFFFFF), светло-серый для второстепенного (#B0B0B0)
- Карточки: темно-серый (#1E1E1E) с легкой подсветкой краев

*Цвета для маржи (адаптивные для обеих тем):*
- Зеленый: маржа > 50% (светлая: #4CAF50, темная: #66BB6A)
- Желтый: маржа 20-50% (светлая: #FFC107, темная: #FFD54F)
- Красный: маржа < 20% (светлая: #F44336, темная: #EF5350)

**Переключение темы:**
- Переключатель в настройках приложения
- Автоматическое сохранение выбора пользователя
- Возможность следовать системной теме устройства (опционально)
- Плавная анимация перехода между темами

**Типографика:**
- Крупные кнопки для частых действий
- Четкая иерархия: цены выделяются размером
- Минимум текста, максимум визуальных подсказок

**UX принципы:**
- Минимум кликов для частых операций
- Автосохранение везде, где возможно
- Swipe-to-delete для удаления элементов
- Pull-to-refresh для обновления списков

---

## 7. Маркетинг и ASO

### 7.1 Названия в сторах

**Google Play / App Store:**

- **EN:** CakeCost: Recipe Pricing Calc
- **RU:** CakeCost: Себестоимость тортов
- **ES:** CakeCost: Costo de Recetas
- **DE:** CakeCost: Rezeptkosten Rechner
- **FR:** CakeCost: Calculateur de Coûts
- **ZH:** CakeCost: 烘焙成本计算器
- **KK:** CakeCost: Өнімнің өзіндік құны

### 7.2 Ключевые слова (Keywords)

**Русский:**
расчет себестоимости, калькулятор рецептов, кондитер, домашняя выпечка, цена торта, техкарта, калькулятор кондитера

**Английский:**
recipe cost calculator, cake pricing, bakery calculator, home baker, pastry cost, profit margin, baking business

**Испанский:**
calculadora de costos, recetas pastelería, negocio repostería, precio tortas

**Немецкий:**
rezeptkosten rechner, backkosten, konditorei rechner, backgeschäft, gewinnmarge, tortenpreis

**Французский:**
calculateur de coûts, pâtisserie maison, prix recettes, marge bénéficiaire, gâteaux affaires

**Китайский:**
烘焙成本, 配方计算器, 蛋糕定价, 家庭烘焙, 利润率

**Казахский:**
өзіндік құн, кондитер, торт бағасы, рецепт калькуляторы

### 7.3 Скриншоты для сторов

**Концепция (боль → решение):**

1. Скрин 1: "Работаешь в минус?" / "Losing money on orders?"
2. Скрин 2: "Узнай реальную цену торта за 1 минуту" / "Know real price in 1 minute"
3. Скрин 3: "Подорожали яйца? Цены во всех рецептах обновятся сами!" / "Prices changed? All recipes update automatically!"
4. Скрин 4: Интерфейс расчета заказа
5. Скрин 5: Генерация чека для клиента

### 7.4 Стратегия продвижения

**Органический трафик (ASO):**
- Оптимизация названия и описания под ключевые слова
- Регулярные обновления приложения
- Стимулирование положительных отзывов

**Контент-маркетинг:**
- Reels/TikTok/Shorts с расчетами популярных тортов
- Сценарий: показать шок от реальной себестоимости
- Призыв: "Ссылка в описании"

**Сообщества:**
- Telegram-чаты кондитеров
- Facebook группы
- Pinterest с красивыми рецептами

**Партнерства:**
- Инфлюенсеры (курсы для начинающих кондитеров)
- Бартер: промокоды на Pro версию

**Вирусная петля:**
- Каждый чек рекламирует приложение
- Клиенты кондитеров видят название

---

## 8. План разработки (MVP)

### 8.1 Этап 1: Основа (2-3 недели)

**Задачи:**
- [ ] Настройка проекта Quasar + Capacitor
- [ ] Создание схемы БД SQLite
- [ ] Реализация Pinia stores (ingredients, recipes, settings)
- [ ] Базовый UI (навигация, табы)
- [ ] Настройка цветовых тем (светлая/темная)
- [ ] Переключатель темы в настройках
- [ ] Поддержка системной темы устройства

### 8.2 Этап 2: Функционал ингредиентов (1-2 недели)

**Задачи:**
- [ ] Экран списка ингредиентов
- [ ] Поиск по ингредиентам (фильтрация в реальном времени)
- [ ] Форма добавления/редактирования ингредиента
- [ ] Система единиц измерения
- [ ] Расчет цены за базовую единицу
- [ ] CRUD операции с SQLite

### 8.3 Этап 3: Функционал рецептов (2-3 недели)

**Задачи:**
- [ ] Экран списка рецептов
- [ ] Поиск по рецептам (фильтрация в реальном времени)
- [ ] Конструктор рецепта
- [ ] Добавление ингредиентов в рецепт
- [ ] Автоматический расчет себестоимости
- [ ] Реактивный пересчет при изменении цен
- [ ] Расчет и отображение маржи

### 8.4 Этап 4: Калькулятор заказа (1 неделя)

**Задачи:**
- [ ] UI калькулятора заказа
- [ ] Расчет стоимости по весу/количеству
- [ ] Генерация текстового чека
- [ ] Функция "Поделиться" (share API)

### 8.5 Этап 5: Локализация (1 неделя для MVP)

**Задачи (Первая волна - MVP):**
- [ ] Настройка vue-i18n
- [ ] Создание файлов переводов для первой волны (EN, RU, ES, KK)
- [ ] Перевод всех UI элементов на 4 языка
- [ ] Локализация чеков
- [ ] Выбор валюты в настройках (₽, $, ₸)
- [ ] Автоопределение языка по локали устройства

**Вторая волна (после релиза, +1 неделя):**
- [ ] Перевод на немецкий (DE)
- [ ] Перевод на французский (FR)
- [ ] Обновление в сторах с новыми языками

**Третья волна (расширение, +1 неделя):**
- [ ] Перевод на китайский (ZH)
- [ ] Обновление ASO для китайского рынка

### 8.6 Этап 6: Монетизация и безопасность (2-3 недели)

**Задачи:**
- [ ] Интеграция AdMob
- [ ] Настройка баннеров и interstitial
- [ ] Система ограничений Free версии
- [ ] Интеграция In-App Purchase
- [ ] **Интеграция Secure Storage для Pro статуса:**
  - [ ] Установка @aparajita/capacitor-secure-storage
  - [ ] Реализация функций saveProStatus/getProStatus
  - [ ] Миграция логики проверки Pro из SQLite в Secure Storage
  - [ ] Интеграция с In-App Purchase (сохранение при успешной покупке)
  - [ ] Функция восстановления покупок через IAP API
  - [ ] Автоматическая проверка при запуске приложения
- [ ] **Интеграция RASP защиты:**
  - [ ] Установка @talsec/free-rasp-capacitor
  - [ ] Конфигурация RASP (packageName, certificateHashes, appBundleIds)
  - [ ] Создание stores/security.ts с обработчиками угроз
  - [ ] Настройка listeners для rootDetected, tamperDetected, malwareDetected
  - [ ] Логика блокировки Pro функций при обнаружении угроз
  - [ ] UI предупреждений о компрометации устройства
  - [ ] Тестирование на рутованных устройствах и эмуляторах
- [ ] Кастомизация чеков (Pro версия):
  - [ ] UI для загрузки логотипа и выбора цветов
  - [ ] Слайдеры для настройки прозрачности
  - [ ] Поля для ввода контактов (имя, телефон, Instagram, сайт)
  - [ ] Генерация брендированного чека с настройками
  - [ ] Предпросмотр чека в реальном времени
  - [ ] Сохранение настроек в БД (SQLite - настройки чека, Secure Storage - isPro)

### 8.7 Этап 7: Аналитика и полировка (1-2 недели)

**Задачи:**
- [ ] **Интеграция Firebase Analytics:**
  - [ ] Установка @capawesome-team/capacitor-firebase/analytics
  - [ ] Настройка Firebase проекта (iOS, Android)
  - [ ] Инициализация аналитики при запуске
  - [ ] Трекинг основных событий: recipe_created, order_calculated
  - [ ] User properties: user_type (free/pro), recipes_count
  - [ ] Конверсионные события: paywall_shown, purchase, pro_conversion
  - [ ] Вирусные события: receipt_shared, receipt_link_clicked
  - [ ] Интеграция AdMob revenue с Firebase
  - [ ] GDPR consent для аналитики
- [ ] **Экспорт/Импорт данных:**
  - [ ] Реализация экспорта данных в JSON
  - [ ] **Экспорт настроек чека для Pro:** логотип (base64), цвета, контакты
  - [ ] Кодирование логотипа в base64 через Filesystem API
  - [ ] Реализация импорта данных из JSON
  - [ ] **Валидация лимитов при импорте для Free пользователей:**
    - [ ] Проверка количества рецептов (макс 5)
    - [ ] Проверка количества ингредиентов (макс 15)
    - [ ] Диалог с предложением купить Pro при превышении лимита
  - [ ] **Импорт настроек чека для Pro:** декодирование base64 → сохранение файла
  - [ ] Валидация структуры JSON при импорте
  - [ ] Предупреждения пользователю о перезаписи
  - [ ] Функция "Восстановить покупки" через In-App Purchase
  - [ ] Автоматическая проверка Pro статуса при запуске
  - [ ] **Тестирование импорта Free → Pro (должен импортировать настройки чека)**
  - [ ] **Тестирование импорта Pro → Free (должен игнорировать настройки чека)**
- [ ] Тестирование на реальных устройствах
- [ ] Исправление багов
- [ ] Оптимизация производительности
- [ ] Подготовка иконок и splash screens
- [ ] Создание скриншотов для сторов
- [ ] Написание описаний для Google Play / App Store

### 8.8 Этап 8: Релиз (1 неделя)

**Задачи:**
- [ ] Публикация в Google Play
- [ ] Публикация в App Store
- [ ] Настройка ASO
- [ ] Запуск первой волны контента (TikTok/Reels)

**Итого: 12-16 недель от старта до релиза**

**Изменения во времени:**
- Этап 6 увеличен с 1-2 недель до 2-3 недель за счет добавления системы безопасности (Secure Storage + RASP)

---

## 9. Метрики успеха

### 9.1 Продуктовые метрики

**Engagement:**
- DAU/MAU (Daily/Monthly Active Users)
- Retention: Day 1, Day 7, Day 30
- Среднее количество рецептов на пользователя
- Среднее количество расчетов заказа в день

**Монетизация:**
- Conversion rate Free → Pro
- ARPU (Average Revenue Per User)
- Ad Revenue (от показов рекламы)

**Вирусность:**
- Количество отправленных чеков
- CTR по ссылкам в чеках
- K-factor (коэффициент виральности)

### 9.2 Целевые показатели (1-й год)

- 10,000+ установок
- Retention Day 7: 30%+
- Conversion to Pro: 5-10%
- Среднее количество рецептов: 8-10 на активного пользователя

### 9.3 Реализация трекинга метрик

**Технология:** Firebase Analytics (@capawesome-team/capacitor-firebase/analytics)

**Инициализация:**
```typescript
// main.ts
import { FirebaseAnalytics } from '@capawesome-team/capacitor-firebase/analytics';

async function initializeAnalytics() {
  // Включить сбор аналитики
  await FirebaseAnalytics.setEnabled({ enabled: true });

  // Установить User ID (анонимный или после регистрации)
  const userId = await getOrCreateUserId();
  await FirebaseAnalytics.setUserId({ userId });

  // Установить user properties
  const isPro = await getProStatus();
  await FirebaseAnalytics.setUserProperty({
    key: 'user_type',
    value: isPro ? 'pro' : 'free'
  });

  await FirebaseAnalytics.setUserProperty({
    key: 'language',
    value: settingsStore.language
  });
}
```

---

#### **9.3.1 Трекинг Engagement метрик**

**DAU/MAU (автоматически):**
Firebase Analytics автоматически отслеживает активных пользователей. Доступно в консоли Firebase.

**Retention (автоматически):**
Firebase автоматически считает Retention. Доступно: Firebase Console → Analytics → Retention.

**Среднее количество рецептов:**
```typescript
// Трекаем при создании/удалении рецепта
async function onRecipeCountChanged(newCount: number) {
  await FirebaseAnalytics.setUserProperty({
    key: 'recipes_count',
    value: newCount.toString()
  });
}

// При создании рецепта
async function createRecipe(recipe: Recipe) {
  await db.insert('recipes', recipe);

  const count = await getRecipesCount();
  await onRecipeCountChanged(count);

  await FirebaseAnalytics.logEvent({
    name: 'recipe_created',
    params: {
      recipe_name: recipe.name,
      total_recipes: count
    }
  });
}
```

**Среднее количество расчетов заказа:**
```typescript
// Трекаем каждый расчет
async function calculateOrder(recipe: Recipe, weight: number) {
  const totalPrice = calculateTotalPrice(recipe, weight);

  await FirebaseAnalytics.logEvent({
    name: 'order_calculated',
    params: {
      recipe_id: recipe.id,
      weight_kg: weight,
      total_price: totalPrice,
      profit: recipe.sellingPrice * weight - recipe.totalCost * weight
    }
  });
}
```

**Агрегация в Firebase Console:**
Analytics → Events → `order_calculated` → Count by user

---

#### **9.3.2 Трекинг Монетизации**

**Conversion rate Free → Pro:**
```typescript
// Трекаем покупку Pro
async function onPurchasePro(productId: string, price: number) {
  await FirebaseAnalytics.logEvent({
    name: 'purchase',
    params: {
      transaction_id: generateTransactionId(),
      value: price,
      currency: 'USD',
      items: [{
        item_id: productId,
        item_name: 'CakeCost Pro',
        price: price,
        quantity: 1
      }]
    }
  });

  // Обновить user property
  await FirebaseAnalytics.setUserProperty({
    key: 'user_type',
    value: 'pro'
  });

  // Трекаем с какого триггера купили
  await FirebaseAnalytics.logEvent({
    name: 'pro_conversion',
    params: {
      trigger: lastPaywallTrigger // 'recipe_limit' | 'ingredient_limit' | 'import_blocked' | 'receipt_branding'
    }
  });
}

// Трекаем показ paywall
async function showProPaywall(trigger: string) {
  lastPaywallTrigger = trigger;

  await FirebaseAnalytics.logEvent({
    name: 'paywall_shown',
    params: {
      trigger: trigger
    }
  });
}
```

**Конверсия считается в Firebase:**
Funnel: `paywall_shown` → `purchase`

**ARPU (вручную или через Firebase):**
Firebase Console → Analytics → Revenue → ARPU (автоматически)

**Ad Revenue:**
```typescript
// Интеграция AdMob с Firebase Analytics (автоматически)
// При подключении AdMob к Firebase, доход автоматически попадает в аналитику

// Дополнительно можно трекать показы
async function onAdShown(adType: 'banner' | 'interstitial') {
  await FirebaseAnalytics.logEvent({
    name: 'ad_impression',
    params: {
      ad_type: adType,
      ad_platform: 'admob',
      user_type: await getProStatus() ? 'pro' : 'free'
    }
  });
}
```

---

#### **9.3.3 Трекинг Вирусности**

**Количество отправленных чеков:**
```typescript
async function shareReceipt(recipe: Recipe, weight: number, totalPrice: number) {
  // Генерация чека
  const receiptImage = await generateReceiptImage(recipe, weight, totalPrice);

  // Поделиться
  await Share.share({
    title: `Заказ: ${recipe.name}`,
    files: [receiptImage],
    url: 'https://cakecost.app/download' // Deep link
  });

  // Трекаем отправку
  await FirebaseAnalytics.logEvent({
    name: 'receipt_shared',
    params: {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      order_value: totalPrice,
      has_branding: isPro && hasCustomBranding,
      share_method: 'native_share' // или 'whatsapp', 'telegram'
    }
  });
}
```

**CTR по ссылкам в чеках:**
```typescript
// Использовать Firebase Dynamic Links
import { FirebaseDynamicLinks } from '@capawesome-team/capacitor-firebase/dynamic-links';

async function createReceiptLink(recipeId: string) {
  const link = await FirebaseDynamicLinks.createShortLink({
    link: `https://cakecost.app/download?utm_source=receipt&recipe=${recipeId}`,
    domainUriPrefix: 'https://cakecost.page.link'
  });

  return link.shortLink;
}

// При открытии приложения по ссылке
async function handleDynamicLink(url: string) {
  const params = parseUrl(url);

  if (params.utm_source === 'receipt') {
    await FirebaseAnalytics.logEvent({
      name: 'receipt_link_clicked',
      params: {
        recipe_id: params.recipe,
        campaign: 'viral_loop'
      }
    });
  }
}
```

**CTR считается:**
CTR = `receipt_link_clicked` / `receipt_shared` × 100%

**K-factor (коэффициент виральности):**
```typescript
// K-factor = (количество приглашенных пользователей) / (количество пригласивших)

// Трекаем установки по реферальной ссылке
async function onAppInstalled() {
  const referralSource = await getReferralSource(); // из Dynamic Link

  await FirebaseAnalytics.logEvent({
    name: 'app_installed',
    params: {
      referral_source: referralSource || 'organic',
      campaign: referralSource ? 'viral_loop' : null
    }
  });
}

// K-factor рассчитывается в BigQuery или вручную:
// K = (installs with referral_source='viral_loop') / (users who shared receipt)
```

---

#### **9.3.4 Кастомные события для детальной аналитики**

```typescript
// Экраны
async function trackScreen(screenName: string) {
  await FirebaseAnalytics.logEvent({
    name: 'screen_view',
    params: {
      screen_name: screenName,
      screen_class: screenName
    }
  });
}

// Использование поиска
async function onSearchUsed(searchType: 'recipes' | 'ingredients', query: string) {
  await FirebaseAnalytics.logEvent({
    name: 'search',
    params: {
      search_term: query,
      search_type: searchType
    }
  });
}

// Экспорт/Импорт
async function onDataExported(recipesCount: number, ingredientsCount: number) {
  await FirebaseAnalytics.logEvent({
    name: 'data_exported',
    params: {
      recipes_count: recipesCount,
      ingredients_count: ingredientsCount,
      user_type: await getProStatus() ? 'pro' : 'free'
    }
  });
}

async function onDataImported(recipesCount: number, ingredientsCount: number, blocked: boolean) {
  await FirebaseAnalytics.logEvent({
    name: 'data_imported',
    params: {
      recipes_count: recipesCount,
      ingredients_count: ingredientsCount,
      blocked_by_limit: blocked,
      user_type: await getProStatus() ? 'pro' : 'free'
    }
  });
}

// Изменение цены ингредиента (триггер пересчета)
async function onIngredientPriceChanged(ingredientId: number, affectedRecipes: number) {
  await FirebaseAnalytics.logEvent({
    name: 'ingredient_price_updated',
    params: {
      ingredient_id: ingredientId,
      affected_recipes_count: affectedRecipes
    }
  });
}

// Использование брендирования чека (Pro feature)
async function onReceiptCustomized(hasLogo: boolean, hasCustomColors: boolean) {
  await FirebaseAnalytics.logEvent({
    name: 'receipt_customized',
    params: {
      has_logo: hasLogo,
      has_custom_colors: hasCustomColors
    }
  });
}
```

---

#### **9.3.5 Дашборд в Firebase Console**

**Автоматические отчеты:**
1. **Overview Dashboard:**
   - Active users (DAU/MAU)
   - New users
   - Revenue
   - Retention cohorts

2. **Events:**
   - Все кастомные события
   - Топ событий по частоте
   - Funnel analysis

3. **Conversions:**
   - Purchase events
   - Conversion funnels
   - Revenue по источникам

4. **User Properties:**
   - Сегментация по user_type (free/pro)
   - Среднее recipes_count
   - География, языки, устройства

**Кастомные дашборды (BigQuery):**
Для сложных метрик (K-factor, detailed retention) можно экспортировать данные в BigQuery и строить SQL запросы.

---

#### **9.3.6 Privacy & GDPR Compliance**

```typescript
// Запросить согласие пользователя (GDPR)
async function requestAnalyticsConsent() {
  const consent = await Dialog.create({
    title: 'Улучшение приложения',
    message: 'Разрешить сбор анонимной аналитики для улучшения приложения?',
    ok: { label: 'Разрешить' },
    cancel: { label: 'Отклонить' }
  });

  const enabled = await consent.onOk();

  await FirebaseAnalytics.setEnabled({ enabled });

  // Сохранить выбор
  await settingsStore.setAnalyticsEnabled(enabled);
}

// Отключить аналитику для конкретного пользователя
async function disableAnalytics() {
  await FirebaseAnalytics.setEnabled({ enabled: false });
}
```

---

**Альтернатива: Aptabase (Privacy-First)**

Если пользователи требуют полную приватность, можно использовать Aptabase:

```typescript
import { trackEvent } from '@aptabase/capacitor';

// Инициализация
await init('A-EU-1234567890'); // App Key

// Трекинг событий
await trackEvent('recipe_created', {
  recipes_count: count
});

await trackEvent('order_calculated', {
  weight_kg: weight,
  total_price: totalPrice
});

// Aptabase автоматически трекает:
// - Sessions
// - Screen views
// - Device info
// НЕ хранит IP адреса и персональные данные
```

**Сравнение:**

| Фича | Firebase Analytics | Aptabase |
|------|-------------------|----------|
| Автоматические метрики | ✅ DAU/MAU, Retention, Revenue | ✅ Sessions, Screen views |
| Интеграция с AdMob | ✅ Автоматически | ❌ |
| GDPR Compliance | ⚠️ Требует согласия | ✅ Privacy-first |
| Стоимость | 🆓 Бесплатно | 🆓 До 100k events/месяц |
| Self-hosted | ❌ | ✅ Опционально |
| Funnel Analysis | ✅ Встроенный | ⚠️ Вручную |

**Рекомендация:** Начать с Firebase Analytics (проще, больше автоматики), при необходимости мигрировать на Aptabase для GDPR compliance.

---

## 10. Риски и митигация

### 10.1 Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|-----------|
| SQLite не синхронизируется между устройствами | Низкая | Низкое | **Устранено:** Функционал экспорта/импорта данных в JSON. Восстановление Pro версии через магазины приложений. В будущем: облачная синхронизация как Premium фича |
| Попытки взлома Pro версии через редактирование БД | Средняя | Высокое | **Устранено:** Флаг `is_pro` вынесен из SQLite в Secure Storage (Keychain/KeyStore). RASP система детектирует root/jailbreak и модификации приложения. При обнаружении угроз Pro функции блокируются в runtime. |
| Проблемы с производительностью при большом количестве рецептов | Низкая | Среднее | Индексы в БД, кеширование вычислений, пагинация списков |
| Баги с конвертацией единиц | Средняя | Высокое | Тщательное тестирование, unit-тесты для функций конвертации |
| Ложные срабатывания RASP на легитимных устройствах | Низкая | Среднее | Использование проверенной библиотеки (@talsec/free-rasp). Блокировка только критичных угроз (root, tampering, malware). ADB и эмулятор - только логирование. |

### 10.2 Бизнес-риски

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|-----------|
| Низкая конверсия в Pro | Средняя | Высокое | A/B тесты paywall, оптимизация триггеров покупки. **Новый триггер:** блокировка импорта большого файла с предложением купить Pro. Брендирование чеков как ключевая ценность. |
| Низкий органический трафик | Средняя | Высокое | Инвестиции в контент-маркетинг, работа с сообществами |
| Сильные конкуренты | Средняя | Среднее | Фокус на простоту и автоматический пересчет как killer feature |

---

## 11. Будущие улучшения (Post-MVP)

### 11.1 Краткосрочные (3-6 месяцев)

- **Вторая волна локализации** (немецкий, французский)
- Генерация PDF с рецептами (техкарты)
- Категории ингредиентов (молочка, мука, декор)
- Учет "полуфабрикатов" (крем, бисквит как промежуточные рецепты)
- История изменения цен (график динамики)

### 11.2 Среднесрочные (6-12 месяцев)

- **Третья волна локализации** (китайский)
- Облачная синхронизация (Firebase/Supabase)
- Шаринг рецептов между пользователями
- Калькулятор КБЖУ (калорийность, белки, жиры, углеводы)
- Пересчет рецепта на другой размер формы
- Умный список покупок

### 11.3 Долгосрочные (12+ месяцев)

- Упрощенный CRM для заказов
- Учет виртуального склада
- Интеграция с кассами (фискализация)
- Web-версия приложения
- Marketplace рецептов

---

## 12. Контакты и ресурсы

### 12.1 Полезные ссылки

**Документация:**
- Quasar Framework: https://quasar.dev
- Vue 3: https://vuejs.org
- Capacitor: https://capacitorjs.com
- Pinia: https://pinia.vuejs.org

**Плагины:**
- Capacitor SQLite: https://github.com/capacitor-community/sqlite
- AdMob: https://github.com/capacitor-community/admob
- In-App Purchase: https://github.com/j3k0/cordova-plugin-purchase

**Безопасность:**
- Capacitor Secure Storage: https://github.com/aparajita/capacitor-secure-storage
- Talsec Free RASP: https://github.com/talsec/free-rasp-capacitor

**Маркетинг:**
- ASO гайды: App Radar, Sensor Tower
- Контент для TikTok: изучить хештеги #homebaker, #cakebusiness

---

## Приложения

### A. Примеры SQL запросов

**Пересчет всех рецептов после изменения цены:**
```sql
UPDATE recipes
SET total_cost = (
    SELECT SUM(ri.amount * i.price_per_base_unit)
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.recipe_id = recipes.id
),
updated_at = strftime('%s', 'now');
```

**Получение рецепта с ингредиентами:**
```sql
SELECT
    r.id,
    r.name,
    r.total_cost,
    r.selling_price,
    i.name as ingredient_name,
    ri.amount,
    i.price_per_base_unit,
    (ri.amount * i.price_per_base_unit) as item_cost
FROM recipes r
LEFT JOIN recipe_items ri ON r.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
WHERE r.id = ?;
```

### B. TypeScript интерфейсы

```typescript
// Ingredient model
interface Ingredient {
  id: number;
  name: string;
  purchasePrice: number;
  purchaseAmount: number;
  purchaseUnit: UnitType;
  type: MeasurementType;
  pricePerBaseUnit: number;
  createdAt: number;
  updatedAt: number;
}

type MeasurementType = 'weight' | 'volume' | 'count';
type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tens';

// Recipe model
interface Recipe {
  id: number;
  name: string;
  description?: string;
  totalCost: number;
  sellingPrice: number;
  sellingUnit: 'kg' | 'pcs';
  profitAmount: number;
  profitPercent: number;
  items: RecipeItem[];
  createdAt: number;
  updatedAt: number;
}

// RecipeItem model
interface RecipeItem {
  id: number;
  recipeId: number;
  ingredientId: number;
  amount: number; // всегда в базовых единицах
}

// Settings model (данные из SQLite)
interface Settings {
  // Основные настройки
  currencySymbol: string;
  language: 'en' | 'ru' | 'es' | 'de' | 'fr' | 'zh' | 'kk';
  theme: 'light' | 'dark' | 'auto';

  // Настройки брендирования чека (Pro версия)
  receiptLogoPath?: string;           // Путь к файлу логотипа
  receiptLogoOpacity: number;         // 0-100
  receiptLogoPosition: 'center' | 'watermark';
  receiptBgColor: string;             // HEX формат
  receiptBgOpacity: number;           // 0-100
  receiptTextColor: string;           // HEX формат

  // Контакты кондитера (Pro версия)
  receiptBusinessName?: string;
  receiptPhone?: string;
  receiptInstagram?: string;
  receiptWebsite?: string;
}

// Pro Status model (данные из Secure Storage)
interface ProStatus {
  isPro: boolean;
  purchaseDate?: string;        // ISO дата покупки
  productId?: string;           // ID продукта из магазина (cakecalc_pro)
  lastVerified?: string;        // Дата последней проверки через IAP
}

// ВАЖНО: isPro НЕ хранится в SQLite!
// isPro хранится в Secure Storage (Keychain/EncryptedSharedPreferences)
```

---

**Версия документа:** 1.1
**Дата создания:** 2025-12-21
**Последнее обновление:** 2025-12-21
**Статус:** Утвержден для разработки

---

## История изменений

### Версия 1.1 (2025-12-21)
**Добавлено:**
- ✅ Система безопасности: Secure Storage + RASP
- ✅ Валидация импорта для Free пользователей (лимит рецептов/ингредиентов)
- ✅ Экспорт/импорт настроек чека для Pro (логотип в base64)
- ✅ Архитектура многоуровневой защиты (3 уровня)
- ✅ Диаграмма безопасности и таблица атак/защиты
- ✅ Новый триггер покупки Pro: блокировка импорта большого файла
- ✅ **Раздел 9.3: Детальная реализация трекинга метрик**
  - Firebase Analytics интеграция
  - Трекинг всех метрик из раздела 9.1
  - Кастомные события для аналитики
  - GDPR compliance
  - Сравнение с Aptabase

**Изменено:**
- ⚙️ Флаг `is_pro` перенесен из SQLite в Secure Storage (Keychain/KeyStore)
- ⚙️ Таблица `settings` - удалены поля `is_pro`, `show_watermark`
- ⚙️ Этап 6 увеличен до 2-3 недель (добавлена безопасность)
- ⚙️ Этап 7 переименован: "Аналитика и полировка" (добавлена интеграция аналитики)
- ⚙️ Общее время разработки: 12-16 недель (было 11-15)

**Библиотеки:**
- 📦 @aparajita/capacitor-secure-storage
- 📦 @talsec/free-rasp-capacitor
- 📦 @capawesome-team/capacitor-firebase/analytics
- 📦 aptabase (опционально, privacy-first)

### Версия 1.0 (2025-12-21)
- 🎉 Первая версия спецификации

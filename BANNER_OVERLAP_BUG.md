# AdMob Banner Overlap Bug

**Дата создания:** 2026-02-01
**Статус:** 🔴 В работе
**Приоритет:** Высокий

---

## Описание проблемы

AdMob баннер, размещенный внизу экрана (BOTTOM_CENTER), перекрывает важные элементы интерфейса:

1. **Сообщения/уведомления** (Quasar Notify) - независимо от их позиции
2. **Кнопки сохранения** и другие UI элементы внизу форм
3. **Нижняя часть контента** на страницах с прокруткой

### Затронутые страницы
- ✅ RecipesPage (рецепты)
- ✅ IngredientsPage (ингредиенты)
- ⚠️ Другие страницы с баннером (требуется проверка)

---

## Попытка исправления #1: Изменение позиции уведомлений

### Что было сделано
**Файл:** `src/main.ts`

Изменена конфигурация Quasar Notify для показа уведомлений сверху:

```typescript
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog
  },
  config: {
    notify: {
      position: 'top',  // Show notifications at top to avoid overlap with bottom banner ad
      timeout: 3000,    // Auto-hide after 3 seconds
      progress: true    // Show progress bar
    }
  }
})
```

### Результат
❌ **Не помогло полностью**
- Уведомления могут отображаться сверху, но баннер все равно перекрывает:
  - Кнопки сохранения в формах
  - Нижнюю часть контента
  - Возможно, уведомления все еще перекрываются в некоторых случаях

---

## Техническая информация

### Конфигурация баннера

**Файл:** `src/stores/ads.ts` (строки 127-136)

```typescript
const options: BannerAdOptions = {
  adId: BANNER_AD_UNIT_ID,
  adSize: BannerAdSize.ADAPTIVE_BANNER,
  position: BannerAdPosition.BOTTOM_CENTER,  // ⚠️ Баннер внизу
  margin: 0
}

await AdMob.showBanner(options)
```

### Размер баннера
- **Тип:** `ADAPTIVE_BANNER` - адаптивный размер
- **Высота:** ~50-100dp (зависит от устройства)
- **Позиция:** Фиксированная внизу экрана
- **Z-index:** Поверх WebView контента

---

## Возможные решения

### Вариант 1: Добавить padding-bottom к контенту (РЕКОМЕНДУЕТСЯ)

**Идея:** Добавить отступ снизу ко всем страницам, когда баннер виден.

**Реализация:**

1. **Создать reactive CSS класс:**
   ```typescript
   // В ads.ts store добавить computed:
   const bannerHeight = computed(() => {
     return isBannerVisible.value ? 'calc(50px + env(safe-area-inset-bottom))' : '0px'
   })
   ```

2. **Добавить в App.vue:**
   ```vue
   <template>
     <div
       id="app"
       :style="{ paddingBottom: adsStore.bannerHeight }"
     >
       <router-view />
     </div>
   </template>
   ```

3. **Или использовать CSS переменную:**
   ```typescript
   // При показе баннера:
   document.documentElement.style.setProperty('--banner-height', '50px')

   // При скрытии:
   document.documentElement.style.setProperty('--banner-height', '0px')
   ```

**Плюсы:**
- ✅ Простое решение
- ✅ Работает для всех страниц
- ✅ Адаптируется к высоте баннера

**Минусы:**
- ⚠️ Уменьшает видимую область контента
- ⚠️ Может сдвигать layout на некоторых экранах

---

### Вариант 2: Изменить позицию баннера на TOP

**Идея:** Показывать баннер сверху вместо снизу.

**Реализация:**
```typescript
// В src/stores/ads.ts изменить:
position: BannerAdPosition.TOP_CENTER  // Было: BOTTOM_CENTER
```

**Плюсы:**
- ✅ Не перекрывает кнопки внизу
- ✅ Уведомления можно оставить внизу

**Минусы:**
- ⚠️ Менее привычная позиция для рекламы
- ⚠️ Может перекрывать header/toolbar
- ⚠️ Пользователи могут чаще закрывать приложение из-за раздражения

---

### Вариант 3: Динамический margin для QPage

**Идея:** Добавить нижний отступ только к компонентам QPage.

**Реализация:**

1. **Создать composable:**
   ```typescript
   // src/composables/useAdMargin.ts
   import { computed } from 'vue'
   import { useAdsStore } from '@/stores/ads'

   export function useAdMargin() {
     const adsStore = useAdsStore()

     const pageStyle = computed(() => ({
       paddingBottom: adsStore.isBannerVisible ? '60px' : '0px'
     }))

     return { pageStyle }
   }
   ```

2. **Использовать в компонентах:**
   ```vue
   <template>
     <QPage :style="pageStyle">
       <!-- Контент -->
     </QPage>
   </template>

   <script setup>
   import { useAdMargin } from '@/composables/useAdMargin'
   const { pageStyle } = useAdMargin()
   </script>
   ```

**Плюсы:**
- ✅ Точный контроль над каждой страницей
- ✅ Гибкость в настройке отступов

**Минусы:**
- ⚠️ Нужно добавить во все компоненты с баннером
- ⚠️ Больше кода для поддержки

---

### Вариант 4: CSS решение с z-index и viewport

**Идея:** Использовать CSS для корректировки layout с учетом баннера.

**Реализация:**
```css
/* В App.vue или global CSS */
.q-page {
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

/* Для страниц без баннера */
.no-banner .q-page {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Убедиться что уведомления выше баннера */
.q-notifications {
  z-index: 9999 !important;
}
```

**Плюсы:**
- ✅ Чистое CSS решение
- ✅ Не требует изменений в JS

**Минусы:**
- ⚠️ Отступ будет всегда, даже когда баннер скрыт
- ⚠️ Сложно синхронизировать с состоянием баннера

---

### Вариант 5: Получить высоту баннера от AdMob SDK

**Идея:** Динамически получать реальную высоту баннера из SDK.

**Реализация:**
```typescript
// В src/stores/ads.ts
AdMob.addListener(BannerAdPluginEvents.Loaded, (info) => {
  console.log('✅ AdMob: Banner ad loaded')
  isBannerVisible.value = true

  // Попытаться получить высоту баннера
  // (требуется проверить API @capacitor-community/admob)
  if (info.height) {
    bannerHeight.value = info.height
  }
})
```

**Плюсы:**
- ✅ Точная высота баннера
- ✅ Адаптируется к разным устройствам

**Минусы:**
- ⚠️ Нужно проверить, предоставляет ли SDK высоту
- ⚠️ Может не работать на всех версиях плагина

---

## Рекомендуемый план действий

### Шаг 1: Реализовать Вариант 1 (padding-bottom)
1. Добавить `bannerHeight` в ads store
2. Применить padding к основному layout
3. Протестировать на всех страницах

### Шаг 2: Если Вариант 1 не подходит
Рассмотреть Вариант 3 (composable с динамическим margin)

### Шаг 3: Альтернатива
Если проблемы продолжаются, рассмотреть изменение позиции баннера на TOP (Вариант 2)

---

## Дополнительные проблемы для проверки

- [ ] Проверить, как баннер ведет себя при открытии клавиатуры
- [ ] Проверить на устройствах с разным aspect ratio
- [ ] Проверить в landscape ориентации
- [ ] Проверить совместимость с safe area insets (iOS)
- [ ] Проверить поведение при скрытии/показе баннера динамически

---

## Файлы для модификации

### Основные файлы:
1. `src/stores/ads.ts` - управление баннером
2. `src/App.vue` - основной layout (если применять глобальный padding)
3. `src/pages/RecipesPage.vue` - страница рецептов
4. `src/pages/IngredientsPage.vue` - страница ингредиентов
5. `src/main.ts` - конфигурация Quasar (уведомления)

### Дополнительные файлы (при необходимости):
6. `src/composables/useAdMargin.ts` - composable для отступов (создать)
7. `src/css/app.css` - глобальные стили (если CSS решение)

---

## История изменений

| Дата | Действие | Результат |
|------|----------|-----------|
| 2026-02-01 | Изменена позиция уведомлений на 'top' | ❌ Не решило проблему полностью |

---

## Полезные ссылки

- [@capacitor-community/admob Documentation](https://github.com/capacitor-community/admob)
- [AdMob Banner Sizes](https://developers.google.com/admob/android/banner#banner_sizes)
- [Quasar Notify API](https://quasar.dev/quasar-plugins/notify)
- [CSS env() safe-area-inset](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

---

**Последнее обновление:** 2026-02-01 20:30
**Следующий шаг:** Реализовать Вариант 1 (padding-bottom к контенту)

# Banner Overlap Fix - Progress Log

**Дата начала:** 2026-02-01 20:35
**Выбранное решение:** Вариант 1 - Padding-bottom к контенту
**Статус:** 🔄 В процессе

---

## План реализации

### ✅ Этап 1: Подготовка
- [x] Создан документ BANNER_OVERLAP_BUG.md с описанием проблемы
- [x] Создан BANNER_FIX_PROGRESS.md для отслеживания
- [x] Выбрано решение: добавить padding-bottom к контенту страниц

### ✅ Этап 2: Модификация ads.ts store
- [x] Добавить computed свойство `bannerHeight`
- [x] Экспортировать `bannerHeight` из store
- [x] Учесть safe-area-inset-bottom для iOS

### ✅ Этап 3: Применить отступ к страницам
Вариант Б: Per-page подход (каждая страница) - ВЫБРАН
- [x] Применить к RecipesPage.vue `:style="{ paddingBottom: adsStore.bannerHeight }"`
- [x] Применить к IngredientsPage.vue `:style="{ paddingBottom: adsStore.bannerHeight }"`
- [x] adsStore уже был импортирован в обеих страницах

### ✅ Этап 4: Тестирование
- [x] Frontend собран (npm run build) - 2026-02-01 20:44
- [x] Android APK собран (./gradlew assembleDebug) - 2026-02-01 20:45
- [x] APK установлен на устройство R58N72XL5RK - 2026-02-01 20:47
- [x] Приложение запущено - 2026-02-01 20:47
- [ ] **ТРЕБУЕТСЯ ТЕСТИРОВАНИЕ ПОЛЬЗОВАТЕЛЕМ:**
  - [ ] RecipesPage - контент не перекрывается баннером
  - [ ] IngredientsPage - контент не перекрывается баннером
  - [ ] Уведомления показываются сверху и видны полностью
  - [ ] Кнопки сохранения доступны (не под баннером)
  - [ ] Скрытие/показ баннера работает корректно
  - [ ] Прокрутка страницы работает нормально
  - [ ] Нет визуальных артефактов или странного поведения

---

## Текущий шаг: Модификация ads.ts store

### Что нужно добавить в src/stores/ads.ts:

1. **Импорт ref для высоты:**
```typescript
const actualBannerHeight = ref(50) // Default 50px
```

2. **Computed свойство bannerHeight:**
```typescript
const bannerHeight = computed(() => {
  if (!isBannerVisible.value || !shouldShowAds.value) {
    return '0px'
  }
  // Используем safe-area-inset-bottom для устройств с вырезом
  return `calc(${actualBannerHeight.value}px + env(safe-area-inset-bottom, 0px))`
})
```

3. **Экспортировать в return:**
```typescript
return {
  // ... существующие экспорты
  bannerHeight, // ДОБАВИТЬ
  actualBannerHeight // ДОБАВИТЬ (если нужно менять высоту динамически)
}
```

---

## Выполненные изменения

### Изменение 1: ✅ ВЫПОЛНЕНО (2026-02-01 20:40)
**Файл:** `src/stores/ads.ts`
**Описание:** Добавлено bannerHeight computed свойство
**Детали:**
- Добавлен computed `bannerHeight` который возвращает '0px' когда баннер скрыт
- Когда баннер виден, возвращает `calc(60px + env(safe-area-inset-bottom, 0px))`
- 60px - средняя высота ADAPTIVE_BANNER
- env(safe-area-inset-bottom) - для iOS устройств с вырезом
- Экспортирован в return объекте store

### Изменение 2: ✅ ВЫПОЛНЕНО (2026-02-01 20:41)
**Файл:** `src/pages/RecipesPage.vue`
**Описание:** Добавлен динамический padding-bottom к QPage
**Детали:**
- Изменено: `<QPage padding>` → `<QPage padding :style="{ paddingBottom: adsStore.bannerHeight }">`
- adsStore уже был импортирован, дополнительных изменений не требовалось

### Изменение 3: ✅ ВЫПОЛНЕНО (2026-02-01 20:42)
**Файл:** `src/pages/IngredientsPage.vue`
**Описание:** Добавлен динамический padding-bottom к QPage
**Детали:**
- Изменено: `<QPage padding>` → `<QPage padding :style="{ paddingBottom: adsStore.bannerHeight }"`
- adsStore уже был импортирован, дополнительных изменений не требовалось

---

## Проблемы и решения

(Пока нет)

---

## Команды для продолжения работы

### Сборка и установка:
```bash
# Сборка frontend
cd /projects/CakeCalk && npm run build

# Сборка Android APK
cd /projects/CakeCalk/android && ./gradlew assembleDebug

# Установка на устройство
/mnt/c/Users/Mikhail/AppData/Local/Android/Sdk/platform-tools/adb.exe uninstall com.gliderk.cakecalc
/mnt/c/Users/Mikhail/AppData/Local/Android/Sdk/platform-tools/adb.exe install /projects/CakeCalk/android/app/build/outputs/apk/debug/app-debug.apk

# Запуск приложения
/mnt/c/Users/Mikhail/AppData/Local/Android/Sdk/platform-tools/adb.exe shell am start -n com.gliderk.cakecalc/.MainActivity
```

## Следующие действия после текущей сессии

1. ✅ Модификация `src/stores/ads.ts` - ВЫПОЛНЕНО
2. ✅ Выбран подход: per-page (RecipesPage, IngredientsPage) - ВЫПОЛНЕНО
3. ✅ Реализован выбранный подход - ВЫПОЛНЕНО
4. 🔄 Тестирование на устройстве - В ПРОЦЕССЕ

### Если тест успешен:
- [ ] Обновить BANNER_OVERLAP_BUG.md с результатами
- [ ] Закрыть баг как решенный
- [ ] Удалить debug логи (опционально)

### Если тест НЕ успешен:
- [ ] Документировать проблему в BANNER_FIX_PROGRESS.md
- [ ] Рассмотреть альтернативные решения из BANNER_OVERLAP_BUG.md
- [ ] Попробовать увеличить высоту padding (сейчас 60px)
- [ ] Рассмотреть Вариант 2: переместить баннер наверх

---

---

## Итоги текущей сессии (2026-02-01 20:47)

### ✅ Что выполнено:
1. Добавлен `bannerHeight` computed в `src/stores/ads.ts`
2. Применен динамический padding-bottom к `RecipesPage.vue`
3. Применен динамический padding-bottom к `IngredientsPage.vue`
4. Приложение собрано и установлено на устройство
5. Приложение запущено и готово к тестированию

### 🔄 Что требуется:
**ПОЛЬЗОВАТЕЛЬ должен протестировать:**
1. Открыть RecipesPage и IngredientsPage
2. Проверить что баннер не перекрывает:
   - Кнопки "Добавить" и "Сохранить"
   - Списки рецептов/ингредиентов
   - Уведомления об успехе/ошибке
3. Проверить прокрутку страницы
4. Создать/отредактировать рецепт - проверить доступность кнопок

### Если тест УСПЕШЕН ✅:
```bash
# Обновить статус в BANNER_FIX_PROGRESS.md
# Закрыть BANNER_OVERLAP_BUG.md с пометкой RESOLVED
# Commit изменения
```

### Если тест НЕ УСПЕШЕН ❌:
```bash
# Записать проблему в BANNER_FIX_PROGRESS.md секцию "Проблемы"
# Возможные действия:
# 1. Увеличить высоту padding с 60px до 80px или 100px
# 2. Попробовать Вариант 2 из BANNER_OVERLAP_BUG.md (баннер сверху)
# 3. Добавить глобальный CSS в App.vue
```

### Технические детали реализации:
**Принцип работы:**
- Когда баннер виден (`isBannerVisible = true`), `bannerHeight` возвращает `calc(60px + env(safe-area-inset-bottom))`
- Когда баннер скрыт или Pro пользователь, возвращается `0px`
- QPage получает динамический padding-bottom через `:style` binding
- Контент автоматически "поднимается" над баннером

**Преимущества решения:**
- ✅ Работает только на страницах с баннером
- ✅ Автоматически адаптируется при скрытии баннера
- ✅ Учитывает safe-area-inset для iOS устройств с вырезом
- ✅ Не влияет на страницы без баннера (Settings)

---

**Последнее обновление:** 2026-02-01 20:47
**Статус:** ⏳ Ожидает тестирования пользователем

# Руководство по тестированию CakeCost

## Проблемы, которые были исправлены

### 1. ✅ Язык в настройках показывает неправильное значение
- **Проблема:** При запуске на русском языке селектор показывал английский
- **Решение:** Синхронизация с `i18n.global.locale` через computed свойство

### 2. ✅ Реклама не показывается
- **Проблема:** Баннеры AdMob не отображались
- **Решение:**
  - Правильная последовательность инициализации
  - Загрузка Pro статуса перед инициализацией AdMob
  - Добавлены вызовы `showBanner()` на страницах

### 3. ✅ Кнопка "Обновить до Pro" не работает
- **Проблема:** Не открывался диалог покупки
- **Решение:** Полная интеграция с RevenueCat purchases

## Требования перед тестированием

### 1. Настройка RevenueCat

Для работы покупок нужно настроить RevenueCat API ключи в файле `.env`:

```bash
# .env
VITE_REVENUECAT_API_KEY_IOS=appl_XXXXXXXXXXXXXX
VITE_REVENUECAT_API_KEY_ANDROID=goog_XXXXXXXXXXXXXX
```

**Как получить ключи:**
1. Зайдите на https://app.revenuecat.com/
2. Войдите в свой проект
3. Перейдите в **Project Settings** → **API Keys**
4. Скопируйте:
   - **iOS API Key** (начинается с `appl_`)
   - **Android API Key** (начинается с `goog_`)
5. Вставьте их в файл `.env`

### 2. Настройка продуктов в RevenueCat

В RevenueCat Dashboard нужно создать:

1. **Product ID:** `cakecalc_pro`
2. **Entitlement:** `cakecalc_pro`
3. **Offering:** Default offering с продуктом `cakecalc_pro`

### 3. Настройка Google Play (для Android)

1. Создайте in-app product в Google Play Console
2. Product ID: `cakecalc_pro`
3. Привяжите его к RevenueCat

## Установка и запуск в эмуляторе

### Шаг 1: Сборка приложения

```bash
# Из корня проекта
npm run build

# Сборка debug APK
cd android
./gradlew assembleDebug
```

### Шаг 2: Установка в эмулятор

```bash
# Установить APK (автоматически удаляет старую версию)
./install-debug.sh
```

Или вручную:
```bash
adb uninstall com.gliderk.cakecalc
adb install app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.gliderk.cakecalc/.MainActivity
```

### Шаг 3: Просмотр логов

```bash
# Запустить просмотр логов (фильтрует важные сообщения)
./view-logs.sh
```

Или вручную:
```bash
adb logcat | grep -E "(chromium|CakeCost|AdMob|RevenueCat|Capacitor|🔔|✅|❌|⚠️)"
```

## Что проверять в логах

### При запуске приложения:

#### ✅ Инициализация RevenueCat
```
🔔 RevenueCat: initializeRevenueCat() called
🔔 RevenueCat: Platform: android
🔔 RevenueCat: Calling configure...
✅ RevenueCat: Initialized successfully
```

Если видите:
```
⚠️ RevenueCat: API key not configured!
```
Значит нужно настроить `.env` файл с ключами.

#### ✅ Загрузка Pro статуса
```
🔔 initializeProStatus: Starting...
🔔 initializeProStatus: Reading from Secure Storage...
🔔 initializeProStatus: Calling restorePurchases...
✅ initializeProStatus: Complete, returning: {"isPro":false}
```

#### ✅ Инициализация AdMob
```
🔔 AdMob: initializeAds() called
🔔 AdMob: isPro status: false
🔔 AdMob: shouldShowAds: true
✅ AdMob: Initialized successfully
```

Если видите:
```
AdMob: Ads disabled for Pro users
```
Значит `isPro = true` и реклама отключена (правильное поведение).

#### ✅ Показ баннера
```
🔔 AdMob: showBanner() called
🔔 AdMob: isNativePlatform: true
🔔 AdMob: shouldShowAds: true
🔔 AdMob: isInitialized: true
✅ AdMob: Banner ad shown successfully
```

### При нажатии "Обновить до Pro":

```
🔔 RevenueCat: purchasePro() called
🔔 RevenueCat: Getting offerings...
🔔 RevenueCat: Available packages: 1
🔔 RevenueCat: Pro package found
🔔 RevenueCat: Initiating purchase...
```

Если видите:
```
❌ RevenueCat: No packages available
```
Значит offerings не настроены в RevenueCat Dashboard.

## Тестирование функций

### 1. Проверка рекламы (для Free пользователей)

- [ ] Запустить приложение
- [ ] Перейти на страницу "Рецепты"
- [ ] **Ожидается:** Баннер должен появиться внизу экрана
- [ ] Перейти на страницу "Ингредиенты"
- [ ] **Ожидается:** Баннер остается видимым
- [ ] Сохранить рецепт
- [ ] **Ожидается:** Показывается межстраничная реклама (если прошло 30+ секунд с последней)

### 2. Проверка покупки Pro

- [ ] Перейти в "Настройки"
- [ ] Прокрутить к разделу "Настройка чека"
- [ ] Нажать кнопку "Обновить до PRO"
- [ ] **Ожидается:** Показывается loading диалог
- [ ] **Ожидается:** Открывается диалог покупки Google Play
- [ ] Выбрать тестовый способ оплаты (если настроено)
- [ ] Завершить покупку
- [ ] **Ожидается:**
  - Сообщение "Успешно обновлено до PRO!"
  - Badge меняется с "PRO" на "✓ PRO"
  - Баннер рекламы исчезает
  - Разблокируются настройки чека

### 3. Проверка языка

- [ ] Запустить приложение (система на русском)
- [ ] Перейти в "Настройки"
- [ ] **Ожидается:** В селекторе языка показано "Русский"
- [ ] Изменить язык на "English"
- [ ] **Ожидается:** Интерфейс переключается на английский
- [ ] Перезапустить приложение
- [ ] **Ожидается:** Язык остался английским

## Известные ограничения

### В эмуляторе без настроенного RevenueCat:
- ❌ Покупки не работают (покажется ошибка "No packages available")
- ✅ Реклама должна показываться
- ✅ Язык работает
- ✅ Все остальные функции работают

### Решение для тестирования покупок:
1. Настроить RevenueCat API ключи (см. выше)
2. Создать offerings в RevenueCat Dashboard
3. Настроить sandbox тестирование в Google Play Console

## Сборка release версии

После тестирования и проверки всех функций:

```bash
# Пересоберка web assets
npm run build

# Сборка подписанных релизных файлов
cd android
./gradlew bundleRelease assembleRelease

# Файлы будут созданы:
# - app/build/outputs/bundle/release/app-release.aab (для Google Play)
# - app/build/outputs/apk/release/app-release.apk (для прямой установки)
```

## Проблемы и решения

### Проблема: "RevenueCat: API key not configured"
**Решение:** Добавьте ключи RevenueCat в `.env` файл

### Проблема: "No packages available"
**Решение:** Настройте offerings в RevenueCat Dashboard

### Проблема: Реклама не показывается
**Решение:**
1. Проверьте логи - должно быть `✅ AdMob: Initialized successfully`
2. Убедитесь что `isPro = false`
3. Проверьте Ad Unit IDs в `.env`

### Проблема: Покупка не завершается
**Решение:**
1. Убедитесь что RevenueCat настроен правильно
2. Проверьте что Product ID совпадает: `cakecalc_pro`
3. Проверьте интеграцию Google Play в RevenueCat

## Контакты для поддержки

Если возникли проблемы:
1. Проверьте логи через `./view-logs.sh`
2. Убедитесь что все конфигурации настроены
3. Проверьте RevenueCat Dashboard на наличие ошибок

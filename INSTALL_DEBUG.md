# Установка свежего debug билда

## 📦 Файл готов к установке

**Путь:** `/projects/CakeCalk/CakeCost-debug-RC.apk`
**Размер:** 54 MB
**Дата сборки:** 23 января 2026, 23:18

Этот билд содержит ВСЕ исправления:
- ✅ **ИСПРАВЛЕНО:** Ошибка "Connection cakecost already exists"
- ✅ **ИСПРАВЛЕНО:** Состояние гонки при инициализации базы данных
- ✅ **ИСПРАВЛЕНО:** Ошибка "t.dialog is not a function" при нажатии "Обновить до PRO"
- ✅ **ДОБАВЛЕНО:** Плагин Dialog в конфигурацию Quasar
- ✅ **УЛУЧШЕНО:** Обработка ошибок покупок с понятными сообщениями на всех языках
- ✅ **НАСТРОЕНО:** RevenueCat Android API Key

Теперь ВСЕ функции должны работать полностью:
✅ RevenueCat инициализируется успешно
✅ Pro Status → AdMob → Banner showing
✅ Кнопка "Обновить до PRO" → Loading dialog → RevenueCat Purchase Flow

⚠️ **ВАЖНО:** Для работы покупок нужно также настроить:
- Продукт `cakecalc_pro` в RevenueCat Dashboard
- Entitlement `cakecalc_pro`
- Offering с этим продуктом
- In-app product в Google Play Console

См. файл `REVENUECAT_SETUP.md` для полной настройки.

---

## 🚀 Установка через adb (рекомендуется)

### Шаг 1: Удалите старую версию
```bash
adb uninstall com.gliderk.cakecalc
```

### Шаг 2: Установите новую версию
```bash
cd /projects/CakeCalk
adb install CakeCost-debug-RC.apk
```

### Шаг 3: Запустите приложение
```bash
adb shell am start -n com.gliderk.cakecalc/.MainActivity
```

---

## 📋 Просмотр логов

В ОТДЕЛЬНОМ терминале запустите:

```bash
cd /projects/CakeCalk/android
./view-logs.sh
```

Или напрямую через adb:
```bash
adb logcat | grep -E "(chromium|CakeCost|AdMob|RevenueCat|Capacitor|🔔|✅|❌|⚠️)"
```

---

## ✅ Что проверять в логах

### 1. Инициализация RevenueCat (должна быть ПЕРВОЙ)
```
💳 Initializing RevenueCat...
🔔 RevenueCat: initializeRevenueCat() called
🔔 RevenueCat: Platform: android
🔔 RevenueCat: API Key (first 20 chars): YOUR_ANDROID_API_KEY
⚠️ RevenueCat: API key not configured!  <-- ЕСЛИ ВИДИТЕ ЭТО, нужно настроить .env
✅ RevenueCat: Initialized successfully  <-- ДОЛЖНО БЫТЬ ЭТО
```

### 2. Загрузка Pro статуса
```
🔐 Loading Pro status from Secure Storage...
🔔 initializeProStatus: Starting...
🔔 initializeProStatus: Reading from Secure Storage...
🔔 initializeProStatus: No existing status, first run
🔔 initializeProStatus: Has Pro entitlement: false
✅ Pro status loaded: false
```

### 3. Инициализация AdMob
```
📢 Initializing AdMob...
🔔 AdMob: initializeAds() called
🔔 AdMob: isPro status: false  <-- ВАЖНО! Должно быть false для показа рекламы
🔔 AdMob: shouldShowAds: true
🔔 AdMob: Calling initialize...
✅ AdMob: Initialized successfully
```

### 4. Показ баннера (при переходе на страницы)
```
🔔 AdMob: showBanner() called
🔔 AdMob: isNativePlatform: true
🔔 AdMob: shouldShowAds: true
🔔 AdMob: isInitialized: true
🔔 AdMob: Showing banner with options: ...
✅ AdMob: Banner ad shown successfully
```

---

## ❌ Возможные проблемы

### Проблема 1: RevenueCat не инициализируется
**Лог:**
```
⚠️ RevenueCat: API key not configured!
⚠️ RevenueCat: Skipping initialization. Purchases will not be available.
```

**Решение:**
RevenueCat API ключи не настроены в `.env` файле. Это **НЕ критично** для тестирования рекламы:
- ✅ Реклама будет работать (isPro = false по умолчанию)
- ❌ Покупки работать не будут

### Проблема 2: Реклама не показывается
**Проверьте логи:**

1. Если видите:
```
⚠️ AdMob: Should not show ads (Pro user or setting disabled)
```
**Причина:** isPro = true (пользователь Pro)
**Решение:** Это правильное поведение. Реклама отключена для Pro.

2. Если видите:
```
⚠️ AdMob: Not initialized, skipping banner
```
**Причина:** AdMob не инициализирован
**Решение:** Проверьте AdMob Ad Unit IDs в `.env`

3. Если НЕ видите `🔔 AdMob: showBanner() called`:
**Причина:** Метод showBanner() не вызывается
**Решение:** Перейдите на страницу "Рецепты" или "Ингредиенты"

### Проблема 3: Старые логи без 🔔
**Признак:** В логах видите только старые сообщения без эмодзи
**Причина:** Установлена старая версия APK
**Решение:** Повторите установку с шага 1

---

## 🎯 Краткая инструкция (копипаст)

```bash
# В первом терминале
cd /projects/CakeCalk
adb uninstall com.gliderk.cakecalc
adb install CakeCost-debug-RC.apk
adb shell am start -n com.gliderk.cakecalc/.MainActivity

# Во втором терминале
cd /projects/CakeCalk/android
./view-logs.sh
```

---

## 📊 После установки

Скопируйте логи с момента запуска приложения (примерно 50-100 строк) и покажите мне.
Особенно важны строки с эмодзи: 🔔 ✅ ❌ ⚠️

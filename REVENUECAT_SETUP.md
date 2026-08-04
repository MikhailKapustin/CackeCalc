# Настройка RevenueCat для покупок Pro

## ⚠️ ТЕКУЩАЯ ОШИБКА

При попытке покупки вы видите ошибку:
```
ConfigurationError: You have configured the SDK with a Play Store API key,
but there are no Play Store products registered in the RevenueCat dashboard
for your offerings.
```

**Причина:** API ключ настроен, но **продукты не созданы** в RevenueCat Dashboard.

**Решение:** Следуйте инструкциям ниже для настройки продуктов и offerings.

---

## Текущий статус

✅ **RevenueCat SDK инициализирован** - API ключ работает
❌ **Продукты НЕ настроены** - offerings пустые

✅ **Все остальные функции работают:**
- Реклама AdMob (для Free пользователей)
- Управление ингредиентами и рецептами
- Калькулятор заказов
- Экспорт/импорт данных
- Настройки языка, валюты, темы

## 🔧 Пошаговая настройка RevenueCat

### ✅ Шаг 1: Google Play Console - Создание продукта

**Сначала создайте продукт в Google Play, затем в RevenueCat!**

1. Откройте [Google Play Console](https://play.google.com/console/)
2. Выберите ваше приложение **CakeCost**
3. Перейдите: **Monetize** → **In-app products** → **Create product**
4. Заполните:
   - **Product ID:** `cakecalc_pro` (точно как в коде!)
   - **Name:** "CakeCost Pro Version"
   - **Description:** "Unlock Pro features: custom receipts, export/import data"
   - **Status:** Active
   - **Type:** One-time purchase (Managed product)
   - **Price:** Установите цену (например, 499 ₽ или $4.99)
5. Нажмите **Save** и **Activate**

⚠️ **ВАЖНО:** Product ID должен быть точно `cakecalc_pro` - это ID используется в коде!

---

### ✅ Шаг 2: RevenueCat - Подключение Google Play

1. Откройте [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Выберите ваш проект **CakeCost**
3. Перейдите: **Project settings** (⚙️) → **Service credentials** → **Google**
4. Следуйте инструкциям для создания **Service Account**:
   - Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
   - Создайте Service Account
   - Скачайте JSON ключ
   - Загрузите JSON в RevenueCat
5. Дождитесь статуса: **✅ Connected**

📖 Подробная инструкция: https://www.revenuecat.com/docs/creating-play-service-credentials

---

### ✅ Шаг 3: RevenueCat - Создание Entitlement

1. В RevenueCat Dashboard перейдите: **Entitlements** → **+ New**
2. Заполните:
   - **Identifier:** `cakecalc_pro`
   - **Display name:** "Pro Features"
3. Нажмите **Save**

💡 **Что такое Entitlement?** Это "право доступа". Пользователь покупает продукт и получает entitlement.

---

### ✅ Шаг 4: RevenueCat - Создание Product

1. В RevenueCat Dashboard перейдите: **Products** → **+ New**
2. Заполните:
   - **Store:** Google Play Store
   - **Product ID:** `cakecalc_pro` (точно как в Google Play!)
   - **Type:** Non-consumable
3. Выберите **Entitlement:** `cakecalc_pro`
4. Нажмите **Save**

⚠️ **КРИТИЧНО:** Product ID должен совпадать с Google Play Console!

---

### ✅ Шаг 5: RevenueCat - Создание Offering

**ЭТО ГЛАВНЫЙ ШАГ! Без offering будет ошибка.**

1. В RevenueCat Dashboard перейдите: **Offerings** → **+ New offering**
2. Заполните:
   - **Identifier:** `default` (обязательно!)
   - **Description:** "Default offering for CakeCost Pro"
   - **✅ Set as current offering** - ВКЛЮЧИТЕ!
3. Нажмите **Save**
4. В созданном offering нажмите **+ Add package**
5. Заполните:
   - **Identifier:** `$rc_lifetime` (стандартный ID для one-time purchase)
   - **Product:** Выберите `cakecalc_pro`
6. Нажмите **Save**

✅ **Проверьте:** В списке Offerings должен быть `default` с зеленой галочкой **Current**

---

### ✅ Шаг 6: Проверка настройки

Вернитесь на страницу **Offerings** и убедитесь:

- [x] Offering `default` существует
- [x] Статус: **Current** (зеленая галочка)
- [x] Содержит package с продуктом `cakecalc_pro`
- [x] Продукт привязан к entitlement `cakecalc_pro`
- [x] Google Play Service Account подключен (✅ Connected)

---

### ✅ Шаг 7: Пересоберите и протестируйте

```bash
cd /projects/CakeCalk
npm run build
npx cap sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

### ✅ Шаг 8: Тестирование покупки

1. Запустите приложение
2. Проверьте логи при старте:
   ```
   ✅ RevenueCat: Initialized successfully
   ```
3. Перейдите в **Настройки** → **Обновить до PRO**
4. В логах должно быть:
   ```
   🔔 RevenueCat: Available packages: 1
   🔔 RevenueCat: Pro package found
   ```
5. Если видите эту ошибку:
   ```
   No packages available
   ```
   → Вернитесь к **Шагу 5** и проверьте, что offering `default` является **Current**!

## 📋 Быстрый чеклист настройки

Проверьте все пункты:

**Google Play Console:**
- [ ] Создан In-app product с ID `cakecalc_pro`
- [ ] Статус продукта: **Active**
- [ ] Установлена цена
- [ ] Тип: **One-time purchase** (Managed)

**RevenueCat Dashboard:**
- [ ] Service Account подключен (✅ Connected)
- [ ] Создан Entitlement `cakecalc_pro`
- [ ] Создан Product `cakecalc_pro` (Google Play)
- [ ] Product привязан к Entitlement
- [ ] Создан Offering `default`
- [ ] Offering является **Current** (зеленая галочка)
- [ ] В Offering добавлен package с продуктом `cakecalc_pro`

**.env файл:**
- [ ] `VITE_REVENUECAT_API_KEY_ANDROID` содержит ключ (начинается с `goog_`)
- [ ] Приложение пересобрано после изменения .env

---

## 🔍 Диагностика ошибок

### Ошибка: "No Play Store products registered"

```
ConfigurationError: there are no Play Store products registered
in the RevenueCat dashboard for your offerings
```

**Причина:** Offering не создан или не является Current.

**Решение:**
1. Откройте RevenueCat → **Offerings**
2. Убедитесь, что есть offering `default` с зеленой галочкой **Current**
3. Откройте его и проверьте, что там есть package с продуктом `cakecalc_pro`
4. Если offering нет - создайте (см. **Шаг 5**)

---

### Ошибка: "No packages available"

```
❌ RevenueCat: No packages available
```

**Причина:** Current offering пустой или не содержит packages.

**Решение:**
1. RevenueCat → **Offerings** → Откройте `default`
2. Нажмите **+ Add package**
3. Выберите продукт `cakecalc_pro`
4. Сохраните

---

### Ошибка: "Pro package not found"

```
❌ RevenueCat: Pro package not found. Looking for: cakecalc_pro
```

**Причина:** Product ID в Google Play не совпадает с кодом.

**Решение:**
1. Проверьте Google Play Console → In-app products
2. Product ID должен быть точно `cakecalc_pro` (без пробелов, строчные буквы)
3. Проверьте RevenueCat → Products - ID должен совпадать

---

### Ошибка: "Store problem" или "Item unavailable"

**Причина:** Продукт не активирован в Google Play или приложение не опубликовано в Internal testing.

**Решение:**
1. Google Play Console → In-app products → `cakecalc_pro` → **Activate**
2. Опубликуйте приложение в **Internal testing** track
3. Добавьте тестовый аккаунт в список тестеров
4. Установите приложение из Internal testing (через ссылку)

---

## 📊 Проверка в логах

### ✅ Успешная инициализация

При запуске приложения:
```
💳 Initializing RevenueCat...
🔔 RevenueCat: Platform: android
🔔 RevenueCat: API Key (first 20 chars): goog_XXXXXXXXXX
✅ RevenueCat: Initialized successfully
```

### ✅ Успешная загрузка offerings

При нажатии "Обновить до PRO":
```
🔔 RevenueCat: Getting offerings...
🔔 RevenueCat: Available packages: 1
🔔 RevenueCat: Package identifiers: ["cakecalc_pro"]
🔔 RevenueCat: Pro package found
🔔 RevenueCat: Initiating purchase...
```

### ❌ Ошибка в логах

Если видите:
```
😿‼️ Error fetching offerings - PurchasesError(code=ConfigurationError, ...)
there are no Play Store products registered in the RevenueCat dashboard
```

→ Вернитесь к **Шагу 5** и создайте Current offering!

## 🧪 Тестирование покупок

### Метод 1: Internal Testing (рекомендуется)

1. **Google Play Console:**
   - Setup → **Internal testing** → Create new release
   - Загрузите `.aab` файл (release build)
   - Добавьте тестеров: Setup → **Testers** → Add email addresses

2. **Установка:**
   - Откройте ссылку на Internal testing в браузере (отправьте на телефон)
   - Нажмите **Download** → установите приложение
   - Войдите в Google аккаунт, который добавлен как тестер

3. **Тестирование:**
   - Покупка будет **реальной** но **отменяется автоматически** через несколько минут
   - Деньги не списываются с тестового аккаунта
   - Можно покупать неограниченное количество раз

### Метод 2: License Testers (быстрее)

1. **Google Play Console:**
   - Setup → **License testing** → Add Gmail accounts

2. **RevenueCat:**
   - ⚠️ License testers видят **реальные** цены, но деньги не списываются

3. **Использование:**
   - Установите APK через `adb install`
   - Покупка будет бесплатной для указанных аккаунтов

---

## 🔄 Восстановление покупок

Пользователи могут восстановить Pro статус на новом устройстве:

1. Установите приложение
2. **Настройки** → **Восстановить покупки**
3. RevenueCat проверит историю покупок Google Play
4. Если покупка найдена → Pro статус активируется

Код в `src/utils/purchases.ts:134` (функция `restorePurchases`).

---

## 📱 Команды для тестирования

### Полная пересборка и установка

```bash
cd /projects/CakeCalk
npm run build
npx cap sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb logcat | grep -E "(Capacitor|RevenueCat|CakeCost)"
```

### Просмотр логов RevenueCat

```bash
adb logcat | grep -E "(RevenueCat|Purchases)"
```

### Очистка данных приложения

```bash
adb shell pm clear com.gliderk.cakecalc
```

### Проверка установленных продуктов

```bash
adb shell dumpsys package com.gliderk.cakecalc | grep -A 5 "versionName"
```

---

## ⚠️ Известные проблемы

### Google Play требует Internal Testing для покупок

❌ **Не работает:** Установка через `adb install` + обычный Google аккаунт
✅ **Работает:** Установка через Internal Testing ссылку

**Причина:** Google Play проверяет, что приложение установлено из Play Store.

---

### RevenueCat показывает "anonymous user"

Это **нормально**. RevenueCat автоматически создает анонимных пользователей с ID вида:
```
$RCAnonymousID:632a2dd9e9f5459b957ab1916bedd193
```

Покупки сохраняются и после переустановки приложения на том же Google аккаунте.

---

### Покупка проходит, но Pro не активируется

**Проверьте:**
1. RevenueCat → Products → `cakecalc_pro` → **Entitlement** должен быть `cakecalc_pro`
2. В коде `src/utils/purchases.ts:102` проверяется `customerInfo.entitlements.active['cakecalc_pro']`
3. Логи должны показать:
   ```
   🔔 RevenueCat: Active entitlements: ["cakecalc_pro"]
   🔔 RevenueCat: Has Pro entitlement: true
   ```

---

## 📦 Для release версии

**ОБЯЗАТЕЛЬНО** перед публикацией в Google Play:

- [x] RevenueCat полностью настроен (все шаги 1-5)
- [x] Продукт активирован в Google Play Console
- [x] Протестирована покупка через Internal Testing
- [x] Протестировано восстановление покупок
- [x] `.env` файл содержит правильные API ключи
- [x] Release build пересобран: `./gradlew bundleRelease`

**Без настроенного RevenueCat:**
- ❌ Пользователи не смогут купить Pro
- ❌ Приложение будет только с рекламой
- ❌ Отзывы будут негативными ("нельзя купить Pro")

---

## 🔗 Полезные ссылки

**RevenueCat:**
- [Официальная документация](https://www.revenuecat.com/docs/)
- [Android SDK Setup](https://www.revenuecat.com/docs/getting-started/installation/android)
- [Configuring Products](https://www.revenuecat.com/docs/entitlements)
- [Configuring Offerings](https://rev.cat/how-to-configure-offerings)
- [Troubleshooting Empty Offerings](https://rev.cat/why-are-offerings-empty)

**Google Play:**
- [In-app Billing Setup](https://developer.android.com/google/play/billing/getting-ready)
- [Service Account Setup](https://www.revenuecat.com/docs/creating-play-service-credentials)
- [Testing In-app Purchases](https://developer.android.com/google/play/billing/test)

**Capacitor:**
- [RevenueCat Capacitor Plugin](https://github.com/RevenueCat/purchases-capacitor)

---

## ❓ FAQ

**Q: Могу ли я тестировать без Google Play Console?**
A: Нет. Для Android покупки работают только через Google Play Billing API.

**Q: Можно ли использовать другую систему покупок?**
A: Можно, но RevenueCat упрощает кросс-платформенные покупки (iOS + Android).

**Q: Сколько стоит RevenueCat?**
A: Бесплатно до $2,500 месячного дохода. После этого - 1% от дохода.

**Q: Как изменить цену продукта?**
A: В Google Play Console → In-app products → `cakecalc_pro` → Edit price. RevenueCat подтянет изменения автоматически.

**Q: Как удалить тестовую покупку?**
A: License testers и Internal testing покупки отменяются автоматически. Для реальных покупок - через Google Play support.

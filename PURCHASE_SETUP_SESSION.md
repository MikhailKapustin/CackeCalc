# Сессия настройки покупок Pro версии

---

## Сессия 1 — 04.02.2026

### Цель
Настроить и протестировать систему покупок Pro версии через RevenueCat + Google Play.

### Что было сделано ✅

#### RevenueCat
- Создан Entitlement: `cakecalc_pro`
- Создан Product: `cakecalc_pro`, тип Non-consumable, привязан к entitlement
- Создан Offering: `default` (Current), Package: Lifetime (`$rc_lifetime`)

#### Google Play Console
- Продукт `cakecalc_pro` создан в разделе **"Контент, оплачиваемый однократно"** (In-app products), статус Active
- Service Account `revenue-cart@cakecalc-485915.iam.gserviceaccount.com` добавлен с правами на финансы и управление заказами
- В RevenueCat: Service Account credentials — Valid ✅

#### Сборка и публикация
- Приложение опубликовано в **Internal Testing** (Google Play Console)
- RevenueCat API ключ исправлен: был ключ Test Store (`goog_PObkpEuLFfHFMrLbagQKgsTwuOS`), заменён на ключ CakeCalc (Play Store)

### Итог сессии 1
Покупка всё равно не работает. Переходим к отладке.

---

## Сессия 2 — 18.02.2026

### Цель
Найти и устранить причину ошибки при нажатии "Upgrade to Pro".

### Симптомы
- Диалог Google Play не появляется
- Сразу показывается ошибка: "Не удалось обработать покупку. Пожалуйста, попробуйте снова"

### Что проверили и исправили

#### 2.1. Включён verbose logging в RevenueCat
Файл `src/utils/purchases.ts`:
```typescript
const { LOG_LEVEL } = await import('@revenuecat/purchases-capacitor')
await Purchases.configure({ apiKey })
await Purchases.setLogLevel({ level: LOG_LEVEL.VERBOSE })
```
**Результат:** Логи не стали подробнее — проблема глубже.

#### 2.2. Анализ логов с устройства (версия 1.5, versionCode 6)
```
W/BillingClient(11175): Client is already in the process of connecting to billing service.
I/[Purchases] - INFO(11175): ℹ️ Missing productDetails: UnfetchedProduct{productId='cakecalc_pro', productType='subs', statusCode=3}
I/[Purchases] - INFO(11175): ℹ️ Product not found: cakecalc_pro - Product Type: subs, Reason: PRODUCT_NOT_FOUND
```

**Наблюдения:**
- `productType='subs'` — RevenueCat пытается найти продукт среди подписок (Subscription), хотя он должен быть `inapp`
- `statusCode=3` = `BILLING_UNAVAILABLE`
- `W/BillingClient: Client is already in the process of connecting` — двойное подключение к BillingClient

#### 2.3. Проверка типа продукта в Google Play Console
Скриншот подтвердил: `cakecalc_pro` находится в разделе **"Контент, оплачиваемый однократно"** (In-app products, не Subscriptions) — тип правильный ✅

#### 2.4. Проверка RevenueCat — тип продукта
При создании нового продукта в RevenueCat доступны: Subscription / Consumable / Non-consumable. Продукт был и остаётся Non-consumable ✅

Несмотря на это, логи показывают `productType='subs'`. RevenueCat, видимо, пробует оба типа (`inapp` и `subs`) — лог показывает только ошибку `subs`. Реальная причина ошибки — `BILLING_UNAVAILABLE` (statusCode=3).

#### 2.5. Найдена причина BILLING_UNAVAILABLE — двойное подключение к BillingClient

В `src/main.ts` порядок инициализации:
1. `initializeRevenueCat()` → `Purchases.configure()` → BillingClient начинает подключение
2. `initializeProStatus()` → немедленно вызывает `Purchases.getCustomerInfo()` и `Purchases.restorePurchases()` → BillingClient пытается подключиться повторно → `Client is already in the process of connecting` → `BILLING_UNAVAILABLE`

#### 2.6. Исправление — убрали RevenueCat из initializeProStatus()
Файл `src/utils/secureStorage.ts`: удалён блок с `getCustomerInfo()` и `restorePurchases()` из `initializeProStatus()`. Теперь при старте читается только SecureStorage. RevenueCat вызывается только при явном нажатии кнопок.

Собрана версия **1.6 (versionCode 7)** с этим исправлением.

**Результат версии 1.6:** Ошибка всё равно появляется. Причина окончательно не установлена.

---

## Текущий статус (18.02.2026)

### ✅ Что настроено и работает:
- RevenueCat: Entitlement, Product (Non-consumable), Offering — всё настроено
- Google Play Console: продукт `cakecalc_pro` Active, тип In-app product
- Service Account: Valid credentials, все права есть
- Приложение опубликовано в Internal Testing
- Правильный API ключ RevenueCat в `.env`
- Двойное подключение BillingClient устранено (v1.6)

### ❌ Что не работает:
- Покупка Pro версии — диалог Google Play не появляется, сразу ошибка

---

## Версии в процессе отладки

| versionCode | versionName | Что изменено |
|---|---|---|
| 1 | 1.0 | Первая версия |
| 2 | 1.1 | Исправлен versionCode (был конфликт) |
| 3 | 1.2 | Исправлен API ключ RevenueCat |
| 4 | 1.3 | Повторная сборка после настроек |
| 5 | 1.4 | Пересоздан продукт в RevenueCat |
| 6 | 1.5 | Добавлен verbose logging (setLogLevel VERBOSE) |
| 7 | 1.6 | Убрали RevenueCat вызовы из initializeProStatus |

---

## Гипотезы для следующей сессии

### Гипотеза 1: Аккаунт тестировщика не принял приглашение
Для Internal Testing тестировщик должен:
1. Быть добавлен в Google Play Console → Internal Testing → Testers
2. **Принять opt-in ссылку** на конкретном устройстве
3. Войти с этим же Google аккаунтом на устройстве

Даже если приложение скачано — In-App Purchases могут не работать без принятия приглашения.

**Проверить:** Открыть в Google Play Console → Internal Testing → Testers → скопировать ссылку для opt-in → открыть на тестовом устройстве → принять

### Гипотеза 2: License Testing не настроен
В Google Play Console → Setup → License testing можно добавить тестовые аккаунты, которые могут делать покупки бесплатно.

**Проверить:** Google Play Console → Setup → License testing → добавить email тестового аккаунта

### Гипотеза 3: Задержка активации продукта
Google Play иногда требует несколько часов/дней после первой публикации продукта, чтобы он стал доступен для покупки.

### Гипотеза 4: RevenueCat не видит продукт через Service Account
Несмотря на "Valid credentials", RevenueCat может не иметь возможности видеть in-app products. Проверить в RevenueCat → Apps & providers → CakeCalc → диагностика.

---

## Конфигурация проекта

### Код
- **Package name:** `com.gliderk.cakecalc`
- **PRO_PRODUCT_ID:** `cakecalc_pro` (в `purchases.ts` и `secureStorage.ts`)
- **RevenueCat SDK:** `@revenuecat/purchases-capacitor@11.3.2`

### RevenueCat
- **App:** CakeCalc (Play Store)
- **Entitlement:** `cakecalc_pro`
- **Product:** `cakecalc_pro` (Non-consumable)
- **Offering:** `default` → Package Lifetime → Product `cakecalc_pro`

### Google Play
- **Package:** `com.gliderk.cakecalc`
- **Product:** `cakecalc_pro` — In-app product, Active
- **Service Account:** `revenue-cart@cakecalc-485915.iam.gserviceaccount.com`

---

## Команды для сборки

```bash
# Сборка и синхронизация
npm run build && npx cap sync android

# Release AAB (для Google Play)
cd android && ./gradlew bundleRelease
# Файл: android/app/build/outputs/bundle/release/app-release.aab

# Логи с устройства
adb.exe logcat | grep -E "(BillingClient|Purchases|RevenueCat)"

# Запуск приложения
adb.exe shell am start -n com.gliderk.cakecalc/.MainActivity
```

**adb путь:** `/mnt/c/Users/Mikhail/AppData/Local/Android/Sdk/platform-tools/adb.exe`

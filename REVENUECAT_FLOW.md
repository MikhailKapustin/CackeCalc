# 🔄 RevenueCat Setup Flow - Визуальная схема настройки

## 📊 Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                    НАСТРОЙКА ПОКУПОК                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   1. GOOGLE PLAY CONSOLE                │
        │   Создать продукт cakecalc_pro          │
        │   Тип: One-time purchase                │
        │   Статус: Active ✅                      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   2. GOOGLE CLOUD CONSOLE               │
        │   Создать Service Account               │
        │   Скачать JSON ключ                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   3. REVENUECAT - Service Account       │
        │   Загрузить JSON ключ                   │
        │   Статус: ✅ Connected                   │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   4. REVENUECAT - Entitlement           │
        │   Identifier: cakecalc_pro              │
        │   Описание: "Pro Features"              │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   5. REVENUECAT - Product               │
        │   Product ID: cakecalc_pro              │
        │   Store: Google Play                    │
        │   Entitlement: cakecalc_pro             │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   6. REVENUECAT - Offering (КРИТИЧНО!)  │
        │   Identifier: default                   │
        │   ✅ Set as current                      │
        │   + Add package: $rc_lifetime           │
        │     Product: cakecalc_pro               │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   7. ПЕРЕСБОРКА ПРИЛОЖЕНИЯ              │
        │   npm run build                         │
        │   npx cap sync                          │
        │   ./gradlew assembleDebug               │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   ✅ ГОТОВО К ТЕСТИРОВАНИЮ               │
        └─────────────────────────────────────────┘
```

---

## 🏗️ Архитектура RevenueCat

```
┌──────────────────────────────────────────────────────────────────┐
│                      GOOGLE PLAY STORE                            │
│                                                                   │
│  In-app Product                                                  │
│  ┌────────────────────────┐                                      │
│  │ ID: cakecalc_pro       │                                      │
│  │ Type: One-time         │                                      │
│  │ Price: 499 ₽           │                                      │
│  └────────────────────────┘                                      │
└─────────────────┬────────────────────────────────────────────────┘
                  │ Service Account (JSON key)
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                      REVENUECAT DASHBOARD                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ENTITLEMENT                                                 │ │
│  │ ┌─────────────────┐                                         │ │
│  │ │ cakecalc_pro    │  ← "Право доступа"                      │ │
│  │ └─────────────────┘                                         │ │
│  └──────────────┬──────────────────────────────────────────────┘ │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────────┐ │
│  │ PRODUCT                                                     │ │
│  │ ┌─────────────────────────────────────┐                     │ │
│  │ │ ID: cakecalc_pro                    │                     │ │
│  │ │ Store: Google Play                  │                     │ │
│  │ │ Entitlement: cakecalc_pro           │                     │ │
│  │ └─────────────────────────────────────┘                     │ │
│  └──────────────┬──────────────────────────────────────────────┘ │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────────┐ │
│  │ OFFERING (default) ⭐ CURRENT                               │ │
│  │ ┌─────────────────────────────────────┐                     │ │
│  │ │ Package: $rc_lifetime               │                     │ │
│  │ │   └─ Product: cakecalc_pro          │                     │ │
│  │ └─────────────────────────────────────┘                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────────────────────────┘
                   │ RevenueCat SDK (Capacitor Plugin)
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CAKECOST APP                                 │
│                                                                   │
│  src/utils/purchases.ts                                          │
│  ┌────────────────────────────────────────┐                      │
│  │ const PRO_PRODUCT_ID = 'cakecalc_pro'  │                      │
│  │                                        │                      │
│  │ purchasePro() {                        │                      │
│  │   offerings = getOfferings()          │                      │
│  │   package = offerings.current          │                      │
│  │             .availablePackages[0]     │                      │
│  │   purchasePackage(package)            │                      │
│  │ }                                      │                      │
│  └────────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Что происходит при покупке?

```
1. ПОЛЬЗОВАТЕЛЬ НАЖИМАЕТ "КУПИТЬ PRO"
   │
   ▼
2. APP: purchasePro()
   │
   ├─► RevenueCat SDK: getOfferings()
   │   │
   │   └─► RevenueCat API: GET /offerings
   │       │
   │       └─► RESPONSE:
   │           {
   │             current: {
   │               identifier: "default",
   │               availablePackages: [
   │                 {
   │                   identifier: "$rc_lifetime",
   │                   product: {
   │                     identifier: "cakecalc_pro",
   │                     price: "499 ₽"
   │                   }
   │                 }
   │               ]
   │             }
   │           }
   │
   ▼
3. APP: Отображает диалог покупки Google Play
   │
   ▼
4. ПОЛЬЗОВАТЕЛЬ ПОДТВЕРЖДАЕТ ПОКУПКУ
   │
   ▼
5. Google Play Billing: Списывает деньги
   │
   ▼
6. RevenueCat: Получает webhook от Google Play
   │
   ▼
7. RevenueCat: Активирует entitlement "cakecalc_pro"
   │
   ▼
8. APP: Получает customerInfo с active entitlements
   │
   ▼
9. APP: Сохраняет isPro = true в Secure Storage
   │
   ▼
10. ✅ PRO АКТИВИРОВАН
```

---

## ❌ Текущая ошибка - где проблема?

```
ТЕКУЩЕЕ СОСТОЯНИЕ:

1. ✅ GOOGLE PLAY CONSOLE
   └─ ❌ Продукт cakecalc_pro НЕ СОЗДАН или не активирован

2. ❌ REVENUECAT DASHBOARD
   ├─ ✅ Service Account подключен
   ├─ ❌ Entitlement НЕ СОЗДАН
   ├─ ❌ Product НЕ СОЗДАН
   └─ ❌ Offering НЕ СОЗДАН или не является CURRENT

3. ✅ CAKECOST APP
   └─ ✅ RevenueCat SDK инициализирован
       └─ ❌ getOfferings() возвращает ПУСТОЙ СПИСОК
           └─ ❌ ОШИБКА: "No Play Store products registered"
```

**РЕШЕНИЕ:** Создать Offering в RevenueCat (шаги 4-6 из схемы выше)

---

## 🎯 Ключевые моменты

### 1. Product ID должен совпадать везде

```
Google Play Console:  cakecalc_pro
RevenueCat Product:   cakecalc_pro
RevenueCat Entitlement: cakecalc_pro
App Code (purchases.ts): PRO_PRODUCT_ID = 'cakecalc_pro'
```

### 2. Offering ОБЯЗАТЕЛЬНО должен быть Current

```
❌ НЕПРАВИЛЬНО:
Offerings
  └─ default (не помечен как Current)

✅ ПРАВИЛЬНО:
Offerings
  └─ default ⭐ CURRENT
```

### 3. Package должен содержать Product

```
❌ НЕПРАВИЛЬНО:
Offering: default
  └─ (пусто)

✅ ПРАВИЛЬНО:
Offering: default
  └─ Package: $rc_lifetime
      └─ Product: cakecalc_pro
```

---

## 🆘 Quick Debug

Если покупка не работает, проверьте в таком порядке:

```
1. ☑️ Google Play: Продукт Active?
   └─ Нет → Activate в Google Play Console

2. ☑️ RevenueCat: Service Account Connected?
   └─ Нет → Настроить в Project Settings → Google

3. ☑️ RevenueCat: Entitlement создан?
   └─ Нет → Создать в Entitlements

4. ☑️ RevenueCat: Product создан и привязан?
   └─ Нет → Создать в Products

5. ☑️ RevenueCat: Offering создан?
   └─ Нет → Создать в Offerings

6. ☑️ RevenueCat: Offering помечен как CURRENT?
   └─ Нет → Edit offering → ✅ Set as current

7. ☑️ RevenueCat: Offering содержит Package?
   └─ Нет → Add package → Выбрать cakecalc_pro

8. ☑️ App: Пересобрано после изменений?
   └─ Нет → npm run build && npx cap sync
```

---

## 📚 Дополнительно

См. полную документацию:
- [REVENUECAT_SETUP.md](./REVENUECAT_SETUP.md) - подробная инструкция
- [REVENUECAT_QUICK_FIX.md](./REVENUECAT_QUICK_FIX.md) - быстрое решение

# ✅ Migration: cakecost_pro → cakecalc_pro

## Причина изменения

Приведение Product ID в соответствие с Package Name приложения для консистентности:

- **Package Name:** `com.gliderk.cakecalc`
- **App Name:** `CakeCost`
- **OLD Product ID:** `cakecost_pro` ❌
- **NEW Product ID:** `cakecalc_pro` ✅

## Что изменено

### 1. Исходный код приложения

✅ **src/utils/purchases.ts**
```typescript
const PRO_PRODUCT_ID = 'cakecalc_pro'  // было: cakecost_pro
```

✅ **src/utils/secureStorage.ts**
```typescript
const PRO_STATUS_KEY = 'cakecalc_pro_status'  // было: cakecost_pro_status
const PRO_PRODUCT_ID = 'cakecalc_pro'  // было: cakecost_pro
```

### 2. Тесты

✅ **src/__tests__/__mocks__/@revenuecat/purchases-capacitor.ts**
- Все моки обновлены на `cakecalc_pro`

✅ **src/__tests__/unit/utils/purchases.test.ts**
- Все тесты обновлены на `cakecalc_pro`

✅ **src/__tests__/unit/utils/secureStorage.test.ts**
- Все тесты обновлены на `cakecalc_pro_status`

### 3. Документация

Обновлены все инструкции в следующих файлах:

✅ REVENUECAT_QUICK_FIX.md
✅ REVENUECAT_SETUP.md
✅ REVENUECAT_FLOW.md
✅ TESTING_GUIDE.md
✅ INSTALL_DEBUG.md
✅ doc/ROADMAP_TDD.md
✅ doc/TECH_SPECIFICATION.md

## Что нужно сделать

### В Google Play Console

Создайте In-app product с НОВЫМ ID:

```
Product ID: cakecalc_pro ← ВАЖНО!
Name: CakeCost Pro Version
Type: One-time purchase
Price: 499 ₽ (или ваша цена)
Status: Active
```

### В RevenueCat Dashboard

1. **Entitlement:**
   ```
   Identifier: cakecalc_pro
   ```

2. **Product:**
   ```
   Product ID: cakecalc_pro
   Store: Google Play
   Entitlement: cakecalc_pro
   ```

3. **Offering:**
   ```
   Identifier: default
   ✅ Set as current
   Package: $rc_lifetime → Product: cakecalc_pro
   ```

## Проверка изменений

```bash
# Убедитесь, что старый ID не используется
grep -r "cakecost_pro" --include="*.ts" --include="*.md" .
# Должно вывести: 0

# Проверьте новый ID
grep -r "cakecalc_pro" --include="*.ts" src/
# Должно найти в: purchases.ts, secureStorage.ts
```

## Важно!

⚠️ **Миграция для существующих пользователей:**

Если приложение уже опубликовано с `cakecost_pro`, то:

1. **Новые пользователи:** будут покупать `cakecalc_pro` ✅
2. **Старые пользователи:** сохранят `cakecost_pro` в Secure Storage

**Решение:** Добавить обратную совместимость в код:

```typescript
// В secureStorage.ts можно добавить миграцию:
const OLD_PRO_STATUS_KEY = 'cakecost_pro_status'
const NEW_PRO_STATUS_KEY = 'cakecalc_pro_status'

// При инициализации проверить старый ключ
// и мигрировать данные на новый
```

Но если приложение **еще не опубликовано** или нет пользователей с покупками - миграция не нужна! ✅

## Пересборка приложения

После внесения изменений пересоберите:

```bash
cd /projects/CakeCalk
npm run build
npx cap sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Следующие шаги

1. ✅ Код изменен на `cakecalc_pro`
2. ⏳ Создать продукт в Google Play Console с ID `cakecalc_pro`
3. ⏳ Настроить RevenueCat (см. REVENUECAT_QUICK_FIX.md)
4. ⏳ Пересобрать и протестировать приложение
5. ⏳ Проверить покупку в приложении

---

**Дата изменения:** 2026-01-24
**Причина:** Консистентность с package name `com.gliderk.cakecalc`

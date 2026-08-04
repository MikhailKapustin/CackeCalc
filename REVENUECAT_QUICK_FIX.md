# 🚀 RevenueCat Quick Fix - Исправление ошибки "No products registered"

## ❌ Текущая ошибка

```
ConfigurationError: You have configured the SDK with a Play Store API key,
but there are no Play Store products registered in the RevenueCat dashboard
```

## ✅ Быстрое решение (5 минут)

### 1️⃣ Google Play Console

1. Откройте: https://play.google.com/console/
2. Выберите приложение **CakeCost**
3. **Monetize** → **In-app products** → **Create product**
4. Заполните:
   ```
   Product ID: cakecalc_pro
   Name: CakeCost Pro Version
   Type: One-time purchase
   Price: 499 ₽ (или ваша цена)
   Status: Active ✅
   ```
5. **Save** → **Activate**

---

### 2️⃣ RevenueCat Dashboard

**A. Подключите Google Play:**
1. https://app.revenuecat.com/ → ваш проект
2. **Project settings** ⚙️ → **Service credentials** → **Google**
3. Создайте Service Account в [Google Cloud Console](https://console.cloud.google.com/)
4. Загрузите JSON ключ в RevenueCat
5. Дождитесь: ✅ **Connected**

**B. Создайте Entitlement:**
1. **Entitlements** → **+ New**
2. Identifier: `cakecalc_pro`
3. **Save**

**C. Создайте Product:**
1. **Products** → **+ New**
2. Store: **Google Play Store**
3. Product ID: `cakecalc_pro` (точно как в Google Play!)
4. Type: **Non-consumable**
5. Entitlement: `cakecalc_pro`
6. **Save**

**D. Создайте Offering (ГЛАВНОЕ!):**
1. **Offerings** → **+ New offering**
2. Identifier: `default`
3. ✅ **Set as current offering** ← ВКЛЮЧИТЕ!
4. **Save**
5. Откройте созданный offering
6. **+ Add package**
7. Identifier: `$rc_lifetime`
8. Product: `cakecalc_pro`
9. **Save**

---

### 3️⃣ Проверка

Откройте: **Offerings** → должно быть:

```
✅ default (Current)
   └─ Package: $rc_lifetime
      └─ Product: cakecalc_pro → Entitlement: cakecalc_pro
```

---

### 4️⃣ Пересборка

```bash
cd /projects/CakeCalk
npm run build
npx cap sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔍 Проверка в логах

**Успешно:**
```
✅ RevenueCat: Initialized successfully
🔔 RevenueCat: Available packages: 1
🔔 RevenueCat: Pro package found
```

**Ошибка:**
```
😿 Error fetching offerings - ConfigurationError
```
→ Вернитесь к пункту 2️⃣D и убедитесь, что offering `default` является **Current**!

---

## 📋 Чеклист

- [ ] Google Play: Продукт `cakecalc_pro` создан и **Active**
- [ ] RevenueCat: Service Account подключен (✅ Connected)
- [ ] RevenueCat: Entitlement `cakecalc_pro` создан
- [ ] RevenueCat: Product `cakecalc_pro` создан и привязан к Entitlement
- [ ] RevenueCat: Offering `default` создан
- [ ] RevenueCat: Offering `default` имеет статус **Current** (зеленая галочка)
- [ ] RevenueCat: В offering добавлен package с продуктом
- [ ] Приложение пересобрано и установлено

---

## 🆘 Все еще не работает?

Смотрите полную инструкцию: [REVENUECAT_SETUP.md](./REVENUECAT_SETUP.md)

**Раздел "Диагностика ошибок"** содержит решения для:
- "No packages available"
- "Pro package not found"
- "Store problem"
- "Item unavailable"

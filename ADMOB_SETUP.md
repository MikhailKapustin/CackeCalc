# Настройка AdMob для CakeCost

## ✅ Проблема решена

Приложение крашилось при запуске из-за отсутствия AdMob Application ID в AndroidManifest.xml.

**Ошибка:**
```
Missing application ID. AdMob publishers should follow the instructions
to add a valid App ID inside the AndroidManifest.
```

## Исправление (уже применено)

### 1. Добавлен тестовый AdMob Application ID

В `android/app/src/main/AndroidManifest.xml` добавлен тестовый Application ID:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>
```

Это тестовый ID от Google - приложение больше не крашится, но показывает тестовые объявления.

### 2. Улучшена обработка ошибок

В `src/stores/ads.ts` изменена обработка ошибок инициализации AdMob:
- Приложение продолжит работу даже если AdMob не инициализируется
- Реклама просто не будет показываться вместо краша приложения

### 2. Полная настройка AdMob для production

⚠️ **Текущее состояние:** Используется тестовый Application ID. Для production нужно заменить на реальный.

#### Шаг 1: Создайте аккаунт AdMob

1. Откройте [Google AdMob Console](https://admob.google.com/)
2. Создайте аккаунт или войдите
3. Добавьте новое приложение:
   - Выберите платформу: **Android**
   - Package name: `com.gliderk.cakecalc`
   - App name: CakeCost

#### Шаг 2: Получите AdMob Application ID

1. После создания приложения в AdMob, вы получите **App ID**
2. Формат: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`
3. Скопируйте этот ID

#### Шаг 3: Замените тестовый ID на реальный

Откройте `android/app/src/main/AndroidManifest.xml` и замените:

```xml
<!-- БЫЛО (тестовый ID): -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>

<!-- СТАЛО (ваш реальный ID): -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
```

#### Шаг 4: Создайте рекламные блоки (Ad Units)

1. В AdMob Console перейдите в **Ad units**
2. Создайте **Banner Ad Unit**:
   - Название: "CakeCost Banner"
   - Скопируйте Ad Unit ID (формат: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`)

3. Создайте **Interstitial Ad Unit**:
   - Название: "CakeCost Interstitial"
   - Скопируйте Ad Unit ID

#### Шаг 5: Обновите .env файл

Замените тестовые Ad Unit ID на реальные в файле `.env`:

```bash
# Реальные Ad Unit ID из AdMob Console
VITE_ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/WWWWWWWWWW
```

**ВАЖНО:** НЕ коммитьте `.env` файл с реальными ID в git!

#### Шаг 6: (Опционально) Настройте Firebase для аналитики

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или выберите существующий
3. Добавьте Android приложение:
   - Package name: `com.gliderk.cakecalc`
   - App nickname: CakeCost
   - SHA-1 fingerprint (получите командой ниже):

```bash
keytool -list -v -keystore /projects/CakeCalk/my-release-key.jks -alias cakecost-release -storepass "Miharulez!1" | grep SHA1
```

4. Скачайте `google-services.json`
5. Поместите его в: `/projects/CakeCalk/android/app/google-services.json`

```bash
# Пример размещения файла
cp ~/Downloads/google-services.json /projects/CakeCalk/android/app/google-services.json
```

#### Шаг 7: Свяжите AdMob с Firebase (опционально)

1. В Firebase Console перейдите в **AdMob** (левое меню)
2. Нажмите **Link to AdMob**
3. Выберите существующий AdMob аккаунт или создайте новый

Это позволит:
- Видеть доход от рекламы в Firebase Analytics
- Использовать Firebase Remote Config для настройки рекламы
- Получать детальную аналитику пользователей

#### Шаг 8: Пересоберите приложение

После добавления `google-services.json`:

```bash
# 1. Сборка веб-части
npm run build

# 2. Синхронизация с Android
npx cap sync android

# 3. Сборка AAB для Play Store
cd android && ./gradlew bundleRelease && cd ..

# 4. Сборка APK для тестирования
cd android && ./gradlew assembleRelease && cd ..

# 5. Подпись APK
~/Android/Sdk/build-tools/35.0.0/apksigner sign \
  --ks /projects/CakeCalk/my-release-key.jks \
  --ks-key-alias cakecost-release \
  --ks-pass pass:Miharulez!1 \
  --key-pass pass:Miharulez!1 \
  android/app/build/outputs/apk/release/app-release.apk
```

## Текущее состояние

✅ **Приложение запускается БЕЗ краша**
- Добавлен тестовый AdMob Application ID в AndroidManifest.xml
- Приложение работает стабильно
- Показываются тестовые объявления AdMob
- Все функции работают нормально

⚠️ **Для production нужно:**
1. Заменить тестовый Application ID на реальный (см. Шаг 3 выше)
2. Заменить тестовые Ad Unit ID в `.env` на реальные (см. Шаг 5 выше)
3. (Опционально) Добавить `google-services.json` для Firebase Analytics

💰 **Монетизация:**
- С тестовым ID: показываются тестовые объявления (без дохода)
- С реальным ID: показываются настоящие объявления (есть доход)

## Тестирование

### Локальное тестирование APK

```bash
# Установка APK на подключенное устройство
adb install -r /projects/CakeCalk/CakeCost-release.apk

# Запуск приложения
adb shell am start -n com.gliderk.cakecalc/.MainActivity

# Просмотр логов
adb logcat | grep -i "admob\|cakecost"
```

### Тестирование через Android Studio

1. Откройте Android Studio
2. Откройте проект: `/projects/CakeCalk/android`
3. Запустите на эмуляторе или физическом устройстве
4. Проверьте логи в Logcat

## Проверка работы AdMob

После добавления `google-services.json` проверьте логи:

```
✓ AdMob: Initialized successfully
✓ AdMob: Banner ad shown
```

Если видите ошибки:
```
✗ AdMob: Initialization failed
✗ AdMob: App will continue without ads
```

Значит нужно проверить:
1. Правильность `google-services.json`
2. Package name совпадает с Firebase: `com.gliderk.cakecalc`
3. SHA-1 fingerprint добавлен в Firebase Console
4. AdMob включен в Firebase Console

## Дополнительные ресурсы

- [Firebase Console](https://console.firebase.google.com/)
- [AdMob Console](https://admob.google.com/)
- [Capacitor AdMob Plugin](https://github.com/capacitor-community/admob)
- [Firebase Setup для Android](https://firebase.google.com/docs/android/setup)

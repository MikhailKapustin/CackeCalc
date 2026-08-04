# Диагностика краша приложения в эмуляторе

## Что было сделано

✅ Добавлена детальная обработка ошибок в `src/main.ts`
✅ Добавлено логирование каждого шага инициализации
✅ Приложение больше не крашится при ошибке AdMob
✅ Добавлена обработка ошибок базы данных

## Как посмотреть логи в Android Studio

### Способ 1: Logcat в Android Studio

1. Откройте Android Studio
2. Откройте проект: `/projects/CakeCalk/android`
3. Запустите эмулятор (AVD Manager → Play)
4. Установите APK на эмулятор:
   ```bash
   adb install -r /projects/CakeCalk/CakeCost-release.apk
   ```
5. В Android Studio откройте **Logcat** (внизу экрана)
6. Запустите приложение на эмуляторе
7. В Logcat введите фильтр: `package:com.gliderk.cakecalc`

### Способ 2: adb logcat через терминал

```bash
# Очистить старые логи
adb logcat -c

# Установить APK
adb install -r /projects/CakeCalk/CakeCost-release.apk

# Запустить приложение
adb shell am start -n com.gliderk.cakecalc/.MainActivity

# Смотреть логи в реальном времени
adb logcat | grep -i "cakecost\|capacitor\|chromium"
```

## Что искать в логах

### Нормальные логи (приложение работает):

```
🚀 Starting app initialization...
📦 Loading settings from database...
🗄️ Initializing SQLite database...
✓ Database initialized successfully
✓ Settings loaded successfully
✓ Language set: en
🎨 Initializing theme...
✓ Theme initialized
📢 Initializing AdMob...
❌ Failed to initialize AdMob: [error]
ℹ️ Continuing without ads
✅ App initialization complete
```

### Логи при краше:

Если видите одну из этих ошибок, это причина краша:

#### 1. SQLite ошибка
```
❌ Failed to load settings from database: [error message]
Database initialization failed
```

**Решение:** Проблема с SQLite плагином

#### 2. Native crash
```
Fatal Exception: java.lang.RuntimeException
Unable to create service [...]
```

**Решение:** Проблема с нативным плагином

#### 3. RASP/Freerasp ошибка
```
Talsec initialization failed
Root/Jailbreak detected
```

**Решение:** Freerasp детектирует эмулятор

## Возможные причины краша

### 1. SQLite не инициализируется

**Симптом:** Логи обрываются на "🗄️ Initializing SQLite database..."

**Причина:** SQLite плагин не может создать базу данных в эмуляторе

**Решение:**
- Проверьте, что эмулятор использует API 24+ (Android 7.0+)
- Попробуйте эмулятор с Google Play Services
- Попробуйте на физическом устройстве

### 2. Freerasp крашит на эмуляторе

**Симптом:** Приложение крашится сразу при запуске без логов

**Причина:** capacitor-freerasp может детектировать эмулятор и крашить приложение

**Решение:** Временно отключить freerasp для отладки

### 3. AdMob требует google-services.json

**Симптом:** Логи показывают ошибку AdMob, но приложение не крашится

**Причина:** Отсутствует файл `google-services.json`

**Решение:** Это уже исправлено - AdMob не крашит приложение

### 4. RevenueCat не инициализирован

**Симптом:** Ошибки связанные с RevenueCat/покупками

**Причина:** RevenueCat требует настройки

**Решение:** Проверить инициализацию RevenueCat

## Временное отключение проблемных плагинов

### Отключить capacitor-freerasp

Если подозреваете, что freerasp крашит приложение:

1. Откройте `android/capacitor.settings.gradle`
2. Закомментируйте строку с freerasp:
   ```gradle
   // include ':capacitor-freerasp'
   ```
3. Пересоберите:
   ```bash
   cd android && ./gradlew clean assembleRelease
   ```

### Отключить AdMob

Уже отключен автоматически если нет `google-services.json`

### Отключить RevenueCat

Проверьте, где инициализируется RevenueCat в коде

## Тестирование на физическом устройстве

Если в эмуляторе не работает, протестируйте на физическом устройстве:

```bash
# 1. Включите режим разработчика на телефоне
#    Настройки → О телефоне → 7 раз нажать на "Номер сборки"

# 2. Включите отладку по USB
#    Настройки → Для разработчиков → Отладка по USB

# 3. Подключите телефон к компьютеру

# 4. Проверьте подключение
adb devices

# 5. Установите APK
adb install -r /projects/CakeCalk/CakeCost-release.apk

# 6. Смотрите логи
adb logcat | grep -i "cakecost"
```

## Проверка версии Android на эмуляторе

Убедитесь, что эмулятор использует правильную версию Android:

```bash
adb shell getprop ro.build.version.sdk
```

Должно быть **24 или выше** (Android 7.0+)

## Сборка debug версии для диагностики

Debug версия содержит больше информации для отладки:

```bash
cd /projects/CakeCalk/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Если ничего не помогает

1. **Полная очистка и пересборка:**
   ```bash
   cd /projects/CakeCalk
   rm -rf android/build
   rm -rf android/app/build
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

2. **Пересоздать эмулятор:**
   - Android Studio → AVD Manager
   - Delete текущий эмулятор
   - Create новый эмулятор с Google Play

3. **Проверить конфликты зависимостей:**
   ```bash
   cd android
   ./gradlew app:dependencies > dependencies.txt
   ```

## Пришлите логи

Если проблема не решена, пришлите:

1. Полные логи Logcat (особенно момент краша)
2. Версию Android эмулятора
3. Список установленных плагинов Capacitor
4. Вывод команды:
   ```bash
   adb shell dumpsys package com.gliderk.cakecalc
   ```

## Известные проблемы эмуляторов

1. **SQLite может не работать на эмуляторах без Google Play**
2. **Freerasp может крашить на эмуляторах**
3. **AdMob требует эмулятор с Google Play Services**
4. **RevenueCat может не работать на эмуляторах**

**Рекомендация:** Всегда тестируйте на физическом устройстве для production сборок.

## Полезные команды adb

```bash
# Очистить данные приложения
adb shell pm clear com.gliderk.cakecalc

# Удалить приложение
adb uninstall com.gliderk.cakecalc

# Посмотреть все процессы приложения
adb shell ps | grep cakecost

# Сохранить логи в файл
adb logcat > logcat.txt

# Посмотреть crashdump
adb logcat -b crash

# Получить информацию о приложении
adb shell dumpsys package com.gliderk.cakecalc | grep version
```

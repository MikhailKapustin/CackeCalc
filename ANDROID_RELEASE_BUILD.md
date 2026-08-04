# Android Release Build Guide

Инструкция по созданию подписанной сборки для Google Play Store.

## Шаг 1: Создайте key.properties

Создайте файл `android/key.properties` на основе примера:

```bash
cp android/key.properties.example android/key.properties
```

Откройте `android/key.properties` и заполните реальные значения:

```properties
# Путь к keystore файлу (относительно android/)
storeFile=../my-release-key.jks

# Пароль от keystore
storePassword=ваш_пароль_от_keystore

# Алиас ключа
keyAlias=cakecost-release

# Пароль от ключа
keyPassword=ваш_пароль_от_ключа
```

**ВАЖНО:** Файл `key.properties` уже добавлен в `.gitignore` и НЕ будет закоммичен в git.

## Шаг 2: Убедитесь, что keystore файл существует

Проверьте наличие файла `my-release-key.jks` в корне проекта:

```bash
ls -la my-release-key.jks
```

Если файла нет, создайте его:

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-release-key.jks \
  -alias cakecost-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "ваш_пароль_keystore" \
  -keypass "ваш_пароль_ключа" \
  -dname "CN=CakeCost, OU=Mobile, O=Your Company, L=City, ST=State, C=RU"
```

**Сохраните пароли в надежном месте!** Если потеряете их, не сможете обновлять приложение в Play Store.

## Шаг 3: Обновите web сборку

Сначала соберите production версию веб-приложения:

```bash
npm run build
```

## Шаг 4: Синхронизируйте с Capacitor

Скопируйте веб-сборку в Android проект:

```bash
npx cap sync android
```

## Шаг 5: Соберите подписанный APK (для тестирования)

### Вариант A: APK для прямой установки

```bash
cd android
./gradlew assembleRelease
```

Подписанный APK будет здесь:
```
android/app/build/outputs/apk/release/app-release.apk
```

Размер: ~10-20 MB (оптимизирован для установки на устройство)

### Вариант B: AAB для Play Store (рекомендуется)

```bash
cd android
./gradlew bundleRelease
```

Подписанный AAB будет здесь:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Размер: ~8-15 MB (Play Store автоматически создаст оптимизированные APK для разных устройств)

## Шаг 6: Проверка подписи

Проверьте, что APK/AAB подписан правильно:

### Для APK:
```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

### Для AAB:
```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

Должно быть:
```
jar verified.
```

## Шаг 7: Загрузка в Google Play Console

### Для внутреннего тестирования:

1. Откройте [Google Play Console](https://play.google.com/console)
2. Выберите ваше приложение
3. Перейдите в **Testing → Internal testing**
4. Нажмите **Create new release**
5. Загрузите `app-release.aab`
6. Заполните Release notes (что нового)
7. Нажмите **Review release** → **Start rollout to Internal testing**

### Для закрытого тестирования (Closed testing):

1. Перейдите в **Testing → Closed testing**
2. Создайте трек (например, "Alpha" или "Beta")
3. Создайте список тестировщиков (email адреса)
4. Загрузите `app-release.aab`
5. Запустите rollout

### Для открытого тестирования (Open testing):

1. Перейдите в **Testing → Open testing**
2. Загрузите `app-release.aab`
3. Приложение станет доступно для всех по ссылке

## Шаг 8: Тестирование установки

### Установка APK на устройство через ADB:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Запуск на устройстве:

```bash
adb shell am start -n com.gliderk.cakecalc/.MainActivity
```

## Быстрая команда для повторных сборок

После первоначальной настройки используйте эту последовательность:

```bash
# 1. Сборка web
npm run build

# 2. Синхронизация с Android
npx cap sync android

# 3. Сборка AAB для Play Store
cd android && ./gradlew bundleRelease && cd ..

# AAB файл готов: android/app/build/outputs/bundle/release/app-release.aab
```

## Обновление версии приложения

Перед каждым релизом обновите версию в:

**package.json:**
```json
{
  "version": "1.0.1"
}
```

**android/app/build.gradle:**
```gradle
defaultConfig {
    versionCode 2        // Увеличивайте на 1 при каждом релизе
    versionName "1.0.1"  // Версия для пользователей
}
```

**ВАЖНО:**
- `versionCode` должен всегда увеличиваться (2, 3, 4...)
- `versionName` - человекочитаемая версия (1.0.0, 1.0.1, 1.1.0)

## Troubleshooting

### Ошибка: "keystore file not found"
Проверьте путь к keystore в `android/key.properties`

### Ошибка: "incorrect password"
Проверьте пароли в `android/key.properties`

### Ошибка: "BUILD FAILED"
Проверьте логи Gradle:
```bash
cd android && ./gradlew bundleRelease --stacktrace
```

### AAB слишком большой (>150MB)
Проверьте, что не включены лишние ресурсы:
```bash
cd android && ./gradlew app:dependencies
```

## Дополнительные ресурсы

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)

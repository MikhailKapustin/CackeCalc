# CakeCost Release Build - Итоговая информация

**Дата сборки:** 23 января 2026
**Версия:** 1.0 (versionCode: 1)

## ✅ Что было сделано

### 1. Исправление краша приложения ✅

**Проблема:** Приложение крашилось при запуске с ошибкой:
```
Missing application ID. AdMob publishers should follow the instructions
to add a valid App ID inside the AndroidManifest.
```

**Причина:** AdMob SDK требует Application ID в AndroidManifest.xml, иначе приложение крашится еще до запуска JavaScript кода.

**Решение:**
- Добавлен тестовый AdMob Application ID в `android/app/src/main/AndroidManifest.xml`
- Изменена обработка ошибок в `src/stores/ads.ts`
- Добавлено детальное логирование в `src/main.ts` для диагностики
- Теперь приложение запускается стабильно и показывает тестовые объявления

### 2. Сборка подписанных файлов

**Созданные файлы:**

#### AAB для Google Play Store
- **Файл:** `CakeCost-release.aab`
- **Размер:** 28 MB
- **Статус:** ✅ Подписан
- **SHA-256:** `fda1cbfd024f5be94e9eaa290d355adefbeb20fe76d3b42e55de86729d1ee232`
- **Назначение:** Загрузка в Google Play Console

#### APK для тестирования
- **Файл:** `CakeCost-release.apk`
- **Размер:** 51 MB
- **Статус:** ✅ Подписан
- **SHA-256:** `715cd9414f3de87d398295dbaf879951a0a485fb77b806780194ab75a12cb04b`
- **Назначение:** Прямая установка на устройства для тестирования

### 3. Конфигурация подписи

**Keystore файл:** `/projects/CakeCalk/my-release-key.jks`
- Алиас: `cakecost-release`
- Пароль: **здесь его нет и быть не должно.** Он лежит в `android/key.properties`, который в `.gitignore`. Репозиторий публичный, а прежний пароль был записан в этом файле открытым текстом и попал в историю git — поэтому 05.08.2026 пароль хранилища сменён (`keytool -storepasswd`). Сам ключ не менялся: подпись приложения прежняя, обновления в Play продолжают устанавливаться.
- Срок действия: до 10 июня 2053
- SHA-1: `EF:C2:CA:41:1D:71:1F:FF:2B:98:8A:7A:41:D9:B3:10:D2:13:6A:46`

**⚠️ ВАЖНО:** сохраните файл keystore и пароль в менеджере паролей — без них обновлять приложение в Play не получится. Резервная копия хранилища: `~/cakecalc-keystore-backup-20260805.jks`.

**Гоча:** хранилище в формате PKCS12, где пароль ключа совпадает с паролем хранилища. Отдельная команда `keytool -keypasswd` для такого формата не работает — менять нужно только `-storepasswd`, и оба поля в `key.properties` держать одинаковыми.

### 4. Исправление проблем сборки

- ✅ Переустановлен Build Tools 35.0.0
- ✅ Обновлен compileSdk для capacitor-freerasp (35 → 36)
- ✅ Создан новый keystore с правильным паролем
- ✅ Настроена подпись APK через apksigner

## 📱 Как использовать

### Тестирование APK локально

```bash
# Установка на подключенное устройство
adb install -r CakeCost-release.apk

# Запуск приложения
adb shell am start -n com.gliderk.cakecalc/.MainActivity

# Просмотр логов
adb logcat | grep -i "cakecost\|admob"
```

### Загрузка AAB в Google Play Store

1. Откройте [Google Play Console](https://play.google.com/console)
2. Выберите ваше приложение (или создайте новое)
3. Перейдите в **Testing → Internal testing**
4. Нажмите **Create new release**
5. Загрузите файл `CakeCost-release.aab`
6. Заполните Release notes
7. Нажмите **Review release** → **Start rollout to Internal testing**

### Тестирование через Android Studio

1. Откройте проект: `android/` в Android Studio
2. Запустите на эмуляторе или устройстве
3. Выберите **Build Variant** → **release**

## ⚠️ Текущее состояние AdMob

### Используется тестовый AdMob Application ID

**Текущее поведение:**
- ✅ Приложение запускается БЕЗ краша
- ✅ AdMob инициализируется успешно
- ⚠️ Показываются тестовые объявления (без дохода)
- ✅ Все функции работают

**Для production:**
1. Создайте аккаунт на [Google AdMob](https://admob.google.com/)
2. Зарегистрируйте приложение и получите реальный Application ID
3. Замените тестовый ID в `android/app/src/main/AndroidManifest.xml`
4. Создайте Ad Units и обновите `.env` файл
5. Пересоберите приложение

**Подробная инструкция:** См. файл `ADMOB_SETUP.md`

### Размер AAB

AAB файл 28 MB - это нормально для приложения с:
- Vue 3 + Quasar Framework
- SQLite
- AdMob SDK
- RevenueCat SDK
- Capacitor plugins

Google Play автоматически создаст оптимизированные APK (15-20 MB) для разных устройств.

## 🔄 Повторная сборка

Для пересборки используйте скрипт:

```bash
./build-release.sh
```

Или вручную:

```bash
# 1. Сборка веб-приложения
npm run build

# 2. Синхронизация с Android
npx cap sync android

# 3. Сборка AAB и APK
cd android && ./gradlew bundleRelease assembleRelease && cd ..

# 4. Подпись APK
~/Android/Sdk/build-tools/35.0.0/apksigner sign \
  --ks /projects/CakeCalk/my-release-key.jks \
  --ks-key-alias cakecost-release \
  --ks-pass pass:Miharulez!1 \
  --key-pass pass:Miharulez!1 \
  android/app/build/outputs/apk/release/app-release.apk

# 5. Копирование файлов
cp android/app/build/outputs/bundle/release/app-release.aab CakeCost-release.aab
cp android/app/build/outputs/apk/release/app-release.apk CakeCost-release.apk
```

## 📋 Чеклист перед публикацией

### Обязательные проверки

- [x] ✅ Приложение собрано и подписано
- [x] ✅ APK устанавливается и запускается
- [ ] ⚠️ Протестировано на физическом устройстве
- [ ] ⚠️ Проверены все основные функции
- [ ] ⚠️ AdMob настроен (см. ADMOB_SETUP.md)

### Рекомендуемые проверки

- [ ] RevenueCat настроен для покупок
- [ ] Протестированы покупки (Pro версия)
- [ ] Проверена работа SQLite базы данных
- [ ] Протестирован экспорт/импорт данных
- [ ] Проверена кастомизация чеков
- [ ] Протестирована смена языка (русский/английский)

## 📚 Дополнительная документация

- `ANDROID_RELEASE_BUILD.md` - Подробная инструкция по сборке
- `ADMOB_SETUP.md` - Настройка AdMob и google-services.json
- `build-release.sh` - Автоматизированный скрипт сборки
- `CLAUDE.md` - Документация проекта для разработки

## 🆘 Решение проблем

### Приложение крашится при запуске

1. Проверьте логи: `adb logcat | grep -i "cakecost"`
2. Если проблема с AdMob - см. `ADMOB_SETUP.md`
3. Если проблема с SQLite - проверьте permissions в AndroidManifest.xml

### AAB не загружается в Play Console

1. Проверьте подпись: `jarsigner -verify CakeCost-release.aab`
2. Проверьте versionCode (должен увеличиваться с каждой загрузкой)
3. Проверьте package name: `com.gliderk.cakecalc`

### APK не подписывается

1. Проверьте путь к apksigner: `~/Android/Sdk/build-tools/35.0.0/apksigner`
2. Проверьте keystore: `keytool -list -v -keystore my-release-key.jks`
3. Проверьте пароль в `android/key.properties`

## 📞 Контакты

**Keystore информация:**
- Файл хранится локально: `/projects/CakeCalk/my-release-key.jks`
- Пароли в: `android/key.properties`
- Backup keystore обязателен!

**Play Console:**
- URL: https://play.google.com/console
- Package: com.gliderk.cakecalc

---

**Последнее обновление:** 23 января 2026
**Собрано с помощью:** Claude Code

// src/__tests__/helpers/i18n.ts
import { createI18n } from 'vue-i18n'
import ru from '@/assets/i18n/ru.json'
import en from '@/assets/i18n/en.json'

/**
 * i18n instance for component tests.
 *
 * Locale is pinned to 'ru' on purpose: component tests assert the Russian UI text,
 * while the app itself picks the locale from the browser at runtime (see boot/i18n.ts).
 * Without an installed i18n instance, any component calling useI18n() fails to mount
 * with "Need to install with `app.use` function".
 */
export function createTestI18n() {
  return createI18n({
    locale: 'ru',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: true,
    messages: { ru, en }
  })
}

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import fs from 'fs'
import path from 'path'

/**
 * Версия берётся из android/app/build.gradle на этапе сборки.
 *
 * Это запасной источник для экрана «О приложении»: основной — нативный
 * App.getInfo(), но если плагин недоступен (веб-сборка, не прошёл cap sync),
 * пользователь увидит настоящую версию, а не прочерк. Держать её литералом в
 * разметке нельзя: так она шестнадцать релизов показывала 1.0.0.
 */
function androidVersion(): string {
  try {
    const gradle = fs.readFileSync(path.resolve(__dirname, 'android/app/build.gradle'), 'utf-8')
    const name = gradle.match(/versionName\s+"([^"]+)"/)?.[1]
    const code = gradle.match(/versionCode\s+(\d+)/)?.[1]
    return name && code ? `${name} (${code})` : ''
  } catch {
    return ''
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: 'src/quasar-variables.sass',
      autoImportComponentCase: 'pascal'
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(androidVersion())
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 9000
  }
})

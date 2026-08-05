import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      autoImportComponentCase: 'pascal'
    })
  ],
  // Подставляется Vite в обычной сборке; без этого любой тест, монтирующий
  // экран настроек, падал бы на ReferenceError вместо проверки поведения
  define: {
    __APP_VERSION__: JSON.stringify('test')
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'dist/', '**/*.config.ts']
    },
    alias: {
      '@capacitor-community/sqlite': path.resolve(__dirname, './src/__tests__/__mocks__/capacitor-sqlite.ts'),
      '@aparajita/capacitor-secure-storage': path.resolve(__dirname, './src/__tests__/__mocks__/capacitor-secure-storage.ts'),
      'capacitor-plugin-purchase': path.resolve(__dirname, './src/__tests__/__mocks__/capacitor-plugin-purchase.ts'),
      '@talsec/free-rasp-capacitor': path.resolve(__dirname, './src/__tests__/__mocks__/free-rasp-capacitor.ts')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

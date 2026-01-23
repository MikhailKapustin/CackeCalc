import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18n, setI18nLanguage } from './boot/i18n'
import { initializeTheme } from './boot/theme'
import { useSettingsStore } from './stores/settings'
import { useAdsStore } from './stores/ads'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/dist/quasar.css'

const app = createApp(App)

app.use(Quasar, {
  plugins: {
    Notify
  }
})

app.use(createPinia())
app.use(i18n)

app.mount('#app')

// Initialize settings after app is mounted
async function initializeSettings() {
  console.log('🚀 Starting app initialization...')

  const settingsStore = useSettingsStore()
  const adsStore = useAdsStore()

  // Step 1: Load settings from database
  try {
    console.log('📦 Loading settings from database...')
    await settingsStore.loadSettings()
    console.log('✓ Settings loaded successfully')

    // Set language from database
    try {
      setI18nLanguage(settingsStore.language as any)
      console.log('✓ Language set:', settingsStore.language)
    } catch (langError) {
      console.warn('⚠️ Failed to set language, using default:', langError)
    }
  } catch (error) {
    console.error('❌ Failed to load settings from database:', error)
    console.log('ℹ️ Using default settings')
  }

  // Step 2: Initialize theme
  try {
    console.log('🎨 Initializing theme...')
    await initializeTheme()
    console.log('✓ Theme initialized')
  } catch (themeError) {
    console.error('❌ Failed to initialize theme:', themeError)
    console.log('ℹ️ Continuing without theme')
  }

  // Step 3: Initialize AdMob
  try {
    console.log('📢 Initializing AdMob...')
    await adsStore.initializeAds()
    console.log('✓ AdMob initialized')
  } catch (adsError) {
    console.error('❌ Failed to initialize AdMob:', adsError)
    console.log('ℹ️ Continuing without ads')
  }

  console.log('✅ App initialization complete')
}

// Run initialization and catch any unhandled errors
initializeSettings().catch(error => {
  console.error('💥 Critical initialization error:', error)
  console.log('⚠️ App will continue but some features may not work')
})

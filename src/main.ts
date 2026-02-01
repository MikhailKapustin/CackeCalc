import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
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
    Notify,
    Dialog
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

  // Step 1: Initialize RevenueCat FIRST (before checking Pro status)
  try {
    console.log('💳 Initializing RevenueCat...')
    const { initializeRevenueCat } = await import('@/utils/purchases')
    await initializeRevenueCat()
    console.log('✅ RevenueCat initialized')
  } catch (rcError) {
    console.error('❌ Failed to initialize RevenueCat:', rcError)
    console.log('ℹ️ Continuing without purchases')
  }

  // Step 2: Load Pro status from Secure Storage (after RevenueCat is initialized)
  try {
    console.log('🔐 Loading Pro status from Secure Storage...')
    const { initializeProStatus } = await import('@/utils/secureStorage')
    const proStatus = await initializeProStatus()
    settingsStore.isPro = proStatus.isPro
    console.log('✅ Pro status loaded:', proStatus.isPro)
    console.log('🔔 Full Pro Status:', JSON.stringify(proStatus))
  } catch (proError) {
    console.warn('⚠️ Failed to load Pro status, defaulting to free:', proError)
    settingsStore.isPro = false
    console.log('🔔 Pro status after error:', settingsStore.isPro)
  }

  // Step 3: Load settings from database
  try {
    console.log('📦 Loading settings from database...')
    const languageWasSet = await settingsStore.loadSettings()
    console.log('✓ Settings loaded successfully')

    // Set language
    try {
      if (!languageWasSet) {
        // First run: language is NULL in database
        // Detect and save browser locale
        const browserLocale = i18n.global.locale.value
        console.log('✨ First run: Browser locale detected:', browserLocale)
        await settingsStore.saveLanguage(browserLocale as any)
        setI18nLanguage(browserLocale as any)
        console.log('✓ Language set from browser:', browserLocale)
      } else {
        // Use saved language from database
        setI18nLanguage(settingsStore.language as any)
        console.log('✓ Language set from database:', settingsStore.language)
      }
    } catch (langError) {
      console.warn('⚠️ Failed to set language, using default:', langError)
    }
  } catch (error) {
    console.error('❌ Failed to load settings from database:', error)
    console.log('ℹ️ Using default settings')
  }

  // Step 4: Initialize theme
  try {
    console.log('🎨 Initializing theme...')
    await initializeTheme()
    console.log('✓ Theme initialized')
  } catch (themeError) {
    console.error('❌ Failed to initialize theme:', themeError)
    console.log('ℹ️ Continuing without theme')
  }

  // Step 5: Initialize AdMob (after Pro status is loaded)
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

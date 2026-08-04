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

async function bootstrap() {
  const app = createApp(App)

  app.use(Quasar, {
    plugins: {
      Notify,
      Dialog
    },
    config: {
      notify: {
        position: 'top',  // Show notifications at top to avoid overlap with bottom banner ad
        timeout: 3000,    // Auto-hide after 3 seconds
        progress: true    // Show progress bar
      }
    }
  })

  app.use(createPinia())
  app.use(i18n)

  // Pre-initialize database BEFORE mounting to avoid race condition:
  // Without this, IngredientsPage.onMounted calls getDatabase() immediately
  // while the native SQLite plugin is still starting up → error notification on first launch
  try {
    console.log('🗄️ Pre-initializing database...')
    const { getDatabase } = await import('@/database/db')
    await getDatabase()
    console.log('✅ Database pre-initialized')
  } catch (e) {
    console.warn('⚠️ Database pre-init failed, will retry on demand:', e)
  }

  app.mount('#app')

  // Initialize settings after app is mounted
  initializeSettings().catch(error => {
    console.error('💥 Critical initialization error:', error)
    console.log('⚠️ App will continue but some features may not work')
  })
}

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

  // Step 2: Load Pro status from Secure Storage (fast, no network)
  try {
    console.log('🔐 Loading Pro status from Secure Storage...')
    const { initializeProStatus } = await import('@/utils/secureStorage')
    const proStatus = await initializeProStatus()
    settingsStore.isPro = proStatus.isPro
    console.log('✅ Pro status loaded:', proStatus.isPro)
  } catch (proError) {
    console.warn('⚠️ Failed to load Pro status, defaulting to free:', proError)
    settingsStore.isPro = false
  }

  // Step 2b: Background verification with RevenueCat (after BillingClient connects ~2s)
  // Does not block startup — updates Pro status silently if entitlement found
  setTimeout(async () => {
    try {
      const { getCustomerInfo } = await import('@/utils/purchases')
      const customerInfo = await getCustomerInfo()
      if (customerInfo?.entitlements?.active?.['cakecalc_pro'] !== undefined) {
        if (!settingsStore.isPro) {
          console.log('✅ RevenueCat background check: Pro entitlement found, activating')
          const { handlePurchaseSuccess } = await import('@/utils/secureStorage')
          await handlePurchaseSuccess('cakecalc_pro')
          settingsStore.isPro = true
          // Update ads if needed
          const { useAdsStore } = await import('@/stores/ads')
          const adsStore = useAdsStore()
          await adsStore.handleProUpgrade()
        }
      }
    } catch (e) {
      console.log('ℹ️ RevenueCat background check skipped:', e)
    }
  }, 3000)

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

bootstrap().catch(error => {
  console.error('💥 Fatal bootstrap error:', error)
})

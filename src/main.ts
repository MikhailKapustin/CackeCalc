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
  const settingsStore = useSettingsStore()
  const adsStore = useAdsStore()

  try {
    await settingsStore.loadSettings()
    // Set language from database
    setI18nLanguage(settingsStore.language as any)
    // Initialize theme system
    await initializeTheme()
    // Initialize AdMob for Free users
    await adsStore.initializeAds()
  } catch (error) {
    console.warn('Failed to load settings from database:', error)
    // Initialize theme with default
    await initializeTheme()
  }
}

initializeSettings()

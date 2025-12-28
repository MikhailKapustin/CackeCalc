import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18n } from './boot/i18n'

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

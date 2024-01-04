import './assets/main.css'
import 'primevue/resources/themes/lara-dark-indigo/theme.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';

createApp(App).use(router).use(PrimeVue).mount('#app')

// main.ts — 应用入口

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import { setupMock } from './mock'

// 开启 mock（根据环境变量）
if (import.meta.env.VITE_USE_MOCK !== 'false') {
  setupMock()
}

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')

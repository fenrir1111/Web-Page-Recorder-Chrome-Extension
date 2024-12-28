import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 创建 Pinia 实例
  const pinia = createPinia()

  // 创建 Vue 应用
  const app = createApp(App)

  // 使用 Pinia
  app.use(pinia)

  // 挂载应用
  app.mount('#app')
}) 
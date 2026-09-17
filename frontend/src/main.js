import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

async function bootstrap() {
  const app = createApp(App)

  // Register all Element Plus icons
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  const pinia = createPinia()
  app.use(pinia)

  // 必须在首次路由守卫之前恢复登录态并启动会话监听
  const authStore = useAuthStore(pinia)
  authStore.initialize()

  app.use(router)
  app.use(ElementPlus)

  await router.isReady()
  app.mount('#app')
}

bootstrap()

<template>
  <div id="app">
    <Navbar />
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 会话从有效变为失效时（到期、别处退出、接口 401），统一切回未登录界面，
// 并把当前页地址带到登录页，重新登录后接着处理
watch(
  () => authStore.isLoggedIn,
  (loggedIn, wasLoggedIn) => {
    if (loggedIn || !wasLoggedIn) return
    if (authStore.logoutReason === 'expired') {
      ElMessage.warning('登录已过期，请重新登录')
    } else if (authStore.logoutReason === 'remote') {
      ElMessage.info('登录状态已失效，请重新登录')
    }
    if (route.meta.requiresAuth) {
      router.replace({ name: 'Login', query: { redirect: route.fullPath } })
    }
  }
)

// 其他标签页退出登录时，本页同步切回未登录状态
function handleStorage(event) {
  if (event.key === 'token' && !event.newValue && authStore.isLoggedIn) {
    authStore.logout('remote')
  }
}

// 接口返回 401，说明服务端已不再认可当前会话
function handleUnauthorized() {
  if (authStore.isLoggedIn) {
    authStore.logout('expired')
  }
}

// 后台标签页的定时器会被节流，回到前台时补一次过期检查
function handleVisibilityChange() {
  if (!document.hidden) {
    authStore.checkExpiry()
  }
}

onMounted(() => {
  authStore.loadFromStorage()
  window.addEventListener('storage', handleStorage)
  window.addEventListener('auth:unauthorized', handleUnauthorized)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage)
  window.removeEventListener('auth:unauthorized', handleUnauthorized)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>

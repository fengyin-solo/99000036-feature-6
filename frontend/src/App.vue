<template>
  <div id="app">
    <Navbar />
    <router-view v-slot="{ Component, route }">
      <GuestGate
        v-if="route.meta.requiresAuth"
        :key="authStore.isLoggedIn ? 'authed' : 'guest'"
        :component="Component"
        message="登录状态已失效，请重新登录后继续处理"
      />
      <component :is="Component" v-else />
    </router-view>
    <LoginDialog />
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import LoginDialog from './components/LoginDialog.vue'
import GuestGate from './components/GuestGate.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
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

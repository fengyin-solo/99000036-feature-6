<template>
  <el-menu mode="horizontal" :ellipsis="false" class="navbar" :default-active="activeIndex">
    <el-menu-item index="home" @click="handleLogoClick">
      <el-icon><Link /></el-icon>
      <span class="logo-text">Link Collector</span>
    </el-menu-item>

    <div class="flex-grow"></div>

    <template v-if="authStore.isLoggedIn">
      <el-menu-item index="import" @click="$router.push('/import')">
        <el-icon><Upload /></el-icon>
        导入书签
      </el-menu-item>

      <el-menu-item index="dead-links" @click="$router.push('/dead-links')">
        <el-icon><Warning /></el-icon>
        死链检测
      </el-menu-item>

      <el-menu-item index="read-later" @click="$router.push('/read-later')">
        <el-icon><Clock /></el-icon>
        稍后阅读
      </el-menu-item>

      <!-- 当前登录名：仅展示，不参与跳转，也不抢高亮 -->
      <el-menu-item :index="`user-${authStore.user?.id}`" disabled>
        <el-icon><User /></el-icon>
        {{ authStore.user?.username }}
      </el-menu-item>

      <el-menu-item index="logout" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-menu-item>
    </template>

    <template v-else>
      <el-menu-item index="login" @click="handleLoginClick">
        <el-icon><User /></el-icon>
        登录
      </el-menu-item>
      <el-menu-item index="register" @click="$router.push(registerLink)">
        <el-icon><EditPen /></el-icon>
        注册
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 高亮位置跟随当前路由；登录/注册页以及未登录态下没有业务菜单可高亮
const activeIndex = computed(() => {
  const map = {
    '/': 'home',
    '/import': 'import',
    '/dead-links': 'dead-links',
    '/read-later': 'read-later',
  }
  return authStore.isLoggedIn ? map[route.path] || '' : ''
})

const registerLink = computed(() => ({
  path: '/register',
  query: route.path === '/login' ? route.query : {},
}))

function handleLogoClick() {
  if (authStore.isLoggedIn) {
    router.push('/')
  } else {
    // 未登录时留在当前地址，用登录框重新登录
    authStore.openLoginDialog('请先登录后继续操作')
  }
}

function handleLoginClick() {
  if (route.path === '/login' || route.path === '/register') {
    // 已在登录/注册页，无需再弹框
    return
  }
  authStore.openLoginDialog('请先登录后继续操作')
}

function handleLogout() {
  authStore.logout()
  ElMessage.success('已退出登录')
  // 不跳转路由：当前页面入口地址保留在地址栏，重新登录后回到刚才停下的页面
}
</script>

<style scoped>
.navbar {
  margin-bottom: 0;
  border-bottom: 1px solid #e4e7ed;
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  margin-left: 6px;
}

.flex-grow {
  flex: 1;
}

/* 用户名只做展示：去掉禁用态的置灰外观与 hover 反馈 */
.navbar :deep(.el-menu-item.is-disabled) {
  cursor: default;
  color: #303133;
  opacity: 1;
}

.navbar :deep(.el-menu-item.is-disabled:hover) {
  background-color: transparent;
  color: #303133;
}
</style>

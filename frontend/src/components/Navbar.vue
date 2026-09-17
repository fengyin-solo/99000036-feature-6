<template>
  <el-menu mode="horizontal" :ellipsis="false" :default-active="activeIndex" class="navbar">
    <el-menu-item index="/" @click="$router.push('/')">
      <el-icon><Link /></el-icon>
      <span class="logo-text">Link Collector</span>
    </el-menu-item>

    <div class="flex-grow"></div>

    <template v-if="authStore.isLoggedIn">
      <el-menu-item index="/import" @click="$router.push('/import')">
        <el-icon><Upload /></el-icon>
        导入书签
      </el-menu-item>

      <el-menu-item index="/dead-links" @click="$router.push('/dead-links')">
        <el-icon><Warning /></el-icon>
        死链检测
      </el-menu-item>

      <el-menu-item index="/read-later" @click="$router.push('/read-later')">
        <el-icon><Clock /></el-icon>
        稍后阅读
      </el-menu-item>

      <el-sub-menu index="user">
        <template #title>
          <el-icon><User /></el-icon>
          {{ authStore.user?.username }}
        </template>
        <el-menu-item index="logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-menu-item>
      </el-sub-menu>
    </template>

    <template v-else>
      <el-menu-item index="/login" @click="$router.push('/login')">
        <el-icon><User /></el-icon>
        登录
      </el-menu-item>
      <el-menu-item index="/register" @click="$router.push('/register')">
        <el-icon><EditPen /></el-icon>
        注册
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()

// 高亮跟随当前路由，会话切换后自动落到对应入口上
const activeIndex = computed(() => route.path)

function handleLogout() {
  authStore.logout('manual')
  ElMessage.success('已退出登录')
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
</style>

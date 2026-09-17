<template>
  <component :is="Component" v-if="authStore.isLoggedIn" />

  <div v-else class="guest-gate">
    <el-card class="guest-card" shadow="never">
      <el-result icon="warning" title="需要登录" :sub-title="message">
        <template #extra>
          <el-button type="primary" @click="authStore.openLoginDialog()">
            重新登录
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

defineProps({
  Component: {
    type: [Object, Function],
    required: true,
  },
  message: {
    type: String,
    default: '登录状态已失效，请重新登录后继续处理',
  },
})
</script>

<style scoped>
.guest-gate {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.guest-card {
  border: none;
}
</style>

<template>
  <el-dialog
    :model-value="authStore.loginDialogVisible"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="canClose"
    width="400px"
    align-center
    @update:model-value="(val) => !val && authStore.closeLoginDialog()"
  >
    <template #header>
      <div class="dialog-header">
        <h3>重新登录</h3>
        <p>{{ authStore.loginDialogMessage }}</p>
      </div>
    </template>

    <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码"
          prefix-icon="Lock"
          size="large"
          show-password
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-form-item class="dialog-actions">
        <el-button
          v-if="canClose"
          size="large"
          @click="authStore.closeLoginDialog()"
        >
          暂不登录
        </el-button>
        <el-button type="primary" :loading="loading" size="large" class="login-btn" @click="handleLogin">
          登录
        </el-button>
      </el-form-item>
    </el-form>

    <div class="dialog-footer">
      还没有账号？
      <a href="javascript:void(0)" @click="goRegister">立即注册</a>
    </div>

    <div class="demo-hint">
      演示账号：<strong>demo</strong> / <strong>demo123</strong>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 未登录直接访问受保护页会被守卫带去 /login；其余场景都允许关闭对话框
const canClose = computed(() => !route.meta.requiresAuth || authStore.isLoggedIn)

const redirectQuery = computed(() => {
  return route.fullPath && route.path !== '/login' ? { redirect: route.fullPath } : {}
})

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    authStore.closeLoginDialog()
    formRef.value?.resetFields()
    ElMessage.success('登录成功')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}

function goRegister() {
  authStore.closeLoginDialog()
  router.push({ path: '/register', query: redirectQuery.value })
}
</script>

<style scoped>
.dialog-header h3 {
  margin: 0 0 6px 0;
  color: #303133;
}

.dialog-header p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.dialog-actions {
  margin-bottom: 0;
}

.dialog-actions .login-btn {
  flex: 1;
}

.dialog-footer {
  text-align: center;
  margin-top: 4px;
  color: #606266;
  font-size: 14px;
}

.dialog-footer a {
  color: #409eff;
  text-decoration: none;
}

.demo-hint {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin-top: 12px;
}
</style>

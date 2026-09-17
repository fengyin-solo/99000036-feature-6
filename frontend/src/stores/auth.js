import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'
import { useLinksStore } from './links'
import { useReadLaterStore } from './readLater'

// 解析 JWT 的过期时间（exp 为秒级时间戳），返回毫秒时间戳；解析失败返回 null
function parseTokenExpiry(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

let expiryTimer = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const expiresAt = ref(null)
  // 最近一次退出的原因：manual（主动退出）/ expired（会话失效）/ remote（在别处退出）
  const logoutReason = ref(null)
  let initialized = false

  const isLoggedIn = computed(() => !!token.value)

  function clearExpiryTimer() {
    if (expiryTimer) {
      clearTimeout(expiryTimer)
      expiryTimer = null
    }
  }

  function scheduleExpiryCheck() {
    clearExpiryTimer()
    if (!expiresAt.value) return
    const delay = expiresAt.value - Date.now()
    if (delay <= 0) {
      logout('expired')
      return
    }
    // 到期即切回未登录状态，不等到用户下一次操作
    expiryTimer = setTimeout(() => logout('expired'), delay)
  }

  function applySession(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    expiresAt.value = parseTokenExpiry(newToken)
    logoutReason.value = null
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    scheduleExpiryCheck()
  }

  function loadFromStorage() {
    if (initialized) return
    initialized = true
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (!storedToken || !storedUser) return
    const expiry = parseTokenExpiry(storedToken)
    if (expiry && expiry <= Date.now()) {
      // 本地会话已过期，直接清除，按未登录处理
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return
    }
    token.value = storedToken
    user.value = JSON.parse(storedUser)
    expiresAt.value = expiry
    scheduleExpiryCheck()
  }

  async function login(username, password) {
    const response = await authApi.login(username, password)
    applySession(response.data.token, response.data.user)
    return response.data
  }

  async function register(username, email, password) {
    const response = await authApi.register(username, email, password)
    applySession(response.data.token, response.data.user)
    return response.data
  }

  function logout(reason = 'manual') {
    if (!token.value && !user.value) return
    logoutReason.value = reason
    user.value = null
    token.value = null
    expiresAt.value = null
    clearExpiryTimer()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 退出后清空上一会话的页面选择，重新登录时不沿用
    useLinksStore().resetState()
    useReadLaterStore().resetState()
  }

  // 回到前台或路由切换时调用，发现已过期立即失效
  function checkExpiry() {
    if (token.value && expiresAt.value && Date.now() >= expiresAt.value) {
      logout('expired')
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    logoutReason,
    loadFromStorage,
    login,
    register,
    logout,
    checkExpiry,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'
import { useLinksStore } from './links'
import { useReadLaterStore } from './readLater'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

// 提前量：在 JWT 真正到期前就切回未登录态，避免用户下一次操作时才发现失效
const EXPIRY_LEAD_MS = 60 * 1000
// 兜底轮询间隔：后台标签页的时钟可能被浏览器节流
const SESSION_CHECK_INTERVAL_MS = 30 * 1000

function readTokenExpiry(token) {
  try {
    const base64Payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(window.atob(base64Payload))
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const expiresAt = ref(null)
  const loginDialogVisible = ref(false)
  const loginDialogMessage = ref('登录状态已失效，请重新登录后继续操作')

  const isLoggedIn = computed(() => !!token.value)

  let watchersStarted = false

  function applySession(tokenValue, userValue) {
    token.value = tokenValue
    user.value = userValue
    expiresAt.value = readTokenExpiry(tokenValue)
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userValue))
  }

  // 退出/失效时清空业务数据与用户在页面上的选择（筛选、页码、回顾状态等），
  // 保证重新登录进入后不会沿用先前的状态
  function resetBusinessData() {
    useLinksStore().reset()
    useReadLaterStore().reset()
  }

  function clearSession() {
    token.value = null
    user.value = null
    expiresAt.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    resetBusinessData()
  }

  function isSessionDue() {
    return (
      !!token.value &&
      expiresAt.value !== null &&
      Date.now() >= expiresAt.value - EXPIRY_LEAD_MS
    )
  }

  // 会话失效（到期 / 别处退出 / 接口 401）：
  // 不做路由跳转，当前页面入口地址保留在地址栏，弹出登录框等用户重新登录
  function handleSessionExpired(reason = 'expired') {
    if (!token.value) return
    clearSession()
    loginDialogMessage.value =
      reason === 'remote'
        ? '你已在其他页面退出登录，请重新登录'
        : '登录状态已失效，请重新登录后继续操作'
    loginDialogVisible.value = true
  }

  function checkSession() {
    if (isSessionDue()) handleSessionExpired('expired')
  }

  function startSessionWatchers() {
    if (watchersStarted) return
    watchersStarted = true

    // 临近到期时主动切换，无需等待用户操作
    window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS)

    // 标签页从后台切回时立即复查（后台时钟可能被节流）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkSession()
    })

    // 其他标签页登录/退出会触发 storage 事件
    window.addEventListener('storage', (event) => {
      if (event.key !== TOKEN_KEY) return
      if (event.newValue === null) {
        // 已在别处退出
        handleSessionExpired('remote')
      } else if (event.newValue !== token.value) {
        // 其他标签页切换了账号，整页刷新以保证数据归属一致
        window.location.reload()
      }
    })
  }

  // 应用启动时调用（需在首次路由守卫之前）
  function initialize() {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedToken && storedUser) {
      const expiry = readTokenExpiry(storedToken)
      const expired = expiry !== null && Date.now() >= expiry - EXPIRY_LEAD_MS
      if (expired) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      } else {
        token.value = storedToken
        expiresAt.value = expiry
        try {
          user.value = JSON.parse(storedUser)
        } catch {
          user.value = null
        }
      }
    }
    startSessionWatchers()
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

  // 主动退出：保留当前 URL，页面内容由 GuestGate 接管为未登录样式
  function logout() {
    if (!token.value) return
    clearSession()
  }

  function openLoginDialog(message) {
    if (message) loginDialogMessage.value = message
    loginDialogVisible.value = true
  }

  function closeLoginDialog() {
    loginDialogVisible.value = false
  }

  return {
    user,
    token,
    expiresAt,
    isLoggedIn,
    loginDialogVisible,
    loginDialogMessage,
    initialize,
    login,
    register,
    logout,
    handleSessionExpired,
    openLoginDialog,
    closeLoginDialog,
  }
})

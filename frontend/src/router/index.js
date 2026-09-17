import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Import from '../views/Import.vue'
import DeadLinks from '../views/DeadLinks.vue'
import ReadLater from '../views/ReadLater.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guest: true },
  },
  {
    path: '/import',
    name: 'Import',
    component: Import,
    meta: { requiresAuth: true },
  },
  {
    path: '/dead-links',
    name: 'DeadLinks',
    component: DeadLinks,
    meta: { requiresAuth: true },
  },
  {
    path: '/read-later',
    name: 'ReadLater',
    component: ReadLater,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function safeRedirect(target) {
  if (typeof target !== 'string' || !target.startsWith('/')) return '/'
  // 防止 //host 之类的协议相对 URL 跳转到站外
  if (target.startsWith('//')) return '/'
  return target
}

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 直接访问（如刷新、手输地址）时仍保留目标地址，登录后跳回原页面
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next({ path: safeRedirect(to.query.redirect) })
  } else {
    next()
  }
})

export default router

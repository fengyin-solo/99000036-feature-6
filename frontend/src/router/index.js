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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()
  authStore.checkExpiry()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 把目标地址留在地址栏，重新登录后回到刚才停下的页面
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isLoggedIn) {
    const redirect = to.query.redirect
    next(isSafeRedirect(redirect) ? redirect : { name: 'Home' })
  } else {
    next()
  }
})

// 只接受站内相对路径，防止开放重定向
function isSafeRedirect(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

export default router

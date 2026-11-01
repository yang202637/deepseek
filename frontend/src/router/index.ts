import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/users' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/pages/Users.vue'),
    meta: { title: '用户管理' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/pages/Roles.vue'),
    meta: { title: '角色管理' },
  },
  {
    path: '/permissions',
    name: 'permissions',
    component: () => import('@/pages/Permissions.vue'),
    meta: { title: '权限管理' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFound.vue'),
    meta: { title: '404' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  document.title = `${to.meta.title || '页面'} · 辰光 Agent 平台`
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    await auth.init()
  }
  if (to.path !== '/login' && !auth.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router

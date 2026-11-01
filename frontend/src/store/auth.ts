// store/auth.ts — 认证状态管理（Pinia）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/apis/modules/auth'
import type { LoginRequest, AuthUser } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<AuthUser | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isSuperuser = computed(() => user.value?.is_superuser ?? false)
  const permissions = computed(() => user.value?.permissions ?? [])
  const dataScope = computed<'all' | 'self'>(() => user.value?.dataScope ?? 'self')

  function hasPermission(code: string): boolean {
    if (isSuperuser.value) return true
    return permissions.value.includes(code)
  }

  async function login(req: LoginRequest) {
    const resp = await authService.login(req)
    token.value = resp.access_token
    localStorage.setItem('token', resp.access_token)
    await fetchUser()
  }

  async function fetchUser() {
    const u = await authService.getMe()
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function init() {
    const saved = localStorage.getItem('token')
    if (saved) {
      token.value = saved
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        user.value = JSON.parse(savedUser)
      } else {
        try {
          await fetchUser()
        } catch {
          logout()
        }
      }
    }
  }

  return { token, user, isLoggedIn, isSuperuser, permissions, dataScope, hasPermission, login, logout, init }
})

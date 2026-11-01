// store/user.ts — 用户状态管理（Pinia）
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PageResult, User, UserPayload } from '@/types'
import * as userService from '@/services/user'

export const useUserStore = defineStore('user', () => {
  const list = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchPage(page = 1, pageSize = 10, keyword?: string) {
    loading.value = true
    try {
      const res: PageResult<User> = await userService.fetchUserPage({ page, pageSize, keyword })
      list.value = res.items
      total.value = res.total
      return res
    } finally {
      loading.value = false
    }
  }

  async function add(data: UserPayload) {
    const user = await userService.addUser(data)
    await fetchPage(1, 10)
    return user
  }

  async function update(id: number, data: Partial<UserPayload>) {
    const user = await userService.editUser(id, data)
    await fetchPage(1, 10)
    return user
  }

  async function remove(id: number) {
    await userService.removeUser(id)
    await fetchPage(1, 10)
  }

  return { list, total, loading, fetchPage, add, update, remove }
})
